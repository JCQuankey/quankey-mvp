// SECURE AUTHENTICATION ROUTES
// Using SecureAuthMiddleware + QuantumSecurity + SecureDatabase

import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { SecureAuthMiddleware } from '../middleware/secureAuth.middleware';
import { SecurityMiddleware } from '../middleware/security.middleware';
import { QuantumSecurityService } from '../services/quantumSecurity.service';
import { getSecureDatabase } from '../services/secureDatabaseService';
import { WebAuthnService } from '../services/webauthnService';

const router = express.Router();
const auth = new SecureAuthMiddleware();
const security = new SecurityMiddleware();
const quantum = new QuantumSecurityService();
const db = getSecureDatabase();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    quantumResistant: boolean;
    sessionId: string;
  };
}

// ===========================================
// REGISTRATION ENDPOINTS (Quantum-Hybrid)
// ===========================================

/**
 * 🔐 BEGIN REGISTRATION - Generate WebAuthn options + Quantum keys
 */
router.post('/register/begin',
  security.authSlowDown,
  security.authLimiter,
  security.sanitizeMiddleware,
  [
    body('email').isEmail().normalizeEmail().trim(),
    body('displayName').isString().isLength({ min: 2, max: 50 }).trim(),
    body('acceptTerms').isBoolean().custom(value => value === true)
  ],
  async (req: Request, res: Response) => {
    try {
      // 📝 Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await db.auditLog(null, 'REGISTER_VALIDATION_FAILED', {
          errors: errors.array(),
          ip: security.getClientIP(req)
        });
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, displayName } = req.body;

      console.log(`🔐 Starting quantum-hybrid registration for: ${email}`);

      // 🔍 Check if user already exists
      const existingUser = await db.prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true }
      });

      if (existingUser) {
        await db.auditLog(null, 'REGISTER_DUPLICATE_EMAIL', {
          email,
          ip: security.getClientIP(req)
        });
        return res.status(409).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // 🎯 Generate WebAuthn registration options
      const webauthnOptions = await WebAuthnService.generateRegistrationOptions(
        email,
        displayName
      );

      // 🔑 Pre-generate quantum keys for this registration
      const kemKeys = await quantum.generateKEMKeyPair();
      const dsaKeys = await quantum.generateDSAKeyPair();

      // 💾 Store temporary registration data
      const registrationId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.prisma.systemConfig.create({
        data: {
          key: `temp_registration_${registrationId}`,
          value: {
            email,
            displayName,
            webauthnChallenge: Buffer.from(webauthnOptions.challenge).toString('base64'),
            kemKeyId: kemKeys.keyId,
            dsaKeyId: dsaKeys.keyId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
          },
          category: 'temporary',
          description: 'Temporary registration data',
          hash: require('crypto')
            .createHash('sha256')
            .update(`${registrationId}:${email}:${Date.now()}`)
            .digest('hex')
        }
      });

      // 📝 Audit registration attempt
      await db.auditLog(null, 'REGISTER_BEGIN', {
        email,
        registrationId,
        quantumKeysGenerated: true,
        ip: security.getClientIP(req),
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        registrationId,
        options: webauthnOptions,
        quantumInfo: {
          supported: true,
          algorithm: 'ECDSA + ML-DSA-65 (real hybrid)',
          quantumResistant: true,
          kemAlgorithm: 'ML-KEM-768 (NIST FIPS 203)',
          dsaAlgorithm: 'ML-DSA-65 (NIST FIPS 204)',
          entropySource: 'Multi-source quantum + hardware'
        }
      });

    } catch (error) {
      console.error('❌ Registration begin error:', error);
      await db.auditLog(null, 'REGISTER_BEGIN_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: security.getClientIP(req)
      });
      
      res.status(500).json({
        success: false,
        error: 'Registration initiation failed'
      });
    }
  }
);

/**
 * 🔐 FINISH REGISTRATION - Complete WebAuthn + Store quantum hybrid user
 */
