// SECURE AUTHENTICATION MIDDLEWARE
// JWT con Ed25519 y validación estricta - Sin algorithm confusion

import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { createHash, timingSafeEqual } from 'crypto';
import { getSecureDatabase } from '../services/secureDatabaseService';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    quantumResistant: boolean;
    sessionId: string;
  };
}

export class SecureAuthMiddleware {
  private readonly publicKey: Promise<jose.KeyLike>;
  private readonly privateKey: Promise<jose.KeyLike>;
  private readonly issuer = 'https://api.quankey.xyz';
  private readonly audience = 'quankey-vault';
  private readonly algorithm = 'EdDSA'; // 🔒 FORZADO - No algorithm confusion
  private db = getSecureDatabase();
  
  constructor() {
    // 🔑 Cargar claves Ed25519 de forma segura
    this.publicKey = this.loadPublicKey();
    this.privateKey = this.loadPrivateKey();
  }
  
  private async loadPublicKey(): Promise<jose.KeyLike> {
    const key = process.env.JWT_PUBLIC_KEY;
    if (!key) {
      throw new Error('SECURITY: JWT public key not configured');
    }
    
    // Verificar que es Ed25519
    const keyObject = await jose.importSPKI(key, 'EdDSA');
    return keyObject;
  }
  
  private async loadPrivateKey(): Promise<jose.KeyLike> {
    const key = process.env.JWT_PRIVATE_KEY;
    if (!key) {
      throw new Error('SECURITY: JWT private key not configured');
    }
    
    // Verificar que es Ed25519
    const keyObject = await jose.importPKCS8(key, 'EdDSA');
    return keyObject;
  }
  
