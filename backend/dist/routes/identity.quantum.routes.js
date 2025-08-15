"use strict";
/**
 * 🧬 QUANTUM BIOMETRIC IDENTITY ROUTES - Master Plan v6.0
 * ⚠️ REVOLUTIONARY API: Your body IS your quantum-encrypted identity
 *
 * GOLDEN RULES ENFORCED:
 * - NO password endpoints anywhere
 * - NO biometric data received by server (zero-knowledge)
 * - ML-KEM-768 key derivation from biometric signatures
 * - Zero-knowledge proofs for validation
 * - Quantum bridges for multi-device sync (no recovery codes)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const QuantumBiometricService_1 = require("../services/QuantumBiometricService");
const inputValidation_middleware_1 = require("../middleware/inputValidation.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const auditLogger_service_1 = require("../services/auditLogger.service");
const router = (0, express_1.Router)();
const auditLogger = new auditLogger_service_1.AuditLogger();
/**
 * 🧬 REGISTER QUANTUM BIOMETRIC IDENTITY
 * POST /api/identity/quantum-biometric/register
 *
 * User's biometric generates quantum keys locally, server receives:
 * - Encrypted quantum public key (ML-KEM-768)
 * - Zero-knowledge proof of biometric (no actual biometric data)
 * - Device fingerprint for identification
 */
router.post('/quantum-biometric/register', rateLimiter_1.authLimiter, // Use existing auth limiter
inputValidation_middleware_1.inputValidation.validateQuantumBiometricRegistration(), async (req, res) => {
    try {
        const { username, quantumPublicKey, // ML-KEM-768 public key (encrypted)
        biometricProof, // Zero-knowledge proof
        deviceFingerprint, biometricTypes, devicePublicKey // ML-DSA-65 public key for signature verification
         } = req.body;
        console.log(`🧬 API: Quantum biometric registration request for: ${username}`);
        // Validate no biometric data is present in request
        if (req.body.biometricData || req.body.fingerprint || req.body.faceData) {
            auditLogger.logSecurityEvent({
                type: 'BIOMETRIC_DATA_LEAK_ATTEMPT',
                userId: 'unknown',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                endpoint: '/identity/quantum-biometric/register',
                severity: 'critical',
                details: {
                    suspiciousFields: Object.keys(req.body).filter(key => key.includes('biometric') && key !== 'biometricProof' && key !== 'biometricTypes'),
                    blocked: true
                }
            });
            return res.status(400).json({
                success: false,
                error: 'SECURITY VIOLATION: Biometric data must not be sent to server'
            });
        }
        // Register quantum biometric identity
        const result = await QuantumBiometricService_1.quantumBiometricService.registerQuantumBiometricIdentity({
            username,
            quantumPublicKey,
            biometricProof,
            deviceFingerprint,
            biometricTypes,
            devicePublicKey
        });
        if (!result.success) {
            auditLogger.logSecurityEvent({
                type: 'QUANTUM_BIOMETRIC_REGISTRATION_FAILED',
                userId: 'unknown',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                endpoint: '/identity/quantum-biometric/register',
                severity: 'medium',
                details: {
                    username,
                    error: result.error
                }
            });
            return res.status(400).json({
                success: false,
                error: result.error || 'Quantum biometric registration failed'
            });
        }
        // Success - audit log
        auditLogger.logSecurityEvent({
            type: 'QUANTUM_BIOMETRIC_IDENTITY_CREATED',
            userId: result.userId,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            endpoint: '/identity/quantum-biometric/register',
            severity: 'low',
            details: {
                username,
                biometricTypes,
                quantumAlgorithm: 'ML-KEM-768',
                biometricDataStored: false, // ✅ CRITICAL AUDIT
                zeroKnowledgeProof: true
            }
        });
        console.log(`✅ API: Quantum biometric identity created: ${result.userId}`);
        res.status(201).json({
            success: true,
            message: 'Quantum biometric identity created successfully',
            userId: result.userId,
            device: {
                id: result.device.deviceId,
                name: result.device.deviceName,
                biometricTypes: result.device.biometricTypes,
                registeredAt: result.device.registeredAt
            },
            quantum: {
                algorithm: 'ML-KEM-768',
                keyDerivation: 'Biometric signature',
                zeroKnowledge: true,
                passwordless: true
            }
        });
    }
    catch (error) {
        console.error('❌ API: Quantum biometric registration error:', error);
        auditLogger.logSecurityEvent({
            type: 'QUANTUM_BIOMETRIC_API_ERROR',
            userId: 'unknown',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            endpoint: '/identity/quantum-biometric/register',
            severity: 'high',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        });
        res.status(500).json({
            success: false,
            error: 'Internal server error during quantum biometric registration'
        });
    }
});
/**
 * 🔓 AUTHENTICATE QUANTUM BIOMETRIC IDENTITY
 * POST /api/identity/quantum-biometric/authenticate
 *
 * Zero-knowledge biometric authentication - server validates without seeing biometric
 */