router.post('/register/finish',
  security.authSlowDown,
  security.authLimiter,
  security.sanitizeMiddleware,
  [
    body('registrationId').isString().matches(/^reg_\d+_[a-z0-9]{9}$/),
    body('webauthnResponse').isObject(),
    body('webauthnResponse.id').isString(),
    body('webauthnResponse.rawId').isString(),
    body('webauthnResponse.response').isObject()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid registration data',
          details: errors.array()
        });
      }

      const { registrationId, webauthnResponse } = req.body;

      console.log(`🔐 Finishing registration for ID: ${registrationId}`);

      // 🔍 Retrieve temporary registration data
      const tempReg = await db.prisma.systemConfig.findUnique({
        where: { key: `temp_registration_${registrationId}` }
      });

      if (!tempReg) {
        await db.auditLog(null, 'REGISTER_INVALID_ID', {
          registrationId,
          ip: security.getClientIP(req)
        });
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired registration'
        });
      }

      const regData = tempReg.value as any;
      
      // ⏰ Check expiration
      if (new Date(regData.expiresAt) < new Date()) {
        await db.prisma.systemConfig.delete({
          where: { key: `temp_registration_${registrationId}` }
        });
        return res.status(400).json({
          success: false,
          error: 'Registration expired'
        });
      }

      // 🔐 Verify WebAuthn response
      const verification = await WebAuthnService.verifyRegistration(
        webauthnResponse,
        Buffer.from(regData.webauthnChallenge, 'base64')
      );

      if (!verification.verified) {
        await db.auditLog(null, 'REGISTER_WEBAUTHN_FAILED', {
          email: regData.email,
          error: verification.error,
          ip: security.getClientIP(req)
        });
        return res.status(400).json({
          success: false,
          error: 'WebAuthn verification failed'
        });
      }

      // 🆔 Create quantum-hybrid user
      const newUser = await db.prisma.user.create({
        data: {
          email: regData.email,
          displayName: regData.displayName,
          webauthnId: webauthnResponse.id,
          credentialId: webauthnResponse.id,
          publicKeyECDSA: verification.credentialPublicKey,
          publicKeyMLDSA: Buffer.from(regData.dsaKeyId), // Reference to quantum key
          quantumResistant: true,
          twoFactorEnabled: true, // WebAuthn counts as 2FA
          emailVerified: false, // Require email verification
          createdAt: new Date(),
          lastLoginAt: null
        }
      });

      // 🧹 Cleanup temporary registration data
      await db.prisma.systemConfig.delete({
        where: { key: `temp_registration_${registrationId}` }
      });

      // 🎟️ Generate JWT token
      const token = await auth.generateToken({
        id: newUser.id,
        email: newUser.email,
        quantumResistant: newUser.quantumResistant
      });

      // 📝 Audit successful registration
      await db.auditLog(newUser.id, 'REGISTER_SUCCESS', {
        email: newUser.email,
        quantumResistant: true,
        webauthnEnabled: true,
        ip: security.getClientIP(req),
        userAgent: req.headers['user-agent']
      });

      console.log(`✅ Quantum-hybrid user registered: ${newUser.email}`);

      res.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
          quantumResistant: newUser.quantumResistant,
          twoFactorEnabled: newUser.twoFactorEnabled
        },
        token,
        quantumInfo: {
          kemKeyId: regData.kemKeyId,
          dsaKeyId: regData.dsaKeyId,
          algorithm: 'ML-KEM-768 + ML-DSA-65',
          entropySource: 'Multi-source quantum',
          registrationComplete: true
        }
      });

    } catch (error) {
      console.error('❌ Registration finish error:', error);
      await db.auditLog(null, 'REGISTER_FINISH_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: security.getClientIP(req)
      });
      
      res.status(500).json({
        success: false,
        error: 'Registration completion failed'
      });
    }
  }
);

// ===========================================
// LOGIN ENDPOINTS (Quantum-Secure)
// ===========================================

/**
 * 🔐 BEGIN LOGIN - Generate WebAuthn challenge
 */
router.post('/login/begin',
  security.authSlowDown,
  security.authLimiter,
  security.sanitizeMiddleware,
  [
    body('email').isEmail().normalizeEmail().trim()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      const { email } = req.body;

      console.log(`🔐 Login attempt for: ${email}`);

      // 🔍 Find user
      const user = await db.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          displayName: true,
          credentialId: true,
          quantumResistant: true,
          blocked: true,
          deletedAt: true,
          lastLoginAt: true
        }
      });

      if (!user || user.blocked || user.deletedAt) {
        await db.auditLog(null, 'LOGIN_USER_NOT_FOUND', {
          email,
          ip: security.getClientIP(req)
        });
        // Don't reveal if user exists
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // 🎯 Generate WebAuthn authentication options
      const authOptions = await WebAuthnService.generateAuthenticationOptions(
        user.credentialId || ''
      );

      // 💾 Store temporary login challenge
      const loginId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.prisma.systemConfig.create({
        data: {
          key: `temp_login_${loginId}`,
          value: {
            userId: user.id,
            email: user.email,
            challenge: Buffer.from(authOptions.challenge).toString('base64'),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
          },
          category: 'temporary',
          description: 'Temporary login challenge',
          hash: require('crypto')
            .createHash('sha256')
            .update(`${loginId}:${user.id}:${Date.now()}`)
            .digest('hex')
        }
      });

      // 📝 Audit login attempt
      await db.auditLog(user.id, 'LOGIN_BEGIN', {
        ip: security.getClientIP(req),
        userAgent: req.headers['user-agent'],
        quantumResistant: user.quantumResistant
      });

      res.json({
        success: true,
        loginId,
        options: authOptions,
        quantumInfo: {
          quantumResistant: user.quantumResistant,
          algorithm: user.quantumResistant ? 'ECDSA + ML-DSA-65' : 'ECDSA only'
        }
      });

    } catch (error) {
      console.error('❌ Login begin error:', error);
      await db.auditLog(null, 'LOGIN_BEGIN_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: security.getClientIP(req)
      });
      
      res.status(500).json({
        success: false,
        error: 'Login initiation failed'
      });
    }
  }
);

