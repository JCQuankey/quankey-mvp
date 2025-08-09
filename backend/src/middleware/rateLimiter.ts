import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { db } from '../services/database.service';

// Store en memoria - Redis vendrá con AWS
const bruteForcePrevention = new Map<string, number>();

export const createRateLimiter = (
  name: string,
  windowMs: number,
  max: number,
  blockDuration = 3600000 // 1 hora por defecto
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: (req: Request) => {
      // IP + User ID si existe
      const userId = (req as any).user?.id || 'anonymous';
      return `${req.ip}:${userId}`;
    },
    
    handler: async (req: Request, res: Response) => {
      const key = `${req.ip}:${(req as any).user?.id || 'anonymous'}`;
      
      // Incrementar contador de violaciones
      const violations = (bruteForcePrevention.get(key) || 0) + 1;
      bruteForcePrevention.set(key, violations);
      
      // Block exponencial
      if (violations > 3) {
        const blockTime = blockDuration * Math.pow(2, violations - 3);
        
        await db.auditOperation({
          userId: (req as any).user?.id || 'anonymous',
          action: 'RATE_LIMIT_VIOLATION',
          resource: req.path,
          result: 'FAILURE',
          metadata: {
            violations,
            blockTime,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
        
        return res.status(429).json({
          error: 'Too many violations. Blocked.',
          retryAfter: Math.floor(blockTime / 1000)
        });
      }
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: windowMs / 1000
      });
    },
    
    skip: (req: Request) => {
      // Nunca skipear rate limiting
      return false;
    }
  });
};

// Límites AGRESIVOS - Sin piedad
export const authLimiter = createRateLimiter(
  'auth',
  15 * 60 * 1000, // 15 minutos
  3,              // 3 intentos
  24 * 60 * 60 * 1000 // Block 24h
);

export const apiLimiter = createRateLimiter(
  'api',
  60 * 1000,  // 1 minuto
  30,         // 30 requests
  60 * 60 * 1000 // Block 1h
);

export const passwordGenLimiter = createRateLimiter(
  'password-gen',
  60 * 1000,  // 1 minuto
  5,          // 5 generaciones
  60 * 60 * 1000 // Block 1h
);

export const vaultLimiter = createRateLimiter(
  'vault',
  60 * 1000,  // 1 minuto
  20,         // 20 operaciones
  60 * 60 * 1000 // Block 1h
);