router.post('/quantum-biometric/authenticate', rateLimiter_1.authLimiter, // Use existing auth limiter
inputValidation_middleware_1.inputValidation.validateQuantumBiometricAuth(), async (req, res) => {
    try {
        const { biometricProof, deviceFingerprint } = req.body;
        console.log('🔓 API: Quantum biometric authentication request');
        // Validate no raw biometric data
        if (req.body.biometricData || req.body.rawFingerprint) {
            auditLogger.logSecurityEvent({
                type: 'BIOMETRIC_DATA_AUTH_LEAK_ATTEMPT',
                userId: 'unknown',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                endpoint: '/identity/quantum-biometric/authenticate',
                severity: 'critical',
                details: { blocked: true }
            });
            return res.status(400).json({
                success: false,
                error: 'SECURITY VIOLATION: Raw biometric data must not be sent to server'
            });
        }
        // Authenticate with zero-knowledge proof
        const result = await QuantumBiometricService_1.quantumBiometricService.authenticateQuantumBiometric({
            biometricProof,
            deviceFingerprint
        });
        if (!result.success) {
            auditLogger.logSecurityEvent({
                type: 'QUANTUM_BIOMETRIC_AUTH_FAILED',
                userId: 'unknown',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                endpoint: '/identity/quantum-biometric/authenticate',
                severity: 'medium',
                details: {
                    deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
                    error: result.error
                }
            });
            return res.status(401).json({
                success: false,
                error: 'Quantum biometric authentication failed'
            });
        }
        // Success
        auditLogger.logSecurityEvent({
            type: 'QUANTUM_BIOMETRIC_AUTH_SUCCESS',
            userId: result.identity.userId,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            endpoint: '/identity/quantum-biometric/authenticate',
            severity: 'low',
            details: {
                username: result.identity.username,
                biometricDataAccessed: false, // ✅ CRITICAL AUDIT
                quantumValidation: true,
                deviceCount: result.identity.devices.length
            }
        });
        console.log(`✅ API: Quantum biometric authentication successful: ${result.identity.username}`);
        res.status(200).json({
            success: true,
            message: 'Quantum biometric authentication successful',
            identity: {
                userId: result.identity.userId,
                username: result.identity.username,
                biometricTypes: result.identity.biometricTypes,
                devices: result.identity.devices.map(d => ({
                    id: d.deviceId,
                    name: d.deviceName,
                    biometricTypes: d.biometricTypes,
                    lastUsed: d.lastUsed
                })),
                lastAuthenticated: result.identity.lastAuthenticated
            },
            quantum: {
                algorithm: 'ML-KEM-768',
                zeroKnowledge: true,
                biometricProofValidated: true
            }
        });
    }
    catch (error) {
        console.error('❌ API: Quantum biometric auth error:', error);
        auditLogger.logSecurityEvent({
            type: 'QUANTUM_BIOMETRIC_AUTH_API_ERROR',
            userId: 'unknown',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            endpoint: '/identity/quantum-biometric/authenticate',
            severity: 'high',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        });
        res.status(500).json({
            success: false,
            error: 'Internal server error during authentication'
        });
    }
});
/**
 * 📱 CREATE QUANTUM BRIDGE FOR NEW DEVICE
 * POST /api/identity/quantum-bridge/create
 *
 * Creates 60-second temporal bridge for adding devices without recovery codes
 */