  // 🎟️ Generar JWT seguro
  async generateToken(user: {
    id: string;
    email: string;
    quantumResistant: boolean;
  }): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      sub: user.id,
      email: user.email,
      quantumResistant: user.quantumResistant,
      sessionId,
      iss: this.issuer,
      aud: this.audience,
      iat: now,
      exp: now + (60 * 60), // 1 hora
      nbf: now,
      jti: this.generateJTI(user.id, sessionId)
    };
    
    const privateKey = await this.privateKey;
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ 
        alg: this.algorithm,
        typ: 'JWT',
        kid: this.getKeyId()
      })
      .sign(privateKey);
    
    // 💾 Guardar sesión en base de datos
    await this.storeSession(user.id, sessionId, now + (60 * 60));
    
    // 📝 Auditar generación de token
    await this.db.auditLog(user.id, 'TOKEN_GENERATED', {
      sessionId,
      algorithm: this.algorithm,
      expiresAt: new Date((now + (60 * 60)) * 1000)
    });
    
    return token;
  }
  
  // 🛡️ Validar token con verificaciones exhaustivas
  async validateToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = this.extractToken(req);
      if (!token) {
        await this.auditFailedAuth('NO_TOKEN', req);
        return res.status(401).json({ error: 'No token provided' });
      }
      
      // 🔍 Verificar formato del token antes de procesarlo
      if (!this.isValidJWTFormat(token)) {
        await this.auditFailedAuth('INVALID_FORMAT', req);
        return res.status(401).json({ error: 'Invalid token format' });
      }
      
      // 🔐 Verificar firma y claims con validación estricta
      const publicKey = await this.publicKey;
      const { payload } = await jose.jwtVerify(token, publicKey, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: [this.algorithm], // 🚨 SOLO Ed25519
        clockTolerance: 0, // Sin tolerancia de tiempo
        maxTokenAge: '1h',
        requiredClaims: ['sub', 'email', 'sessionId', 'quantumResistant']
      });
      
      // 🔍 Validar estructura del payload
      if (!this.isValidPayload(payload)) {
        await this.auditFailedAuth('INVALID_PAYLOAD', req);
        return res.status(401).json({ error: 'Invalid token structure' });
      }
      
      // 🔍 Verificar que la sesión existe y es válida
      const sessionValid = await this.verifySession(
        payload.sub as string,
        payload.sessionId as string
      );
      if (!sessionValid) {
        await this.auditFailedAuth('INVALID_SESSION', req);
        return res.status(401).json({ error: 'Session expired or invalid' });
      }
      
      // 🔍 Verificar que el usuario existe y no está bloqueado
      const user = await this.verifyUser(payload.sub as string);
      if (!user) {
        await this.auditFailedAuth('USER_NOT_FOUND', req);
        return res.status(401).json({ error: 'User not found or blocked' });
      }
      
      // 🔍 Verificar JTI contra replay attacks
      const jtiValid = await this.verifyJTI(payload.jti as string);
      if (!jtiValid) {
        await this.auditFailedAuth('JTI_REPLAY', req);
        return res.status(401).json({ error: 'Token replay detected' });
      }
      
      // 🎯 Set user context para RLS
      await this.db.setUserContext(user.id);
      
      // ✅ Adjuntar usuario al request
      req.user = {
        id: user.id,
        email: user.email,
        quantumResistant: user.quantumResistant,
        sessionId: payload.sessionId as string
      };
      
      // 📝 Auditar autenticación exitosa
      await this.db.auditLog(user.id, 'AUTH_SUCCESS', {
        ip: this.getClientIP(req),
        userAgent: req.headers['user-agent'],
        sessionId: payload.sessionId,
        quantumResistant: user.quantumResistant
      });
      
      next();
    } catch (error) {
      console.error('🚨 Token validation failed:', error);
      await this.auditFailedAuth('VALIDATION_ERROR', req, error.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    
    const token = authHeader.substring(7);
    
    // Verificar longitud razonable
    if (token.length < 100 || token.length > 2000) return null;
    
    return token;
  }
  
  private isValidJWTFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }
  
  private isValidPayload(payload: jose.JWTPayload): boolean {
    const required = [
      'sub', 'email', 'sessionId', 'quantumResistant',
      'iss', 'aud', 'iat', 'exp', 'jti'
    ];
    
    return required.every(field => payload[field] !== undefined) &&
           payload.iss === this.issuer &&
           payload.aud === this.audience &&
           typeof payload.sub === 'string' &&
           typeof payload.email === 'string' &&
           typeof payload.sessionId === 'string' &&
           typeof payload.quantumResistant === 'boolean';
  }
  
  private async verifyUser(userId: string): Promise<any> {
    try {
      // Usar query preparada para prevenir SQL injection
      const user = await this.db.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          quantumResistant: true,
          blocked: true,
          deletedAt: true,
          lastLoginAt: true
        }
      });
      
      if (!user || user.blocked || user.deletedAt) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('User verification failed:', error);
      return null;
    }
  }
  
  private async verifySession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const session = await this.db.prisma.session.findUnique({
        where: { 
          userId_sessionId: {
            userId,
            sessionId
          }
        },
        select: {
          expiresAt: true,
          revoked: true
        }
      });
      
      if (!session || session.revoked || session.expiresAt < new Date()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Session verification failed:', error);
      return false;
    }
  }
  
  private async verifyJTI(jti: string): Promise<boolean> {
    // Verificar que el JTI no ha sido usado (prevenir replay)
    // En producción: usar Redis/cache para JTI blacklist
    return true; // Placeholder - implementar blacklist
  }
  
  private generateSessionId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}-${process.hrtime.bigint()}`)
      .digest('hex');
  }
  
  private generateJTI(userId: string, sessionId: string): string {
    return createHash('sha256')
      .update(`${userId}:${sessionId}:${Date.now()}`)
      .digest('hex');
  }
  
  private getKeyId(): string {
    return createHash('sha256')
      .update(process.env.JWT_PUBLIC_KEY || '')
      .digest('hex')
      .substring(0, 8);
  }
  
  private async storeSession(userId: string, sessionId: string, expiresAt: number): Promise<void> {
    await this.db.prisma.session.create({
      data: {
        userId,
        sessionId,
        expiresAt: new Date(expiresAt * 1000),
        createdAt: new Date(),
        revoked: false
      }
    });
  }
  
  private async auditFailedAuth(reason: string, req: Request, details?: string): Promise<void> {
    await this.db.auditLog('anonymous', 'AUTH_FAILED', {
      reason,
      details,
      ip: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      path: req.path,
      timestamp: new Date()
    });
  }
  
  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           req.connection.remoteAddress || 
           'unknown';
  }
  
  // 🚪 Logout seguro
  async revokeToken(userId: string, sessionId: string): Promise<void> {
    await this.db.prisma.session.update({
      where: {
        userId_sessionId: {
          userId,
          sessionId
        }
      },
      data: {
        revoked: true,
        revokedAt: new Date()
      }
    });
    
    await this.db.auditLog(userId, 'SESSION_REVOKED', { sessionId });
  }
  
  // 🧹 Cleanup de sesiones expiradas
  async cleanupExpiredSessions(): Promise<void> {
    const deleted = await this.db.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revoked: true, revokedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      }
    });
    
    console.log(`🧹 Cleaned up ${deleted.count} expired sessions`);
  }
}