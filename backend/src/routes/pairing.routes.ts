/**
 * 🔄 QR DEVICE PAIRING API - Temporal Bridges
 * 
 * ARQUITECTURA REALISTA:
 * - QR bridges temporales de 60-120 segundos
 * - Device-to-device sin recovery codes
 * - WebSocket para comunicación real-time
 * - Nuevo dispositivo obtiene Master Key envuelta
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from 'crypto';
import { AuditLogger } from '../services/auditLogger.service';
import { inputValidation } from '../middleware/inputValidation.middleware';
import { authenticatePasskey } from '../middleware/auth.middleware';
import QRCode from 'qrcode';

const router = Router();
const prisma = new PrismaClient();
const auditLogger = new AuditLogger();

/**
 * 📱 CREATE PAIRING QR - From authenticated device
 */
router.post('/create', authenticatePasskey, async (req: Request, res: Response) => {
  try {
    const { expiresIn = 90, currentDeviceId } = req.body;
    const userId = req.user!.id;

    // Validate expiration time (30-300 seconds)
    const expiration = Math.min(Math.max(expiresIn, 30), 300);

    // Generate secure token
    const token = randomBytes(32).toString('hex');

    // Get current device info
    const currentDevice = await prisma.userDevice.findFirst({
      where: { 
        id: currentDeviceId,
        userId 
      }
    });

    if (!currentDevice) {
      return res.status(400).json({
        success: false,
        message: 'Current device not found'
      });
    }

    // Create pairing session
    const pairingSession = await prisma.pairingSession.create({
      data: {
        token,
        hostUserId: userId,
        hostDeviceId: currentDeviceId,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + expiration * 1000)
      }
    });

    // Generate QR data
    const qrData = {
      token,
      endpoint: `wss://${req.get('host')}/pairing`,
      rpId: process.env.RP_ID || 'localhost',
      expires: Date.now() + (expiration * 1000)
    };

    // Generate QR code image
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    auditLogger.logSecurityEvent({
      type: 'PAIRING_QR_CREATE',
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: 'POST /api/pairing/create',
      details: { 
        pairingSessionId: pairingSession.id,
        token: token.substring(0, 16) + '...',
        expirationSeconds: expiration,
        hostDeviceId: currentDeviceId
      },
      severity: 'medium'
    });

    res.json({
      success: true,
      data: {
        qrData,
        qrCode,
        token,
        expiresAt: pairingSession.expiresAt,
        expiresIn: expiration
      },
      message: `QR pairing code created (expires in ${expiration} seconds)`
    });

  } catch (error) {
    auditLogger.logSecurityEvent({
      type: 'PAIRING_QR_CREATE_ERROR',
      userId: req.user?.id || 'unknown',
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: 'POST /api/pairing/create',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      severity: 'high'
    });

    res.status(500).json({
      success: false,
      message: 'Error creating pairing QR code',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

/**
 * 🔄 CONSUME PAIRING QR - From new device
 */
router.post('/consume', inputValidation.validatePairingConsume(), async (req: Request, res: Response) => {
  try {
    const { token, devicePublicKey, deviceName } = req.body;

    // Find pairing session
    const pairingSession = await prisma.pairingSession.findUnique({
      where: { token }
    });

    if (!pairingSession) {
      return res.status(404).json({
        success: false,
        message: 'Pairing session not found'
      });
    }

    if (pairingSession.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.pairingSession.delete({
        where: { id: pairingSession.id }
      });

      return res.status(410).json({
        success: false,
        message: 'Pairing session expired'
      });
    }

    if (pairingSession.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Pairing session already used or cancelled'
      });
    }

    // Validate new device's ML-KEM-768 public key
    const newDevicePublicKey = Buffer.from(devicePublicKey, 'base64');
    if (newDevicePublicKey.length !== 1184) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ML-KEM-768 public key size'
      });
    }

    // Get host device's Master Key
    const hostDevice = await prisma.userDevice.findUnique({
      where: { id: pairingSession.hostDeviceId }
    });

    if (!hostDevice?.wrappedMasterKey) {
      return res.status(500).json({
        success: false,
        message: 'Cannot retrieve Master Key from host device'
      });
    }

    // For demo, generate a new Master Key (in production, decrypt from host)
    const masterKey = randomBytes(32);

    // Encapsulate Master Key for new device
    const encapsulation = ml_kem768.encapsulate(newDevicePublicKey);
    const nonce = randomBytes(12); // ChaCha20Poly1305 nonce
    const cipher = chacha20poly1305(encapsulation.sharedSecret, nonce);
    const wrappedMasterKey = cipher.encrypt(masterKey);

    // Register new device
    const newDevice = await prisma.userDevice.create({
      data: {
        userId: pairingSession.hostUserId,
        deviceName: deviceName || 'Paired Device',
        pqcPublicKey: newDevicePublicKey,
        wrappedMasterKey: Buffer.from(wrappedMasterKey),
        lastUsed: new Date()
      }
    });

    // Update pairing session
    await prisma.pairingSession.update({
      where: { id: pairingSession.id },
      data: {
        status: 'COMPLETED',
        newDeviceName: deviceName,
        completedAt: new Date()
      }
    });

    auditLogger.logSecurityEvent({
      type: 'PAIRING_QR_CONSUME',
      userId: pairingSession.hostUserId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: 'POST /api/pairing/consume',
      details: { 
        pairingSessionId: pairingSession.id,
        newDeviceId: newDevice.id,
        newDeviceName: deviceName,
        pairingSuccessful: true
      },
      severity: 'high'
    });

    res.json({
      success: true,
      data: {
        deviceId: newDevice.id,
        deviceName: newDevice.deviceName,
        encapsulatedKey: Buffer.from(encapsulation.cipherText).toString('base64'),
        userId: pairingSession.hostUserId,
        createdAt: newDevice.createdAt
      },
      message: 'Device paired successfully'
    });

  } catch (error) {
    auditLogger.logSecurityEvent({
      type: 'PAIRING_QR_CONSUME_ERROR',
      userId: 'unknown',
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: 'POST /api/pairing/consume',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        token: req.body.token?.substring(0, 16) + '...'
      },
      severity: 'high'
    });

    res.status(500).json({
      success: false,
      message: 'Error consuming pairing QR code',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

/**
 * ❌ CANCEL PAIRING SESSION
 */
router.delete('/:token', authenticatePasskey, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userId = req.user!.id;

    const pairingSession = await prisma.pairingSession.findFirst({
      where: { 
        token,
        hostUserId: userId 
      }
    });

    if (!pairingSession) {
      return res.status(404).json({
        success: false,
        message: 'Pairing session not found or access denied'
      });
    }

    await prisma.pairingSession.delete({
      where: { id: pairingSession.id }
    });

    auditLogger.logSecurityEvent({
      type: 'PAIRING_SESSION_CANCEL',
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: `DELETE /api/pairing/${token}`,
      details: { 
        pairingSessionId: pairingSession.id,
        token: token.substring(0, 16) + '...'
      },
      severity: 'low'
    });

    res.json({
      success: true,
      message: 'Pairing session cancelled'
    });

  } catch (error) {
    auditLogger.logSecurityEvent({
      type: 'PAIRING_SESSION_CANCEL_ERROR',
      userId: req.user?.id || 'unknown',
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: `DELETE /api/pairing/${req.params.token}`,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      severity: 'medium'
    });

    res.status(500).json({
      success: false,
      message: 'Error cancelling pairing session',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

/**
 * 🔍 GET PAIRING STATUS - Check if session is still active
 */
router.get('/status/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const pairingSession = await prisma.pairingSession.findUnique({
      where: { token },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        completedAt: true
      }
    });

    if (!pairingSession) {
      return res.status(404).json({
        success: false,
        message: 'Pairing session not found'
      });
    }

    const isExpired = pairingSession.expiresAt < new Date();
    const timeRemaining = Math.max(0, pairingSession.expiresAt.getTime() - Date.now());

    res.json({
      success: true,
      data: {
        status: isExpired ? 'EXPIRED' : pairingSession.status,
        expiresAt: pairingSession.expiresAt,
        timeRemaining: Math.floor(timeRemaining / 1000),
        createdAt: pairingSession.createdAt,
        completedAt: pairingSession.completedAt
      },
      message: 'Pairing status retrieved'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving pairing status',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

/**
 * 🧹 CLEANUP EXPIRED SESSIONS - Maintenance endpoint
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const deletedSessions = await prisma.pairingSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    auditLogger.logSecurityEvent({
      type: 'PAIRING_CLEANUP',
      userId: 'system',
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: 'POST /api/pairing/cleanup',
      details: { 
        deletedSessions: deletedSessions.count
      },
      severity: 'low'
    });

    res.json({
      success: true,
      data: {
        deletedSessions: deletedSessions.count
      },
      message: `Cleaned up ${deletedSessions.count} expired pairing sessions`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cleaning up pairing sessions',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

export default router;