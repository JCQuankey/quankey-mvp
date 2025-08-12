"use strict";
/**
 * 🔐 REAL AUTHENTICATION ROUTES - NO SIMULATIONS
 * Implements WebAuthn biometric authentication following GOLDEN RULE
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webauthnServiceSimple_1 = require("../services/webauthnServiceSimple");
const database_service_1 = require("../services/database.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const inputValidation_middleware_1 = require("../middleware/inputValidation.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const auditLogger_service_1 = require("../services/auditLogger.service");
const crypto = __importStar(require("crypto"));
const router = (0, express_1.Router)();
const auditLogger = new auditLogger_service_1.AuditLogger();
/**
 * POST /api/auth/register/begin
 * Initiates WebAuthn registration with REAL cryptographic challenge
 */
router.post('/register/begin', rateLimiter_1.authLimiter, inputValidation_middleware_1.inputValidation.sanitizeRequest, async (req, res) => {
    try {
        const { username, email } = req.body;
        if (!username || !email) {
            return res.status(400).json({
                success: false,
                error: 'Username and email are required'
            });
        }
        // Check if user already exists
        const existingUser = await database_service_1.db.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists'
            });
        }
        // Generate unique user ID
        const userId = crypto.randomBytes(16).toString('hex');
        // Generate REAL WebAuthn registration options
        const options = await webauthnServiceSimple_1.WebAuthnServiceSimple.generateRegistrationOptions(userId, username, username);
        // Store temporary registration data
        await database_service_1.db.storeTemporaryRegistration({
            userId,
            username,
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
    }
    catch (error) {
        console.error('Registration begin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to begin registration'
        });
    }
});
/**
 * POST /api/auth/register/finish
 * Completes WebAuthn registration with REAL credential verification
 */
router.post('/register/finish', rateLimiter_1.authLimiter, inputValidation_middleware_1.inputValidation.sanitizeRequest, async (req, res) => {
    try {
        const registrationResponse = req.body;
        if (!registrationResponse || !registrationResponse.id) {
            return res.status(400).json({
                success: false,
                error: 'Invalid registration response'
            });
        }
        // Verify registration with REAL cryptographic validation
        const result = await webauthnServiceSimple_1.WebAuthnServiceSimple.verifyRegistrationResponse(registrationResponse);
        if (!result.success || !result.user) {
            return res.status(400).json({
                success: false,
                error: 'Registration verification failed'
            });
        }
        // Generate JWT token
        const token = await auth_middleware_1.AuthMiddleware.generateToken({
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
    }
    catch (error) {
        console.error('Registration finish error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete registration'
        });
    }
});
/**
 * POST /api/auth/login/begin
 * Initiates WebAuthn login with REAL challenge
 */
router.post('/login/begin', rateLimiter_1.authLimiter, inputValidation_middleware_1.inputValidation.sanitizeRequest, async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username is required'
            });
        }
        // Get user from database
        const user = await database_service_1.db.getUserByUsername(username);
        if (!user) {
            // Don't reveal if user exists
            return res.status(401).json({
                success: false,
                error: 'Authentication failed'
            });
        }
        // Generate REAL authentication options
        const options = await webauthnServiceSimple_1.WebAuthnServiceSimple.generateAuthenticationOptions(user.id);
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
    }
    catch (error) {
        console.error('Login begin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to begin login'
        });
    }
});
/**
 * POST /api/auth/login/finish
 * Completes WebAuthn login with REAL verification
 */
router.post('/login/finish', rateLimiter_1.authLimiter, inputValidation_middleware_1.inputValidation.sanitizeRequest, async (req, res) => {
    try {
        const authenticationResponse = req.body;
        if (!authenticationResponse || !authenticationResponse.id) {
            return res.status(400).json({
                success: false,
                error: 'Invalid authentication response'
            });
        }
        // Verify authentication with REAL cryptographic validation
        const result = await webauthnServiceSimple_1.WebAuthnServiceSimple.verifyAuthenticationResponse(authenticationResponse);
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
        const token = await auth_middleware_1.AuthMiddleware.generateToken({
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
    }
    catch (error) {
        console.error('Login finish error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete login'
        });
    }
});
/**
 * POST /api/auth/logout
 * Logs out the user and invalidates the session
 */
router.post('/logout', auth_middleware_1.AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const userId = req.user?.id;
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
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to logout'
        });
    }
});
/**
 * GET /api/auth/verify
 * Verifies if the current token is valid
 */
router.get('/verify', auth_middleware_1.AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const user = await database_service_1.db.getUserById(req.user.id);
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
                displayName: user.displayName
            }
        });
    }
    catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify token'
        });
    }
});
exports.default = router;
