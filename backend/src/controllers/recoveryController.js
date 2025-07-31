// backend/src/controllers/recoveryController.js

/**
 * PATENT-CRITICAL: Recovery Controller
 * 
 * This controller manages the world's first quantum recovery system
 * that enables account recovery without ANY password - neither master
 * password nor recovery password. This is a fundamental innovation
 * in password manager architecture.
 * 
 * Traditional recovery flows:
 * - 1Password: Requires master password + secret key
 * - Bitwarden: Master password reset via email (insecure)
 * - LastPass: Master password hint or SMS (vulnerable)
 * 
 * Quankey innovation:
 * - NO passwords at any point
 * - Quantum-generated recovery shares
 * - Cryptographically secure without user-memorable secrets
 */

const { PrismaClient } = require('@prisma/client');
const { QuantumRecoveryService } = require('../services/quantumRecoveryService');
const { QuantumRecoveryServiceV2 } = require('../services/quantumRecoveryServiceV2');

const prisma = new PrismaClient();

class RecoveryController {
  /**
   * PATENT-CRITICAL: Generate quantum recovery kit
   * This method creates recovery shares with true quantum randomness
   */
  static async generateRecoveryKit(req, res) {
    try {
      const userId = req.user.id;
      
      // Check if user already has an active kit
      const existingKit = await prisma.recoveryKit.findFirst({
        where: {
          userId: userId,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      });
      
      if (existingKit) {
        return res.status(400).json({
          error: 'Active recovery kit already exists',
          expiresAt: existingKit.expiresAt
        });
      }
      
      // PATENT-CRITICAL: Generate quantum recovery kit V2
      console.log(`[RECOVERY-GENERATE-V2-${Date.now()}] Generating enhanced quantum recovery kit for user ${userId}`);
      
      const kit = await QuantumRecoveryServiceV2.generateRecoveryKit(userId);
      
      // Log generation for patent documentation
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'QUANTUM_RECOVERY_KIT_GENERATED',
          entityType: 'recovery_kit',
          entityId: kit.recoveryId,
          metadata: {
            quantum: true,
            sharesGenerated: kit.shares.length,
            threshold: kit.metadata.shareConfiguration,
            patentRef: 'QUANKEY-QRS-001'
          }
        }
      });
      
