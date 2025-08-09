import { Request, Response, NextFunction } from 'express';

// Express Request interface is extended in types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      session?: {
        csrfToken?: string;
        [key: string]: any;
      };
    }
  }
}
import crypto from 'crypto';
import { AuditLogger } from '../services/auditLogger.service';

/**
 * 🔒 CSRF PROTECTION MIDDLEWARE
 * Military-grade CSRF protection for Quankey
 * Implements double-submit cookie pattern with additional origin validation
 */

export class CSRFProtectionMiddleware {
  private static auditLogger = new AuditLogger();
  private static readonly CSRF_TOKEN_LENGTH = 32;
  private static readonly ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || 'https://quankey.xyz',
    process.env.CORS_ORIGIN || 'https://quankey.xyz',
    'http://localhost:3000', // Development only
  ];

  /**
   * 🔐 GENERATE CSRF TOKEN
   */
  static generateToken(): string {
    return crypto.randomBytes(this.CSRF_TOKEN_LENGTH).toString('hex');
  }

  /**
   * 🛡️ VALIDATE CSRF TOKEN
   */
  private static validateToken(headerToken: string, cookieToken: string): boolean {
    if (!headerToken || !cookieToken) return false;
    if (headerToken.length !== this.CSRF_TOKEN_LENGTH * 2) return false;
    if (cookieToken.length !== this.CSRF_TOKEN_LENGTH * 2) return false;
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(headerToken, 'hex'),
      Buffer.from(cookieToken, 'hex')
    );
  }

  /**
   * 🌐 VALIDATE ORIGIN
   */
  private static validateOrigin(origin: string | undefined, referer: string | undefined): boolean {
    // Check Origin header first
    if (origin) {
      return this.ALLOWED_ORIGINS.includes(origin);
    }

    // Fallback to Referer header
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
        return this.ALLOWED_ORIGINS.includes(refererOrigin);
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * 🔑 PROVIDE CSRF TOKEN
   * Middleware to provide CSRF token to client
   */
  static provideToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Generate new token if not exists
      let csrfToken = req.session?.csrfToken;
      if (!csrfToken) {
        csrfToken = CSRFProtectionMiddleware.generateToken();
        if (req.session) {
          req.session.csrfToken = csrfToken;
        }
      }

      // Set CSRF token in cookie (secure, httpOnly for double-submit pattern)
      res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false, // Must be readable by JavaScript for SPA
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      });

      // Also provide in response header for SPAs
      res.setHeader('X-CSRF-Token', csrfToken);

      next();
    } catch (error) {
      CSRFProtectionMiddleware.auditLogger.logSecurityEvent({
        type: 'CSRF_TOKEN_GENERATION_ERROR',
        userId: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.path}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high'
      });

      res.status(500).json({
        error: 'Security token error',
        message: 'Unable to generate security token'
      });
    }
  }

  /**
   * 🛡️ VALIDATE CSRF TOKEN MIDDLEWARE
   * Middleware to validate CSRF token for state-changing requests
   */
  static validateCSRF(req: Request, res: Response, next: NextFunction) {
    // Skip validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    try {
      // 1. Validate Origin/Referer
      const origin = req.get('Origin');
      const referer = req.get('Referer');
      
      if (!CSRFProtectionMiddleware.validateOrigin(origin, referer)) {
        CSRFProtectionMiddleware.auditLogger.logSecurityEvent({
          type: 'CSRF_ORIGIN_VALIDATION_FAILED',
          userId: req.user?.id || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: { origin, referer, allowedOrigins: this.ALLOWED_ORIGINS },
          severity: 'high'
        });

        return res.status(403).json({
          error: 'Origin validation failed',
          message: 'Request origin not allowed',
          code: 'CSRF_ORIGIN_INVALID'
        });
      }

      // 2. Get CSRF tokens from header and cookie
      const headerToken = req.get('X-CSRF-Token') || req.get('X-XSRF-TOKEN');
      const cookieToken = req.cookies?.['XSRF-TOKEN'];
      const sessionToken = req.session?.csrfToken;

      // 3. Validate tokens using double-submit pattern
      if (!headerToken || !cookieToken || !sessionToken) {
        CSRFProtectionMiddleware.auditLogger.logSecurityEvent({
          type: 'CSRF_TOKEN_MISSING',
          userId: req.user?.id || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: {
            hasHeaderToken: !!headerToken,
            hasCookieToken: !!cookieToken,
            hasSessionToken: !!sessionToken
          },
          severity: 'high'
        });

        return res.status(403).json({
          error: 'CSRF token missing',
          message: 'CSRF protection requires valid token',
          code: 'CSRF_TOKEN_MISSING'
        });
      }

      // 4. Validate token equality (double-submit validation)
      if (!CSRFProtectionMiddleware.validateToken(headerToken, cookieToken) ||
          !CSRFProtectionMiddleware.validateToken(headerToken, sessionToken)) {
        
        CSRFProtectionMiddleware.auditLogger.logSecurityEvent({
          type: 'CSRF_TOKEN_INVALID',
          userId: req.user?.id || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: {
            tokenLength: headerToken.length,
            tokensMatch: headerToken === cookieToken && headerToken === sessionToken
          },
          severity: 'high'
        });

        return res.status(403).json({
          error: 'CSRF token invalid',
          message: 'Invalid or expired CSRF token',
          code: 'CSRF_TOKEN_INVALID'
        });
      }

      // 5. All validations passed
      next();

    } catch (error) {
      CSRFProtectionMiddleware.auditLogger.logSecurityEvent({
        type: 'CSRF_VALIDATION_ERROR',
        userId: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.path}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high'
      });

      res.status(500).json({
        error: 'CSRF validation error',
        message: 'Unable to validate CSRF protection'
      });
    }
  }

  /**
   * 🔄 REFRESH TOKEN
   * Middleware to refresh CSRF token periodically
   */
  static refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Generate new token
      const newToken = CSRFProtectionMiddleware.generateToken();
      
      // Update session
      if (req.session) {
        req.session.csrfToken = newToken;
      }

      // Update cookie
      res.cookie('XSRF-TOKEN', newToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      });

      // Update header
      res.setHeader('X-CSRF-Token', newToken);

      next();
    } catch (error) {
      // Log error but don't fail the request
      CSRFProtectionMiddleware.auditLogger.logSecurityEvent({
        type: 'CSRF_TOKEN_REFRESH_ERROR',
        userId: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.path}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'medium'
      });

      next();
    }
  }

  /**
   * 📊 GET CSRF STATUS
   * Endpoint to check CSRF configuration
   */
  static getStatus(req: Request, res: Response) {
    const hasSessionToken = !!req.session?.csrfToken;
    const hasCookieToken = !!req.cookies?.['XSRF-TOKEN'];
    const origin = req.get('Origin');
    const referer = req.get('Referer');

    res.json({
      csrf: {
        enabled: true,
        hasSessionToken,
        hasCookieToken,
        origin: {
          provided: !!origin,
          valid: origin ? CSRFProtectionMiddleware.validateOrigin(origin, referer) : false
        },
        referer: {
          provided: !!referer,
          valid: referer ? CSRFProtectionMiddleware.validateOrigin(origin, referer) : false
        },
        allowedOrigins: process.env.NODE_ENV === 'development' ? this.ALLOWED_ORIGINS : undefined
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 🔒 EXPORT CSRF MIDDLEWARE
 */
export const csrfProtection = CSRFProtectionMiddleware;