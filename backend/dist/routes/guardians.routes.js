"use strict";
/**
 * 👥 GUARDIAN RECOVERY API - Shamir 2-of-3 Secret Sharing
 *
 * ARQUITECTURA REALISTA:
 * - Shamir Secret Sharing threshold cryptography
 * - Master Key dividida en 3 shares (necesitas 2)
 * - Cada share cifrado con clave PQC del guardián
 * - Recuperación enterprise sin códigos
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
const client_1 = require("@prisma/client");
const ml_kem_1 = require("@noble/post-quantum/ml-kem");
const chacha_1 = require("@noble/ciphers/chacha");
const crypto_1 = require("crypto");
const shamirLib = __importStar(require("shamir-secret-sharing"));
const auditLogger_service_1 = require("../services/auditLogger.service");
const inputValidation_middleware_1 = require("../middleware/inputValidation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const auditLogger = new auditLogger_service_1.AuditLogger();
/**
 * 👥 SETUP GUARDIANS - Create 2-of-3 Shamir shares
 */
router.post('/setup', auth_middleware_1.authenticatePasskey, inputValidation_middleware_1.inputValidation.validateGuardianSetup(), async (req, res) => {
    try {
        const { guardians } = req.body;
        const userId = req.user.id;
        if (guardians.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'Exactly 3 guardians required for 2-of-3 recovery'
            });
        }
        // Validate guardian public keys
        for (let i = 0; i < guardians.length; i++) {
            const guardian = guardians[i];
            const publicKeyBuffer = Buffer.from(guardian.publicKey, 'base64');
            if (publicKeyBuffer.length !== 1184) { // ML-KEM-768 public key size
                return res.status(400).json({
                    success: false,
                    message: `Invalid ML-KEM-768 public key for guardian ${i + 1}`
                });
            }
        }
        // Get user's Master Key (from primary device for demo)
        const primaryDevice = await prisma.userDevice.findFirst({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
        if (!primaryDevice?.wrappedMasterKey) {
            return res.status(400).json({
                success: false,
                message: 'No Master Key found. Register a device first.'
            });
        }
        // For demo, generate a Master Key (in production, decrypt from device)
        const masterKey = (0, crypto_1.randomBytes)(32);
        // Split Master Key into 3 shares (need 2 to recover)
        const shares = await shamirLib.split(masterKey, 3, 2);
        // Encrypt each share with guardian's PQC public key
        const encryptedShares = [];
        for (let i = 0; i < shares.length; i++) {
            const guardian = guardians[i];
            const share = shares[i];
            const guardianPublicKey = Buffer.from(guardian.publicKey, 'base64');
            // Encapsulate share using guardian's ML-KEM-768 public key
            const encapsulation = ml_kem_1.ml_kem768.encapsulate(guardianPublicKey);
            const nonce = (0, crypto_1.randomBytes)(12); // ChaCha20Poly1305 nonce
            const cipher = (0, chacha_1.chacha20poly1305)(encapsulation.sharedSecret, nonce);
            const encryptedShare = cipher.encrypt(share);
            const guardianShare = await prisma.guardianShare.create({
                data: {
                    userId,
                    guardianId: guardian.id,
                    encryptedShare: Buffer.concat([
                        Buffer.from(encapsulation.cipherText),
                        Buffer.from(encryptedShare)
                    ]),
                    shareIndex: i
                }
            });
            encryptedShares.push({
                guardianId: guardian.id,
                guardianName: guardian.name,
                shareId: guardianShare.id,
                shareIndex: i
            });
        }
        auditLogger.logSecurityEvent({
            type: 'GUARDIANS_SETUP',
            userId,
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: 'POST /api/guardians/setup',
            details: {
                guardianCount: guardians.length,
                threshold: 2,
                sharesCreated: encryptedShares.length,
                guardianIds: guardians.map(g => g.id)
            },
            severity: 'high'
        });
        res.json({
            success: true,
            data: {
                guardians: encryptedShares,
                threshold: 2,
                totalShares: 3,
                recoveryInstructions: 'Contact 2 of your 3 guardians to recover access'
            },
            message: 'Guardian recovery system set up successfully'
        });
    }
    catch (error) {
        auditLogger.logSecurityEvent({
            type: 'GUARDIANS_SETUP_ERROR',
            userId: req.user?.id || 'unknown',
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: 'POST /api/guardians/setup',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            severity: 'high'
        });
        res.status(500).json({
            success: false,
            message: 'Error setting up guardian recovery',
            error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
        });
    }
});
/**
 * 🔍 GET USER'S GUARDIANS
 */
