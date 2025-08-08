import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuditLogger } from '../services/auditLogger.service';

/**
 * 🔒 SESSION SECURITY MIDDLEWARE
 * Military-grade session protection for Quankey
 * Prevents session fixation, hijacking, and other session-based attacks
 */

export class SessionSecurityMiddleware {
  private static auditLogger = new AuditLogger();

  // Session security configuration
  private static readonly SESSION_CONFIG = {
    MAX_AGE: 30 * 60 * 1000, // 30 minutes
    REGENERATE_INTERVAL: 15 * 60 * 1000, // 15 minutes
    MAX_CONCURRENT_SESSIONS: 3,
    IP_BINDING: true,
    USER_AGENT_VALIDATION: true
  };

  /**
   * 🔐 INITIALIZE SECURE SESSION
   */
  static initializeSession(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.session) {
        // Set secure session options
        req.session.cookie.secure = process.env.NODE_ENV === 'production';
        req.session.cookie.httpOnly = true;
        req.session.cookie.sameSite = 'strict';
        req.session.cookie.maxAge = SessionSecurityMiddleware.SESSION_CONFIG.MAX_AGE;

        // Initialize session security metadata
        if (!req.session.security) {
          req.session.security = {
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            regeneratedAt: new Date().toISOString(),
            accessCount: 0,
            fingerprint: SessionSecurityMiddleware.generateFingerprint(req)
          };
        }

        // Update last activity
        req.session.security.lastActivity = new Date().toISOString();
        req.session.security.accessCount++;
      }

