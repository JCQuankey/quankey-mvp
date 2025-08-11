/**
 * 🔐 REAL AUTHENTICATION ROUTES - NO SIMULATIONS
 * Implements WebAuthn biometric authentication following GOLDEN RULE
 */

import { Router, Request, Response } from 'express';
import { WebAuthnServiceSimple } from '../services/webauthnServiceSimple';
import { db } from '../services/database.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { inputValidation } from '../middleware/inputValidation.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { AuditLogger } from '../services/auditLogger.service';
import * as crypto from 'crypto';

const router = Router();
const auditLogger = new AuditLogger();

/**
 * POST /api/auth/register/begin
 * Initiates WebAuthn registration with REAL cryptographic challenge
 */
router.post('/register/begin', 
  authLimiter,
  inputValidation.sanitizeRequest,
  async (req: Request, res: Response) => {
    try {
      const { username, email } = req.body;
      
      if (!username || !email) {
        return res.status(400).json({
          success: false,
          error: 'Username and email are required'
        });
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists'
        });
      }

      // Generate unique user ID
      const userId = crypto.randomBytes(16).toString('hex');
      
      // Generate REAL WebAuthn registration options
      const options = await WebAuthnServiceSimple.generateRegistrationOptions(
        userId,
        username,
        username
      );

      // Store temporary registration data
      await db.storeTemporaryRegistration({
        userId,
        username,
        email,
        challenge: options.options.challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });

      // Audit log
      auditLogger.logSecurityEvent({
        type: 'WEBAUTHN_REGISTRATION_BEGIN',
        userId,
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        endpoint: '/api/auth/register/begin',
        details: { username, email },
        severity: 'low'
      });

      res.json(options);
    } catch (error) {
      console.error('Registration begin error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to begin registration'
      });
    }
  }
);

/**
 * POST /api/auth/register/finish
 * Completes WebAuthn registration with REAL credential verification
 */
router.post('/register/finish',
  authLimiter,
  inputValidation.sanitizeRequest,
  async (req: Request, res: Response) => {
    try {
      const registrationResponse = req.body;
      
      if (!registrationResponse || !registrationResponse.id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid registration response'
        });
      }

      // Verify registration with REAL cryptographic validation
      const result = await WebAuthnServiceSimple.verifyRegistrationResponse(
        registrationResponse
      );

      if (!result.success || !result.user) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Registration verification failed'
        });
      }

      // Generate JWT token
      const token = await AuthMiddleware.generateToken({
        userId: result.user.id,
        email: result.user.email
      });

      // Audit log
      auditLogger.logSecurityEvent({
        type: 'WEBAUTHN_REGISTRATION_COMPLETE',
        userId: result.user.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        endpoint: '/api/auth/register/finish',
        details: { credentialId: registrationResponse.id },
        severity: 'medium'
      });

      res.json({
        success: true,
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email
        },
        token
      });
    } catch (error) {
      console.error('Registration finish error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete registration'
      });
    }
  }
);

/**
 * POST /api/auth/login/begin
 * Initiates WebAuthn login with REAL challenge
 */
router.post('/login/begin',
  authLimiter,
  inputValidation.sanitizeRequest,
  async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({
          success: false,
          error: 'Username is required'
        });
      }

      // Get user from database
      const user = await db.getUserByUsername(username);
      if (!user) {
        // Don't reveal if user exists
        return res.status(401).json({
          success: false,
          error: 'Authentication failed'
        });
      }

      // Generate REAL authentication options
      const options = await WebAuthnServiceSimple.generateAuthenticationOptions(
        user.id
      );

      // Audit log
      auditLogger.logSecurityEvent({
        type: 'WEBAUTHN_LOGIN_BEGIN',
        userId: user.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        endpoint: '/api/auth/login/begin',
        details: { username },
        severity: 'low'
      });

      res.json(options);
    } catch (error) {
      console.error('Login begin error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to begin login'
      });
    }
  }
);

/**
 * POST /api/auth/login/finish
 * Completes WebAuthn login with REAL verification
 */
router.post('/login/finish',
  authLimiter,
  inputValidation.sanitizeRequest,
  async (req: Request, res: Response) => {
    try {
      const authenticationResponse = req.body;
      
      if (!authenticationResponse || !authenticationResponse.id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid authentication response'
        });
      }

      // Verify authentication with REAL cryptographic validation
      const result = await WebAuthnServiceSimple.verifyAuthenticationResponse(
        authenticationResponse
      );

      if (!result.success || !result.user) {
        // Audit failed login
        auditLogger.logSecurityEvent({
          type: 'WEBAUTHN_LOGIN_FAILED',
          userId: 'unknown',
          ip: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
          endpoint: '/api/auth/login/finish',
          details: { credentialId: authenticationResponse.id },
          severity: 'high'
        });

        return res.status(401).json({
          success: false,
          error: 'Authentication failed'
        });
      }

      // Generate JWT token
      const token = await AuthMiddleware.generateToken({
        userId: result.user.id,
        email: result.user.email
      });

      // Audit successful login
      auditLogger.logSecurityEvent({
        type: 'WEBAUTHN_LOGIN_SUCCESS',
        userId: result.user.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        endpoint: '/api/auth/login/finish',
        details: { credentialId: authenticationResponse.id },
        severity: 'low'
      });

      res.json({
        success: true,
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email
        },
        token
      });
    } catch (error) {
      console.error('Login finish error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete login'
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logs out the user and invalidates the session
 */
router.post('/logout',
  AuthMiddleware.verifyToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      
      if (userId) {
        // Audit logout
        auditLogger.logSecurityEvent({
          type: 'USER_LOGOUT',
          userId,
          ip: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
          endpoint: '/api/auth/logout',
          details: {},
          severity: 'low'
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }
  }
);

/**
 * GET /api/auth/verify
 * Verifies if the current token is valid
 */
router.get('/verify',
  AuthMiddleware.verifyToken,
  async (req: Request, res: Response) => {
    try {
      const user = await db.getUserById(req.user!.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify token'
      });
    }
  }
);

export default router;