router.post('/quantum-bridge/create', rateLimiter_1.authLimiter, // Use existing auth limiter
inputValidation_middleware_1.inputValidation.validateQuantumBridgeCreate(), async (req, res) => {
    try {
        const { biometricSignature, challengeResponse, newDeviceRequest } = req.body;
        const userId = req.headers.authorization?.replace('Bearer ', '') || '';
        console.log(`📱 API: Creating quantum bridge for user: ${userId}`);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required for bridge creation'
            });
        }
        // Create quantum bridge
        const result = await QuantumBiometricService_1.quantumBiometricService.createQuantumBridge({
            userId,
            biometricSignature,
            challengeResponse
        });
        if (!result.success) {
            auditLogger.logSecurityEvent({
                type: 'QUANTUM_BRIDGE_CREATION_FAILED',
                userId,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                endpoint: '/identity/quantum-bridge/create',
                severity: 'medium',
                details: {
                    error: result.error
                }
            });
            return res.status(400).json({
                success: false,
                error: result.error || 'Quantum bridge creation failed'
            });
        }
        // Success
        auditLogger.logSecurityEvent({
            type: 'QUANTUM_BRIDGE_CREATED',
            userId,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            endpoint: '/identity/quantum-bridge/create',
            severity: 'low',
            details: {
                bridgeToken: result.token,
                expiresInSeconds: 60,
                quantumEncrypted: true
            }
        });
        console.log(`✅ API: Quantum bridge created: ${result.token}`);
        res.status(201).json({
            success: true,
            message: 'Quantum bridge created successfully',
            qrCode: result.qrCode,
            token: result.token,
            expiresAt: new Date(Date.now() + 60000),
            instructions: {
                step1: 'Show QR code to new device',
                step2: 'New device scans QR code',
                step3: 'New device registers its biometric',
                step4: 'Bridge expires in 60 seconds',
                note: 'No recovery codes needed - biometric is your backup'
            }
        });
    }
    catch (error) {
        console.error('❌ API: Quantum bridge creation error:', error);
        auditLogger.logSecurityEvent({
            type: 'QUANTUM_BRIDGE_API_ERROR',
            userId: req.headers.authorization?.replace('Bearer ', '') || 'unknown',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            endpoint: '/identity/quantum-bridge/create',
            severity: 'high',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        });
        res.status(500).json({
            success: false,
            error: 'Internal server error during bridge creation'
        });
    }
});
/**
 * 🔍 GET IDENTITY STATUS
 * GET /api/identity/quantum-biometric/status
 *
 * Returns identity information without biometric data
 */
router.get('/quantum-biometric/status', rateLimiter_1.authLimiter, // Use existing auth limiter
async (req, res) => {
    try {
        const userId = req.headers.authorization?.replace('Bearer ', '') || '';
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        // Get identity status (without biometric data)
        // This would be implemented in the service
        console.log(`🔍 API: Getting identity status for: ${userId}`);
        // Placeholder response
        res.status(200).json({
            success: true,
            identity: {
                userId,
                isActive: true,
                biometricTypes: ['fingerprint'],
                deviceCount: 1,
                quantumEncryption: 'ML-KEM-768',
                lastAuthenticated: new Date(),
                passwordless: true,
                zeroKnowledge: true
            }
        });
    }
    catch (error) {
        console.error('❌ API: Identity status error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
/**
 * ⚠️ LEGACY PASSWORD ROUTES - DEPRECATED
 * These routes are disabled in v6.0 - only quantum biometric identity allowed
 */
router.all('/password/*', (req, res) => {
    auditLogger.logSecurityEvent({
        type: 'LEGACY_PASSWORD_ROUTE_ACCESSED',
        userId: 'unknown',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        endpoint: req.originalUrl,
        severity: 'low',
        details: {
            deprecated: true,
            redirectTo: '/identity/quantum-biometric',
            architecture: 'v6.0 - Passwordless Only'
        }
    });
    res.status(410).json({
        success: false,
        error: 'DEPRECATED: Password authentication removed in Quankey v6.0',
        message: 'This system is now passwordless - use quantum biometric identity only',
        migration: {
            architecture: 'v6.0 - True Passwordless',
            endpoint: '/api/identity/quantum-biometric',
            features: [
                'Your body IS your identity',
                'ML-KEM-768 quantum keys from biometric',
                'Zero-knowledge proof validation',
                'No passwords, no recovery codes'
            ]
        }
    });
});
exports.default = router;