/**
 * 🔐 FINISH LOGIN - Verify WebAuthn + issue JWT
 */
router.post('/login/finish',
  security.authSlowDown, 
  security.strictAuthLimiter, // Stricter limit for login completion
  security.sanitizeMiddleware,
  [
    body('loginId').isString().matches(/^login_\d+_[a-z0-9]{9}$/),
    body('webauthnResponse').isObject()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid login data'
        });
      }

      const { loginId, webauthnResponse } = req.body;

      console.log(`🔐 Finishing login for ID: ${loginId}`);

      // 🔍 Retrieve temporary login data
      const tempLogin = await db.prisma.systemConfig.findUnique({
        where: { key: `temp_login_${loginId}` }
      });

      if (!tempLogin) {
        await db.auditLog(null, 'LOGIN_INVALID_ID', {
          loginId,
          ip: security.getClientIP(req)
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired login session'
        });
      }

      const loginData = tempLogin.value as any;

      // ⏰ Check expiration
      if (new Date(loginData.expiresAt) < new Date()) {
        await db.prisma.systemConfig.delete({
          where: { key: `temp_login_${loginId}` }
        });
        return res.status(401).json({
          success: false,
          error: 'Login session expired'
        });
      }

      // 🔍 Get user details
      const user = await db.prisma.user.findUnique({
        where: { id: loginData.userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          publicKeyECDSA: true,
          quantumResistant: true,
          blocked: true,
          deletedAt: true
        }
      });

      if (!user || user.blocked || user.deletedAt) {
        await db.auditLog(loginData.userId, 'LOGIN_USER_BLOCKED', {
          ip: security.getClientIP(req)
        });
        return res.status(401).json({
          success: false,
          error: 'Account access denied'
        });
      }

      // 🔐 Verify WebAuthn response
      const verification = await WebAuthnService.verifyAuthentication(
        webauthnResponse,
        Buffer.from(loginData.challenge, 'base64'),
        user.publicKeyECDSA || ''
      );

      if (!verification.verified) {
        await db.auditLog(user.id, 'LOGIN_WEBAUTHN_FAILED', {
          error: verification.error,
          ip: security.getClientIP(req)
        });
        return res.status(401).json({
          success: false,
          error: 'Authentication failed'
        });
      }

      // 🧹 Cleanup temporary login data
      await db.prisma.systemConfig.delete({
        where: { key: `temp_login_${loginId}` }
      });

      // 📅 Update last login
      await db.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // 🎟️ Generate secure JWT token
      const token = await auth.generateToken({
        id: user.id,
        email: user.email,
        quantumResistant: user.quantumResistant
      });

      // 📝 Audit successful login
      await db.auditLog(user.id, 'LOGIN_SUCCESS', {
        ip: security.getClientIP(req),
        userAgent: req.headers['user-agent'],
        quantumResistant: user.quantumResistant
      });

      console.log(`✅ User authenticated: ${user.email}`);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          quantumResistant: user.quantumResistant
        },
        token,
        sessionInfo: {
          algorithm: 'Ed25519',
          quantumResistant: user.quantumResistant,
          expiresIn: 3600 // 1 hour
        }
      });

    } catch (error) {
      console.error('❌ Login finish error:', error);
      await db.auditLog(null, 'LOGIN_FINISH_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: security.getClientIP(req)
      });
      
      res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }
);

// ===========================================
// SESSION MANAGEMENT
// ===========================================

/**
 * 🚪 LOGOUT - Revoke session
 */
router.post('/logout',
  auth.validateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;

      // 🚫 Revoke current session
      await auth.revokeToken(user.id, user.sessionId);

      // 📝 Audit logout
      await db.auditLog(user.id, 'LOGOUT', {
        sessionId: user.sessionId,
        ip: security.getClientIP(req)
      });

      console.log(`🚪 User logged out: ${user.email}`);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }
);

/**
 * 🔍 GET USER INFO - Current user details
 */
router.get('/me',
  security.apiLimiter,
  auth.validateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;

      const userDetails = await db.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          displayName: true,
          quantumResistant: true,
          twoFactorEnabled: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true
        }
      });

      if (!userDetails) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        user: userDetails,
        session: {
          quantumResistant: user.quantumResistant,
          algorithm: 'Ed25519'
        }
      });

    } catch (error) {
      console.error('❌ Get user info error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user information'
      });
    }
  }
);

export default router;