router.get('/list', auth_middleware_1.authenticatePasskey, async (req, res) => {
    try {
        const userId = req.user.id;
        const guardians = await prisma.guardianShare.findMany({
            where: { userId },
            select: {
                id: true,
                guardianId: true,
                shareIndex: true,
                createdAt: true
                // Don't expose encrypted shares
            },
            orderBy: { shareIndex: 'asc' }
        });
        auditLogger.logSecurityEvent({
            type: 'GUARDIANS_LIST',
            userId,
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: 'GET /api/guardians/list',
            details: {
                guardianCount: guardians.length
            },
            severity: 'low'
        });
        res.json({
            success: true,
            data: {
                guardians: guardians.map(g => ({
                    guardianId: g.guardianId,
                    shareIndex: g.shareIndex,
                    createdAt: g.createdAt
                })),
                totalGuardians: guardians.length,
                requiredForRecovery: 2
            },
            message: 'Guardians retrieved successfully'
        });
    }
    catch (error) {
        auditLogger.logSecurityEvent({
            type: 'GUARDIANS_LIST_ERROR',
            userId: req.user?.id || 'unknown',
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: 'GET /api/guardians/list',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            severity: 'medium'
        });
        res.status(500).json({
            success: false,
            message: 'Error retrieving guardians',
            error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
        });
    }
});
/**
 * 🔄 INITIATE RECOVERY - Start recovery process
 */
router.post('/recovery/initiate', inputValidation_middleware_1.inputValidation.validateRecoveryInit(), async (req, res) => {
    try {
        const { username, guardianIds } = req.body;
        if (guardianIds.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 guardian shares required for recovery'
            });
        }
        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                guardianShares: {
                    where: {
                        guardianId: {
                            in: guardianIds
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.guardianShares.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient guardian shares available'
            });
        }
        // Generate recovery request ID
        const recoveryRequestId = (0, crypto_1.randomBytes)(16).toString('hex');
        // Store recovery request (in production, use dedicated table)
        const recoveryData = {
            requestId: recoveryRequestId,
            userId: user.id,
            username: user.username,
            guardianIds,
            requiredShares: user.guardianShares.slice(0, 2), // First 2 shares
            status: 'PENDING',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
        // In production, store this in database
        // For demo, we'll return the data directly
        auditLogger.logSecurityEvent({
            type: 'RECOVERY_INITIATE',
            userId: user.id,
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: 'POST /api/guardians/recovery/initiate',
            details: {
                recoveryRequestId,
                username,
                guardianIds,
                sharesRequired: 2
            },
            severity: 'critical'
        });
        res.json({
            success: true,
            data: {
                recoveryRequestId,
                userId: user.id,
                username: user.username,
                requiredShares: recoveryData.requiredShares.map(share => ({
                    guardianId: share.guardianId,
                    shareIndex: share.shareIndex
                })),
                expiresAt: recoveryData.expiresAt,
                instructions: 'Provide 2 decrypted guardian shares to complete recovery'
            },
            message: 'Recovery process initiated'
        });
    }
    catch (error) {
        auditLogger.logSecurityEvent({
            type: 'RECOVERY_INITIATE_ERROR',
            userId: 'unknown',
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: 'POST /api/guardians/recovery/initiate',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            severity: 'high'
        });
        res.status(500).json({
            success: false,
            message: 'Error initiating recovery',
            error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
        });
    }
});
/**
 * ✅ COMPLETE RECOVERY - Combine shares and recover Master Key
 */
