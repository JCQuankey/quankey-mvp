import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { db } from '../services/database.service';
import { createHash } from 'crypto';

// Use the global Express.Request type with user property defined in types/express.d.ts

export class AuthMiddleware {
  private static publicKey: any;
  private static privateKey: any;
  private static blacklistedTokens = new Set<string>();
  
  static async initialize() {
    // Cargar clave pública Ed25519 - O MORIR
    const publicKey = process.env.JWT_PUBLIC_KEY;
    const privateKey = process.env.JWT_PRIVATE_KEY;
    
    if (!publicKey || !privateKey) {
      console.error('FATAL: JWT_PUBLIC_KEY or JWT_PRIVATE_KEY not configured');
      process.exit(1);
    }
    
    try {
      this.publicKey = await jose.importSPKI(publicKey, 'EdDSA');
      this.privateKey = await jose.importPKCS8(privateKey, 'EdDSA');
      console.log('✅ Ed25519 JWT signing/verification initialized');
    } catch (error) {
      console.error('FATAL: Invalid JWT keys');
      process.exit(1);
    }
  }
  
  static async generateToken(user: { userId: string; email: string }) {
    if (!this.privateKey) {
      throw new Error('JWT not initialized');
    }
    
    const jwt = await new jose.SignJWT({
      sub: user.userId,
      email: user.email
    })
      .setProtectedHeader({ alg: 'EdDSA' })
      .setIssuedAt()
      .setIssuer('quankey-auth')
      .setAudience('quankey-api')
      .setExpirationTime('15m')
      .sign(this.privateKey);
    
    return jwt;
  }
  
  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    return AuthMiddleware.validateRequest(req, res, next);
  }
  
  static async validateRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const startTime = Date.now();
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      await db.auditOperation({
        userId: 'anonymous',
        action: 'AUTH_ATTEMPT',
        resource: req.path,
        result: 'FAILURE',
        metadata: { reason: 'No token', ip: req.ip }
      });
      
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check blacklist
    const tokenHash = createHash('sha256').update(token).digest('hex');
    if (this.blacklistedTokens.has(tokenHash)) {
      return res.status(401).json({ error: 'Token revoked' });
    }
    
    try {
      // Validación ESTRICTA - Sin excepciones
      const { payload } = await jose.jwtVerify(token, this.publicKey, {
        algorithms: ['EdDSA'], // SOLO EdDSA
        issuer: 'quankey-auth',
        audience: 'quankey-api',
        maxTokenAge: '15m', // 15 minutos MÁXIMO
        clockTolerance: 0
      });
      
      // Verificar usuario en DB - usando la instancia correcta
      const { prisma } = await import('../services/database.service');
      const user = await prisma.user.findUnique({
        where: { id: payload.sub as string },
        select: {
          id: true,
          username: true
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Attach user
      req.user = {
        id: user.id,
        username: user.username
      };
      
      // Audit success
      await db.auditOperation({
        userId: user.id,
        action: 'AUTH_SUCCESS',
        resource: req.path,
        result: 'SUCCESS',
        metadata: { 
          duration: Date.now() - startTime,
          ip: req.ip
        }
      });
      
      next();
      
    } catch (error) {
      await db.auditOperation({
        userId: 'unknown',
        action: 'AUTH_FAILURE',
        resource: req.path,
        result: 'FAILURE',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: req.ip,
          duration: Date.now() - startTime
        }
      });
      
      return res.status(401).json({ error: 'Invalid authentication' });
    }
  }
  
  // Revocación de tokens
  static revokeToken(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    this.blacklistedTokens.add(tokenHash);
    
    // Limpiar tokens viejos cada hora
    setTimeout(() => {
      this.blacklistedTokens.delete(tokenHash);
    }, 60 * 60 * 1000);
  }
}

// Auth middleware is ready