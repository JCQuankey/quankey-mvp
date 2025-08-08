// SECURITY MIDDLEWARE 
// Rate limiting, DDoS protection, input sanitization

import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { getSecureDatabase } from '../services/secureDatabaseService';

interface SecurityRequest extends Request {
  user?: {
    id: string;
    email: string;
    quantumResistant: boolean;
    sessionId: string;
  };
}

export class SecurityMiddleware {
  private redis: Redis;
  private db = getSecureDatabase();
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      tls: process.env.NODE_ENV === 'production' ? {} : undefined,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Configuración de seguridad
      connectTimeout: 5000,
      commandTimeout: 5000
    });
    
    // Handle Redis errors
    this.redis.on('error', (error) => {
      console.error('🚨 Redis connection error:', error);
    });
    
    this.redis.on('ready', () => {
      console.log('✅ Redis connected for security middleware');
    });
  }
  
  // 🛡️ Headers de seguridad estrictos
  get securityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Para componentes React
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.quankey.xyz', 'wss://api.quankey.xyz'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'none'"],
          frameSrc: ["'none'"],
          childSrc: ["'none'"],
          workerSrc: ["'self'"],
          manifestSrc: ["'self'"],
          upgradeInsecureRequests: []
        }
      },
      crossOriginEmbedderPolicy: false, // Para WebAuthn
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 63072000, // 2 años
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true
    });
  }
  
  // 🚫 Rate limiting por endpoint con Redis
  createRateLimiter(options: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyPrefix?: string;
  }) {
    const { windowMs, max, skipSuccessfulRequests = false, skipFailedRequests = false, keyPrefix = 'rl' } = options;
    
    return rateLimit({
      store: new RedisStore({
        client: this.redis,
        prefix: keyPrefix + ':'
      }),
      windowMs,
      max,
      skipSuccessfulRequests,
      skipFailedRequests,
      message: {
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      // 🔍 Identificador personalizado (IP + User ID si existe)
      keyGenerator: (req: SecurityRequest) => {
        const userId = req.user?.id;
        const ip = this.getClientIP(req);
        return userId ? `${ip}:${userId}` : ip;
      },
      // 📝 Handler personalizado para logging
      handler: (req: SecurityRequest, res: Response) => {
        this.logRateLimitExceeded(req, keyPrefix);
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: res.getHeader('Retry-After'),
          limit: max,
          window: Math.ceil(windowMs / 1000)
        });
      }
    });
  }
  
  // 🐌 Slow down - Ralentizar requests progresivamente
  createSlowDown(options: {
    windowMs: number;
    delayAfter: number;
    delayMs: number;
    maxDelayMs?: number;
  }) {
    const { windowMs, delayAfter, delayMs, maxDelayMs = 10000 } = options;
    
    return slowDown({
      store: new RedisStore({
        client: this.redis,
        prefix: 'sd:'
      }),
      windowMs,
      delayAfter,
      delayMs,
      maxDelayMs,
      keyGenerator: (req: SecurityRequest) => {
        const userId = req.user?.id;
        const ip = this.getClientIP(req);
        return userId ? `${ip}:${userId}` : ip;
      }
    });
  }
  
  // 🔐 Rate limiters específicos por endpoint
  get authLimiter() {
    return this.createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // 5 intentos de login
      skipSuccessfulRequests: true,
      keyPrefix: 'auth'
    });
  }
  
  get apiLimiter() {
    return this.createRateLimiter({
      windowMs: 60 * 1000, // 1 minuto
      max: 100, // 100 requests por minuto
      keyPrefix: 'api'
    });
  }
  
  get passwordGenerationLimiter() {
    return this.createRateLimiter({
      windowMs: 60 * 1000, // 1 minuto
      max: 10, // 10 generaciones por minuto
      keyPrefix: 'pwgen'
    });
  }
  
  get vaultLimiter() {
    return this.createRateLimiter({
      windowMs: 60 * 1000, // 1 minuto
      max: 50, // 50 operaciones de vault por minuto
      keyPrefix: 'vault'
    });
  }
  
  get strictAuthLimiter() {
    return this.createRateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 3, // Solo 3 intentos por hora tras múltiples fallos
      keyPrefix: 'strict_auth'
    });
  }
  
  // 🐌 Auth slow down
  get authSlowDown() {
    return this.createSlowDown({
      windowMs: 15 * 60 * 1000, // 15 minutos
      delayAfter: 2, // Después de 2 intentos
      delayMs: 500, // 500ms de delay inicial
      maxDelayMs: 10000 // Máximo 10 segundos
    });
  }
  
  // 🧹 Sanitización de input - Prevenir XSS, SQL injection, prototype pollution
  sanitizeInput(input: any): any {
    if (input === null || input === undefined) {
      return input;
    }
    
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object') {
      return this.sanitizeObject(input);
    }
    
    return input;
  }
  
  private sanitizeString(str: string): string {
    return str
      // Eliminar caracteres peligrosos para XSS
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      // Limitar longitud para prevenir DoS
      .substring(0, 10000)
      .trim();
  }
  
  private sanitizeObject(obj: any): any {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // 🚨 CRÍTICO: Prevenir prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        console.warn('🚨 Prototype pollution attempt detected:', key);
        continue;
      }
      
      // Limitar número de propiedades
      if (Object.keys(sanitized).length >= 100) {
        console.warn('🚨 Object too large, truncating');
        break;
      }
      
      // Sanitizar key y value
      const sanitizedKey = this.sanitizeString(key);
      const sanitizedValue = this.sanitizeInput(value);
      
      sanitized[sanitizedKey] = sanitizedValue;
    }
    
    return sanitized;
  }
  
  // 🔍 Middleware de sanitización
  sanitizeMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Sanitizar body
    if (req.body) {
      req.body = this.sanitizeInput(req.body);
    }
    
    // Sanitizar query params
    if (req.query) {
      req.query = this.sanitizeInput(req.query);
    }
    
    // Sanitizar params
    if (req.params) {
      req.params = this.sanitizeInput(req.params);
    }
    
    next();
  };
  
  // 🔒 CORS estricto
  corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const allowedOrigins = [
      'https://quankey.xyz',
      'https://www.quankey.xyz'
    ];
    
    // En desarrollo, permitir localhost
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }
    
    const origin = req.headers.origin;
    
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 horas
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    
    next();
  };
  
  // 📊 Request size limits
  requestSizeLimits = {
    json: { limit: '1mb' }, // Para operaciones del vault
    urlencoded: { limit: '1mb', extended: false },
    text: { limit: '100kb' },
    raw: { limit: '100kb' }
  };
  
  // 📝 Logging de eventos de seguridad
  private async logRateLimitExceeded(req: SecurityRequest, type: string): Promise<void> {
    const userId = req.user?.id || 'anonymous';
    const ip = this.getClientIP(req);
    
    console.warn(`🚨 Rate limit exceeded [${type}]:`, {
      userId,
      ip,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    
    // Auditar en base de datos
    await this.db.auditLog(userId, 'RATE_LIMIT_EXCEEDED', {
      type,
      ip,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent']
    });
  }
  
  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.connection as any)?.socket?.remoteAddress || 
           'unknown';
  }
  
  // 🧹 Cleanup Redis connections
  async cleanup(): Promise<void> {
    await this.redis.quit();
  }
  
  // 🏥 Health check del middleware de seguridad
  async healthCheck(): Promise<{
    redis: boolean;
    rateLimiting: boolean;
  }> {
    try {
      await this.redis.ping();
      return {
        redis: true,
        rateLimiting: true
      };
    } catch (error) {
      console.error('Security middleware health check failed:', error);
      return {
        redis: false,
        rateLimiting: false
      };
    }
  }
}