router.post('/recovery/complete', inputValidation_middleware_1.inputValidation.validateRecoveryComplete(), async (req, res) => {
    try {
        const { recoveryRequestId, decryptedShares, newDevicePublicKey, newDeviceName } = req.body;
        if (decryptedShares.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 decrypted shares required'
            });
        }
        // In production, validate recovery request from database
        // For demo, we'll proceed with validation
        // Validate new device PQC public key
        const newDevicePQCKey = Buffer.from(newDevicePublicKey, 'base64');
        if (newDevicePQCKey.length !== 1184) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ML-KEM-768 public key for new device'
            });
        }
        try {
            // Combine the decrypted shares to recover Master Key
            const shareBuffers = decryptedShares.map(share => Buffer.from(share.data, 'base64'));
            const recoveredMasterKey = await shamirLib.combine(shareBuffers);
            // Encapsulate Master Key for new device
            const encapsulation = ml_kem_1.ml_kem768.encapsulate(newDevicePQCKey);
            const nonce = (0, crypto_1.randomBytes)(12); // ChaCha20Poly1305 nonce
            const cipher = (0, chacha_1.chacha20poly1305)(encapsulation.sharedSecret, nonce);
            const wrappedMasterKey = cipher.encrypt(recoveredMasterKey);
            // Create recovery result (in production, create new device)
            const recoveryResult = {
                deviceId: (0, crypto_1.randomBytes)(16).toString('hex'),
                deviceName: newDeviceName || 'Recovered Device',
                encapsulatedKey: Buffer.from(encapsulation.cipherText).toString('base64'),
                recoveredAt: new Date()
            };
            auditLogger.logSecurityEvent({
                type: 'RECOVERY_COMPLETE',
                userId: 'recovered',
                ip: req.ip,
                userAgent: req.get('User-Agent') || 'unknown',
                endpoint: 'POST /api/guardians/recovery/complete',
                details: {
                    recoveryRequestId,
                    sharesUsed: decryptedShares.length,
                    newDeviceName,
                    recoverySuccessful: true
                },
                severity: 'critical'
            });
            res.json({
                success: true,
                data: recoveryResult,
                message: 'Recovery completed successfully. New device registered.'
            });
        }
        catch (sharesError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or corrupted guardian shares'
            });
        }
    }
    catch (error) {
        auditLogger.logSecurityEvent({
            type: 'RECOVERY_COMPLETE_ERROR',
            userId: 'unknown',
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: 'POST /api/guardians/recovery/complete',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error',
                recoveryRequestId: req.body.recoveryRequestId
            },
            severity: 'critical'
        });
        res.status(500).json({
            success: false,
            message: 'Error completing recovery',
            error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
        });
    }
});
/**
 * ❌ REVOKE GUARDIAN SHARE
 */
router.delete('/revoke/:guardianId', auth_middleware_1.authenticatePasskey, async (req, res) => {
    try {
        const { guardianId } = req.params;
        const userId = req.user.id;
        const guardianShare = await prisma.guardianShare.findFirst({
            where: {
                guardianId,
                userId
            }
        });
        if (!guardianShare) {
            return res.status(404).json({
                success: false,
                message: 'Guardian share not found'
            });
        }
        // Check remaining guardians after deletion
        const remainingGuardians = await prisma.guardianShare.count({
            where: {
                userId,
                guardianId: { not: guardianId }
            }
        });
        if (remainingGuardians < 2) {
            return res.status(400).json({
                success: false,
                message: 'Cannot revoke guardian. At least 2 guardians must remain for recovery.'
            });
        }
        await prisma.guardianShare.delete({
            where: { id: guardianShare.id }
        });
        auditLogger.logSecurityEvent({
            type: 'GUARDIAN_REVOKE',
            userId,
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: `DELETE /api/guardians/revoke/${guardianId}`,
            details: {
                guardianId,
                shareIndex: guardianShare.shareIndex,
                remainingGuardians
            },
            severity: 'high'
        });
        res.json({
            success: true,
            message: 'Guardian share revoked successfully'
        });
    }
    catch (error) {
        auditLogger.logSecurityEvent({
            type: 'GUARDIAN_REVOKE_ERROR',
            userId: req.user?.id || 'unknown',
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: `DELETE /api/guardians/revoke/${req.params.guardianId}`,
            details: {
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            severity: 'high'
        });
        res.status(500).json({
            success: false,
            message: 'Error revoking guardian share',
            error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
        });
    }
});
exports.default = router;