      next();
    } catch (error) {
      SessionSecurityMiddleware.auditLogger.logSecurityEvent({
        type: 'SESSION_INITIALIZATION_ERROR',
        userId: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.path}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high'
      });

      next();
    }
  }

  /**
   * 🔍 VALIDATE SESSION SECURITY
   */
  static validateSession(req: Request, res: Response, next: NextFunction) {
    if (!req.session || !req.session.security) {
      return next();
    }

    try {
      const sessionSecurity = req.session.security;

      // 1. Check IP binding
      if (SessionSecurityMiddleware.SESSION_CONFIG.IP_BINDING && sessionSecurity.ip !== req.ip) {
        SessionSecurityMiddleware.auditLogger.logSecurityEvent({
          type: 'SESSION_IP_MISMATCH',
          userId: req.user?.id || req.session.userId || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: {
            originalIp: sessionSecurity.ip,
            currentIp: req.ip,
            sessionId: req.sessionID
          },
          severity: 'high'
        });

        return SessionSecurityMiddleware.destroySession(req, res, 'IP address changed');
      }

      // 2. Check User-Agent validation
      if (SessionSecurityMiddleware.SESSION_CONFIG.USER_AGENT_VALIDATION &&
          sessionSecurity.userAgent !== req.get('User-Agent')) {
        
        SessionSecurityMiddleware.auditLogger.logSecurityEvent({
          type: 'SESSION_USER_AGENT_MISMATCH',
          userId: req.user?.id || req.session.userId || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: {
            originalUserAgent: sessionSecurity.userAgent,
            currentUserAgent: req.get('User-Agent'),
            sessionId: req.sessionID
          },
          severity: 'high'
        });

        return SessionSecurityMiddleware.destroySession(req, res, 'Browser fingerprint changed');
      }

      // 3. Check session age
      const sessionAge = Date.now() - new Date(sessionSecurity.createdAt).getTime();
      if (sessionAge > SessionSecurityMiddleware.SESSION_CONFIG.MAX_AGE) {
        
        SessionSecurityMiddleware.auditLogger.logSecurityEvent({
          type: 'SESSION_EXPIRED',
          userId: req.user?.id || req.session.userId || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: {
            sessionAge: sessionAge,
            maxAge: SessionSecurityMiddleware.SESSION_CONFIG.MAX_AGE,
            sessionId: req.sessionID
          },
          severity: 'low'
        });

        return SessionSecurityMiddleware.destroySession(req, res, 'Session expired');
      }

      // 4. Check if session needs regeneration
      const timeSinceRegeneration = Date.now() - new Date(sessionSecurity.regeneratedAt).getTime();
      if (timeSinceRegeneration > SessionSecurityMiddleware.SESSION_CONFIG.REGENERATE_INTERVAL) {
        return SessionSecurityMiddleware.regenerateSession(req, res, next);
      }

      // 5. Validate session fingerprint
      const currentFingerprint = SessionSecurityMiddleware.generateFingerprint(req);
      if (sessionSecurity.fingerprint !== currentFingerprint) {
        
        SessionSecurityMiddleware.auditLogger.logSecurityEvent({
          type: 'SESSION_FINGERPRINT_MISMATCH',
          userId: req.user?.id || req.session.userId || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: {
            originalFingerprint: sessionSecurity.fingerprint,
            currentFingerprint: currentFingerprint,
            sessionId: req.sessionID
          },
          severity: 'high'
        });

        return SessionSecurityMiddleware.destroySession(req, res, 'Session fingerprint invalid');
      }

      next();

    } catch (error) {
      SessionSecurityMiddleware.auditLogger.logSecurityEvent({
        type: 'SESSION_VALIDATION_ERROR',
        userId: req.user?.id || req.session?.userId || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.path}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high'
      });

      return SessionSecurityMiddleware.destroySession(req, res, 'Session validation failed');
    }
  }

  /**
   * 🔄 REGENERATE SESSION (Anti-Session-Fixation)
   */
  static regenerateSession(req: Request, res: Response, next: NextFunction) {
    if (!req.session) {
      return next();
    }

    try {
      const oldSessionId = req.sessionID;
      const userId = req.user?.id || req.session.userId;

      // Save session data before regeneration
      const sessionData = { ...req.session };

      // Regenerate session ID
      req.session.regenerate((err) => {
        if (err) {
          SessionSecurityMiddleware.auditLogger.logSecurityEvent({
            type: 'SESSION_REGENERATION_ERROR',
            userId: userId || 'anonymous',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: `${req.method} ${req.path}`,
            details: { error: err.message, oldSessionId },
            severity: 'high'
          });

          return res.status(500).json({
            error: 'Session error',
            message: 'Unable to secure session'
          });
        }

        // Restore session data
        Object.assign(req.session!, sessionData);

        // Update security metadata
        if (req.session!.security) {
          req.session!.security.regeneratedAt = new Date().toISOString();
          req.session!.security.fingerprint = SessionSecurityMiddleware.generateFingerprint(req);
        }

        SessionSecurityMiddleware.auditLogger.logSecurityEvent({
          type: 'SESSION_REGENERATED',
          userId: userId || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: {
            oldSessionId,
            newSessionId: req.sessionID,
            reason: 'Periodic regeneration'
          },
          severity: 'low'
        });

        next();
      });

    } catch (error) {
      SessionSecurityMiddleware.auditLogger.logSecurityEvent({
        type: 'SESSION_REGENERATION_FATAL_ERROR',
        userId: req.user?.id || req.session?.userId || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.path}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'critical'
      });

      res.status(500).json({
        error: 'Critical session error',
        message: 'Unable to maintain session security'
      });
    }
  }

  /**
   * 🚪 FORCE SESSION REGENERATION ON LOGIN
   */
  static regenerateOnLogin(req: Request, res: Response, next: NextFunction) {
    if (!req.session) {
      return next();
    }

    try {
      const oldSessionId = req.sessionID;

      // Always regenerate session ID on login to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          SessionSecurityMiddleware.auditLogger.logSecurityEvent({
            type: 'LOGIN_SESSION_REGENERATION_ERROR',
            userId: 'anonymous',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: `${req.method} ${req.path}`,
            details: { error: err.message, oldSessionId },
            severity: 'critical'
          });

          return res.status(500).json({
            error: 'Authentication error',
            message: 'Unable to establish secure session'
          });
        }

        // Initialize new session security
        req.session!.security = {
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          regeneratedAt: new Date().toISOString(),
          accessCount: 1,
          fingerprint: SessionSecurityMiddleware.generateFingerprint(req)
        };

        SessionSecurityMiddleware.auditLogger.logSecurityEvent({
          type: 'LOGIN_SESSION_CREATED',
          userId: req.body?.email || 'unknown',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: {
            oldSessionId,
            newSessionId: req.sessionID,
            reason: 'Login session fixation prevention'
          },
          severity: 'low'
        });

        next();
      });

    } catch (error) {
      SessionSecurityMiddleware.auditLogger.logSecurityEvent({
        type: 'LOGIN_SESSION_FATAL_ERROR',
        userId: 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.path}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'critical'
      });

      res.status(500).json({
        error: 'Authentication failed',
        message: 'Unable to establish secure session'
      });
    }
  }

  /**
   * 💥 DESTROY SESSION SECURELY
   */
  private static destroySession(req: Request, res: Response, reason: string) {
    const sessionId = req.sessionID;
    const userId = req.user?.id || req.session?.userId;

    req.session?.destroy((err) => {
      if (err) {
        SessionSecurityMiddleware.auditLogger.logSecurityEvent({
          type: 'SESSION_DESTRUCTION_ERROR',
          userId: userId || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: { error: err.message, reason, sessionId },
          severity: 'high'
        });
      } else {
        SessionSecurityMiddleware.auditLogger.logSecurityEvent({
          type: 'SESSION_DESTROYED',
          userId: userId || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.path}`,
          details: { reason, sessionId },
          severity: 'medium'
        });
      }

      // Clear session cookie
      res.clearCookie('connect.sid');
      res.clearCookie('XSRF-TOKEN');

      res.status(401).json({
        error: 'Session invalid',
        message: reason,
        code: 'SESSION_SECURITY_VIOLATION'
      });
    });
  }

  /**
   * 🔍 GENERATE SESSION FINGERPRINT
   */
  private static generateFingerprint(req: Request): string {
    const components = [
      req.ip,
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || ''
    ];

    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }

  /**
   * 📊 GET SESSION STATUS
   */
  static getSessionStatus(req: Request, res: Response) {
    if (!req.session || !req.session.security) {
      return res.json({
        session: {
          exists: false,
          authenticated: false
        },
        timestamp: new Date().toISOString()
      });
    }

    const sessionSecurity = req.session.security;
    const sessionAge = Date.now() - new Date(sessionSecurity.createdAt).getTime();
    const timeSinceRegeneration = Date.now() - new Date(sessionSecurity.regeneratedAt).getTime();

    res.json({
      session: {
        exists: true,
        authenticated: !!req.session.userId,
        id: req.sessionID,
        security: {
          ageMinutes: Math.floor(sessionAge / 60000),
          accessCount: sessionSecurity.accessCount,
          lastActivity: sessionSecurity.lastActivity,
          minutesSinceRegeneration: Math.floor(timeSinceRegeneration / 60000),
          ipBound: sessionSecurity.ip === req.ip,
          userAgentMatch: sessionSecurity.userAgent === req.get('User-Agent'),
          fingerprintValid: sessionSecurity.fingerprint === SessionSecurityMiddleware.generateFingerprint(req)
        }
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 🔒 EXPORT SESSION SECURITY MIDDLEWARE
 */
export const sessionSecurity = SessionSecurityMiddleware;