      res.json({
        success: true,
        message: 'Quantum recovery kit generated successfully',
        kit: {
          recoveryId: kit.recoveryId,
          shares: kit.shares,
          expiresIn: '365 days',
          instructions: kit.instructions,
          metadata: kit.metadata
        }
      });
      
    } catch (error) {
      console.error('[RECOVERY-GENERATE-ERROR]', error);
      res.status(500).json({
        error: 'Failed to generate recovery kit',
        message: error.message
      });
    }
  }
  
  /**
   * PATENT-CRITICAL: Download recovery share V2
   * Each share is quantum-encrypted with QR codes
   */
  static async downloadShare(req, res) {
    try {
      const userId = req.user.id;
      const { shareId } = req.params;
      
      console.log(`[SHARE-DOWNLOAD-V2] User ${userId} downloading share ${shareId}`);
      
      // Generate secure share file using V2 service
      const shareFile = await QuantumRecoveryServiceV2.generateShareFile(shareId, userId);
      
      // Extract share index for filename
      const shareIndex = shareFile.quankeyRecoveryShare.shareIndex;
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=quankey-recovery-share-${shareIndex}-v2.qrs`);
      
      // Log download for audit
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'SHARE_DOWNLOADED',
          entityType: 'recovery_share',
          entityId: shareId,
          metadata: {
            shareIndex: shareIndex,
            version: '2.0'
          }
        }
      });
      
      res.json(shareFile);
      
    } catch (error) {
      console.error('[SHARE-DOWNLOAD-V2-ERROR]', error);
      res.status(500).json({
        error: 'Failed to download share',
        message: error.message
      });
    }
  }
  
  /**
   * PATENT-CRITICAL: Initiate social recovery
   * Distributes quantum shares to trusted contacts
   */
  static async initiateSocialRecovery(req, res) {
    try {
      const userId = req.user.id;
      const { trustedContacts } = req.body;
      
      // Validate contacts
      if (!Array.isArray(trustedContacts) || trustedContacts.length < 3) {
        return res.status(400).json({
          error: 'At least 3 trusted contacts required',
          minimum: 3,
          maximum: 5
        });
      }
      
      // Validate each contact
      const validContacts = trustedContacts.slice(0, 5).filter(contact => 
        contact.email && contact.name && 
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)
      );
      
      if (validContacts.length < 3) {
        return res.status(400).json({
          error: 'Invalid contact information',
          message: 'Each contact must have valid email and name'
        });
      }
      
      // PATENT-CRITICAL: Initiate quantum social recovery
      console.log(`[SOCIAL-RECOVERY-${Date.now()}] User ${userId} initiating social recovery with ${validContacts.length} contacts`);
      
      const result = await QuantumRecoveryService.initiateSocialRecovery(userId, validContacts);
      
      // Log for patent documentation
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'SOCIAL_RECOVERY_INITIATED',
          entityType: 'recovery_kit',
          entityId: result.recoveryId,
          metadata: {
            contactsCount: validContacts.length,
            quantum: true,
            method: 'quantum-shamir-social',
            patentRef: 'First quantum social recovery'
          }
        }
      });
      
      res.json({
        success: true,
        message: 'Social recovery initiated successfully',
        recoveryId: result.recoveryId,
        distributions: result.distributions.map(d => ({
          trustee: d.trustee,
          status: 'pending_delivery'
        })),
        instructions: result.instructions
      });
      
    } catch (error) {
      console.error('[SOCIAL-RECOVERY-ERROR]', error);
      res.status(500).json({
        error: 'Failed to initiate social recovery',
        message: error.message
      });
    }
  }
  
  /**
   * PATENT-CRITICAL: Recover account with shares
   * This is the core innovation - recovery without ANY password
   */
  static async recoverWithShares(req, res) {
    try {
      const { userId, shares } = req.body;
      
      if (!userId || !Array.isArray(shares)) {
        return res.status(400).json({
          error: 'Invalid recovery request',
          required: ['userId', 'shares array']
        });
      }
      
      if (shares.length < 3) {
        return res.status(400).json({
          error: 'Insufficient shares',
          message: 'At least 3 valid shares required for recovery',
          provided: shares.length,
          required: 3
        });
      }
      
      // PATENT-CRITICAL: Attempt quantum recovery V2
      console.log(`[RECOVERY-ATTEMPT-V2-${Date.now()}] User ${userId} attempting recovery with ${shares.length} shares`);
      
      const result = await QuantumRecoveryServiceV2.recoverWithShares(userId, shares);
      
      if (result.success) {
        // Generate new session for recovered account
        const session = await prisma.session.create({
          data: {
            userId: userId,
            token: result.credentials.credentialId,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
        
        res.json({
          success: true,
          message: 'Account recovered successfully',
          session: {
            token: session.token,
            expiresAt: session.expiresAt
          },
          credentials: result.credentials,
          patentNote: 'Recovery completed without any password - Quankey innovation'
        });
      } else {
        res.status(400).json({
          error: 'Recovery failed',
          message: result.message || 'Invalid or insufficient shares'
        });
      }
      
    } catch (error) {
      console.error('[RECOVERY-FAILED]', error);
      res.status(400).json({
        error: 'Recovery failed',
        message: error.message
      });
    }
  }
  
  /**
   * Get recovery kit status
   */
  static async getRecoveryStatus(req, res) {
    try {
      const userId = req.user.id;
      
      const activeKits = await prisma.recoveryKit.findMany({
        where: {
          userId: userId,
          isActive: true
        },
        include: {
          shares: {
            include: {
              distributions: {
                select: {
                  status: true,
                  trusteeEmail: true,
                  sentAt: true,
                  acceptedAt: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      const status = activeKits.map(kit => ({
        id: kit.id,
        type: kit.type,
        created: kit.createdAt,
        expires: kit.expiresAt,
        isExpired: kit.expiresAt < new Date(),
        shares: {
          total: kit.sharesTotal,
          required: kit.sharesRequired,
          distributed: kit.shares.filter(s => 
            s.distributions.some(d => d.status === 'SENT')
          ).length
        },
        socialRecovery: kit.type === 'SOCIAL_QUANTUM' ? {
          trustees: kit.shares.flatMap(s => 
            s.distributions.map(d => ({
              email: d.trusteeEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
              status: d.status,
              sentAt: d.sentAt,
              accepted: d.acceptedAt !== null
            }))
          )
        } : null
      }));
      
      res.json({
        success: true,
        hasActiveRecovery: activeKits.length > 0,
        kits: status,
        recommendation: activeKits.length === 0 ? 
          'Generate a recovery kit to protect your account' : null
      });
      
    } catch (error) {
      console.error('[RECOVERY-STATUS-ERROR]', error);
      res.status(500).json({
        error: 'Failed to get recovery status'
      });
    }
  }
  
  /**
   * Revoke recovery kit
   */
  static async revokeRecoveryKit(req, res) {
    try {
      const userId = req.user.id;
      const { kitId } = req.params;
      
      const kit = await prisma.recoveryKit.findFirst({
        where: {
          id: kitId,
          userId: userId,
          isActive: true
        }
      });
      
      if (!kit) {
        return res.status(404).json({
          error: 'Recovery kit not found or already revoked'
        });
      }
      
      // Deactivate kit
      await prisma.recoveryKit.update({
        where: { id: kitId },
        data: { isActive: false }
      });
      
      // Log revocation
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'RECOVERY_KIT_REVOKED',
          entityType: 'recovery_kit',
          entityId: kitId,
          metadata: {
            reason: req.body.reason || 'User initiated'
          }
        }
      });
      
      res.json({
        success: true,
        message: 'Recovery kit revoked successfully',
        kitId: kitId
      });
      
    } catch (error) {
      console.error('[REVOKE-KIT-ERROR]', error);
      res.status(500).json({
        error: 'Failed to revoke recovery kit'
      });
    }
  }
}

module.exports = { RecoveryController };