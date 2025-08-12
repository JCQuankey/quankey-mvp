/**
 * 📱 DEVICE MANAGEMENT API - PQC per Device Architecture
 * 
 * ARQUITECTURA REALISTA:
 * - Cada dispositivo genera su propio par ML-KEM-768
 * - Master Key se envuelve para cada dispositivo registrado
 * - QR pairing para device-to-device sin recovery codes
 * - Vault items cifrados con DEK + Master Key pattern
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
 * 📱 REGISTER DEVICE - Generate PQC keypair for vault protection
 */
router.post('/register', authenticatePasskey, inputValidation.validateDeviceRegister(), async (req: Request, res: Response) => {
  try {
    const { deviceName, publicKey } = req.body;
    const userId = req.user!.id;

    // Validate ML-KEM-768 public key format
    const publicKeyBuffer = Buffer.from(publicKey, 'base64');
    if (publicKeyBuffer.length !== 1184) { // ML-KEM-768 public key size
      return res.status(400).json({
        success: false,
        message: 'Invalid ML-KEM-768 public key size'
      });
    }

    // Check if this is the user's first device
    const existingDevices = await prisma.userDevice.count({
      where: { userId }
    });

    let masterKey: Uint8Array;
    
    if (existingDevices === 0) {
      // First device - generate new Master Key
      masterKey = randomBytes(32);
    } else {
      // Additional device - get existing Master Key from primary device
      const primaryDevice = await prisma.userDevice.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });

      if (!primaryDevice?.wrappedMasterKey) {
        return res.status(500).json({
          success: false,
          message: 'Cannot retrieve Master Key from primary device'
        });
      }

      // For demo purposes, we'll generate a new Master Key
      // In production, you'd decrypt from primary device
      masterKey = randomBytes(32);
    }

    // Encapsulate Master Key using the device's ML-KEM-768 public key
    const encapsulation = ml_kem768.encapsulate(publicKeyBuffer);
    const cipher = chacha20poly1305(encapsulation.sharedSecret);
    const wrappedMasterKey = cipher.encrypt(masterKey);

    // Create device record
    const device = await prisma.userDevice.create({
      data: {
        userId,
        deviceName,
        pqcPublicKey: publicKeyBuffer,
        wrappedMasterKey: Buffer.from(wrappedMasterKey),
        lastUsed: new Date()
      }
    });

    auditLogger.logSecurityEvent({
      type: 'DEVICE_REGISTER',
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: 'POST /api/devices/register',
      details: { 
        deviceId: device.id,
        deviceName,
        pqcPublicKeyLength: publicKeyBuffer.length,
        isFirstDevice: existingDevices === 0
      },
      severity: 'medium'
    });

    res.json({
      success: true,
      data: {
        deviceId: device.id,
        deviceName: device.deviceName,
        encapsulatedKey: Buffer.from(encapsulation.cipherText).toString('base64'),
        createdAt: device.createdAt
      },
      message: 'Device registered successfully with PQC protection'
    });

  } catch (error) {
    auditLogger.logSecurityEvent({
      type: 'DEVICE_REGISTER_ERROR',
      userId: req.user?.id || 'unknown',
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: 'POST /api/devices/register',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      severity: 'high'
    });

    res.status(500).json({
      success: false,
      message: 'Error registering device',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

/**
 * 📋 GET USER DEVICES
 */
router.get('/list', authenticatePasskey, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const devices = await prisma.userDevice.findMany({
      where: { userId },
      select: {
        id: true,
        deviceName: true,
        lastUsed: true,
        createdAt: true
        // Don't expose PQC keys or wrapped master keys
      },
      orderBy: { createdAt: 'asc' }
    });

    auditLogger.logSecurityEvent({
      type: 'DEVICES_LIST',
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: 'GET /api/devices/list',
      details: { 
        deviceCount: devices.length
      },
      severity: 'low'
    });

    res.json({
      success: true,
      data: {
        devices,
        totalDevices: devices.length
      },
      message: 'Devices retrieved successfully'
    });

  } catch (error) {
    auditLogger.logSecurityEvent({
      type: 'DEVICES_LIST_ERROR',
      userId: req.user?.id || 'unknown',
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: 'GET /api/devices/list',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      severity: 'medium'
    });

    res.status(500).json({
      success: false,
      message: 'Error retrieving devices',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

/**
 * 🔐 GET WRAPPED MASTER KEY for specific device
 */
router.get('/wrapped-key/:deviceId', authenticatePasskey, async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user!.id;

    const device = await prisma.userDevice.findFirst({
      where: { 
        id: deviceId,
        userId 
      }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found or access denied'
      });
    }

    if (!device.wrappedMasterKey) {
      return res.status(404).json({
        success: false,
        message: 'No Master Key found for this device'
      });
    }

    // Update device last used
    await prisma.userDevice.update({
      where: { id: deviceId },
      data: { lastUsed: new Date() }
    });

    auditLogger.logSecurityEvent({
      type: 'WRAPPED_KEY_ACCESS',
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: `GET /api/devices/wrapped-key/${deviceId}`,
      details: { 
        deviceId,
        deviceName: device.deviceName
      },
      severity: 'medium'
    });

    res.json({
      success: true,
      data: {
        encapsulatedKey: device.wrappedMasterKey.toString('base64'),
        deviceId: device.id,
        deviceName: device.deviceName
      },
      message: 'Wrapped Master Key retrieved'
    });

  } catch (error) {
    auditLogger.logSecurityEvent({
      type: 'WRAPPED_KEY_ACCESS_ERROR',
      userId: req.user?.id || 'unknown',
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: `GET /api/devices/wrapped-key/${req.params.deviceId}`,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      severity: 'high'
    });

    res.status(500).json({
      success: false,
      message: 'Error retrieving wrapped Master Key',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

/**
 * ❌ REVOKE DEVICE
 */
router.delete('/:deviceId', authenticatePasskey, async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user!.id;

    // Check if device exists and belongs to user
    const device = await prisma.userDevice.findFirst({
      where: { 
        id: deviceId,
        userId 
      }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found or access denied'
      });
    }

    // Check if this is the last device
    const deviceCount = await prisma.userDevice.count({
      where: { userId }
    });

    if (deviceCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot revoke the last device. Add another device first.'
      });
    }

    // Delete device
    await prisma.userDevice.delete({
      where: { id: deviceId }
    });

    auditLogger.logSecurityEvent({
      type: 'DEVICE_REVOKE',
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: `DELETE /api/devices/${deviceId}`,
      details: { 
        deviceId,
        deviceName: device.deviceName,
        remainingDevices: deviceCount - 1
      },
      severity: 'high'
    });

    res.json({
      success: true,
      message: `Device "${device.deviceName}" revoked successfully`
    });

  } catch (error) {
    auditLogger.logSecurityEvent({
      type: 'DEVICE_REVOKE_ERROR',
      userId: req.user?.id || 'unknown',
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: `DELETE /api/devices/${req.params.deviceId}`,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      severity: 'high'
    });

    res.status(500).json({
      success: false,
      message: 'Error revoking device',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

export default router;