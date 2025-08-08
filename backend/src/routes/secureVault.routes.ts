// SECURE VAULT ROUTES
// Quantum-resistant password storage with ML-KEM-768 encryption

import express, { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { SecureAuthMiddleware } from '../middleware/secureAuth.middleware';
import { SecurityMiddleware } from '../middleware/security.middleware';
import { QuantumSecurityService } from '../services/quantumSecurity.service';
import { getSecureDatabase } from '../services/secureDatabaseService';

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
// VAULT ITEM OPERATIONS
// ===========================================

/**
 * 🔐 CREATE PASSWORD - Store with quantum encryption
 */
router.post('/items',
  auth.validateToken,
  security.vaultLimiter,
  security.sanitizeMiddleware,
  [
    body('title').isString().isLength({ min: 1, max: 100 }).trim(),
    body('username').optional().isString().isLength({ max: 100 }).trim(),
    body('password').isString().isLength({ min: 1, max: 1000 }),
    body('website').optional().isURL({ require_protocol: false }).trim(),
    body('category').optional().isIn(['personal', 'work', 'financial', 'other']),
    body('notes').optional().isString().isLength({ max: 2000 }).trim(),
    body('isQuantum').optional().isBoolean(),
    body('entropySource').optional().isString().isLength({ max: 100 })
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await db.auditLog(req.user!.id, 'VAULT_VALIDATION_FAILED', {
          errors: errors.array(),
          operation: 'CREATE'
        });
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const user = req.user!;
      const { title, username, password, website, category, notes, isQuantum, entropySource } = req.body;

      console.log(`🔐 Creating vault item for user: ${user.id}`);

      // 🔍 Check vault limits (prevent abuse)
      const existingCount = await db.prisma.password.count({
        where: { userId: user.id }
      });

      const maxPasswords = user.quantumResistant ? 10000 : 1000; // Higher limit for quantum users
      if (existingCount >= maxPasswords) {
        await db.auditLog(user.id, 'VAULT_LIMIT_EXCEEDED', {
          currentCount: existingCount,
          maxAllowed: maxPasswords
        });
        return res.status(429).json({
          success: false,
          error: 'Vault limit exceeded',
          limit: maxPasswords
        });
      }

      // 🔐 Prepare encryption
      let encryptedData;
      let encryptionMetadata: any = {
        algorithm: 'AES-256-GCM',
        quantumResistant: false
      };

      if (user.quantumResistant && isQuantum !== false) {
        // 🌌 QUANTUM ENCRYPTION with ML-KEM-768
        console.log('🌌 Using quantum-resistant encryption...');

        // Get user's quantum keys
        const userKemKey = await db.prisma.quantumKey.findFirst({
          where: {
            userId: user.id,
            keyType: 'ML_KEM_768',
            purpose: 'encryption',
            active: true
          }
        });

        if (!userKemKey) {
          // Generate new quantum keys for user
          const kemKeys = await quantum.generateKEMKeyPair();
          await db.prisma.quantumKey.update({
            where: { keyId: kemKeys.keyId },
            data: { userId: user.id }
          });
          userKemKey = await db.prisma.quantumKey.findFirst({
            where: { keyId: kemKeys.keyId }
          });
        }

        if (userKemKey?.publicKey) {
          // 🔐 Encrypt with ML-KEM-768
          const encryptionResult = await quantum.encryptQuantumSafe(
            new TextEncoder().encode(password),
            new Uint8Array(userKemKey.publicKey)
          );

          encryptedData = {
            titleEncrypted: await db.encryptField(title),
            usernameEncrypted: await db.encryptField(username || ''),
            passwordEncrypted: Buffer.from(encryptionResult.ciphertext).toString('base64'),
            notesEncrypted: await db.encryptField(notes || ''),
            encapsulatedKey: encryptionResult.encapsulatedSecret,
            nonce: encryptionResult.nonce
          };

          encryptionMetadata = {
            algorithm: encryptionResult.algorithm,
            quantumResistant: true,
            kemAlgorithm: 'ML-KEM-768',
            encryptionMethod: 'ChaCha20-Poly1305'
          };
        } else {
          throw new Error('Quantum encryption keys not available');
        }
      } else {
        // 🔐 STANDARD ENCRYPTION (AES-256-GCM)
        encryptedData = {
          titleEncrypted: await db.encryptField(title),
          usernameEncrypted: await db.encryptField(username || ''),
          passwordEncrypted: await db.encryptField(password),
          notesEncrypted: await db.encryptField(notes || ''),
          encapsulatedKey: null,
          nonce: null
        };
      }

      // 💾 Store encrypted password
      const vaultItem = await db.prisma.password.create({
        data: {
          userId: user.id,
          titleEncrypted: encryptedData.titleEncrypted,
          usernameEncrypted: encryptedData.usernameEncrypted,
          passwordEncrypted: encryptedData.passwordEncrypted,
          notesEncrypted: encryptedData.notesEncrypted,
          website: website || null,
          category: category || 'other',
          isQuantum: encryptionMetadata.quantumResistant,
          entropySource: entropySource || (isQuantum ? 'quantum-generated' : 'user-provided'),
          algorithmUsed: encryptionMetadata.algorithm,
          kemEncrypted: encryptionMetadata.quantumResistant,
          encapsulatedKey: encryptedData.encapsulatedKey,
          nonce: encryptedData.nonce,
          version: 1,
          schemaVersion: '2.0'
        }
      });

      // 📝 Audit successful creation
      await db.auditLog(user.id, 'VAULT_ITEM_CREATED', {
        itemId: vaultItem.id,
        website: website,
        category: category,
        quantumEncrypted: encryptionMetadata.quantumResistant,
        algorithm: encryptionMetadata.algorithm
      });

      console.log(`✅ Vault item created: ${vaultItem.id} (Quantum: ${encryptionMetadata.quantumResistant})`);

      res.status(201).json({
        success: true,
        item: {
          id: vaultItem.id,
          website: vaultItem.website,
          category: vaultItem.category,
          isQuantum: vaultItem.isQuantum,
          algorithm: vaultItem.algorithmUsed,
          createdAt: vaultItem.createdAt
        },
        encryption: encryptionMetadata
      });

    } catch (error) {
      console.error('❌ Vault create error:', error);
      await db.auditLog(req.user?.id || 'unknown', 'VAULT_CREATE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to create vault item'
      });
    }
  }
);

/**
 * 📖 GET ALL PASSWORDS - Decrypt and return user's vault
 */
router.get('/items',
  auth.validateToken,
  security.vaultLimiter,
  [
    query('category').optional().isIn(['personal', 'work', 'financial', 'other']),
    query('search').optional().isString().isLength({ max: 100 }).trim(),
    query('quantum_only').optional().isBoolean()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const { category, search, quantum_only } = req.query;

      console.log(`📖 Retrieving vault items for user: ${user.id}`);

      // 🔍 Build query filters
      const whereClause: any = { userId: user.id };
      
      if (category) whereClause.category = category;
      if (quantum_only === 'true') whereClause.isQuantum = true;

      // 📖 Get encrypted items
      const encryptedItems = await db.prisma.password.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          titleEncrypted: true,
          usernameEncrypted: true,
          passwordEncrypted: true,
          notesEncrypted: true,
          website: true,
          category: true,
          isQuantum: true,
          entropySource: true,
          algorithmUsed: true,
          kemEncrypted: true,
          encapsulatedKey: true,
          nonce: true,
          createdAt: true,
          updatedAt: true,
          lastAccessedAt: true
        }
      });

      // 🔓 Decrypt items
      const decryptedItems = await Promise.all(
        encryptedItems.map(async (item) => {
          try {
            let decryptedPassword: string;

            if (item.kemEncrypted && item.encapsulatedKey && item.nonce) {
              // 🌌 QUANTUM DECRYPTION
              console.log(`🔓 Quantum decrypting item: ${item.id}`);
              
              const userKemKey = await db.prisma.quantumKey.findFirst({
                where: {
                  userId: user.id,
                  keyType: 'ML_KEM_768',
                  active: true
                }
              });

              if (userKemKey) {
                const decryptedBytes = await quantum.decryptQuantumSafe(
                  new Uint8Array(Buffer.from(item.passwordEncrypted, 'base64')),
                  new Uint8Array(item.encapsulatedKey),
                  new Uint8Array(item.nonce),
                  userKemKey.keyId
                );
                decryptedPassword = new TextDecoder().decode(decryptedBytes);
              } else {
                throw new Error('Quantum decryption keys not found');
              }
            } else {
              // 🔐 STANDARD DECRYPTION
              decryptedPassword = await db.decryptField(item.passwordEncrypted);
            }

            // 📅 Update last accessed
            db.prisma.password.update({
              where: { id: item.id },
              data: { lastAccessedAt: new Date() }
            }).catch(console.error); // Non-blocking

            return {
              id: item.id,
              title: await db.decryptField(item.titleEncrypted),
              username: await db.decryptField(item.usernameEncrypted),
              password: decryptedPassword,
              notes: item.notesEncrypted ? await db.decryptField(item.notesEncrypted) : '',
              website: item.website,
              category: item.category,
              isQuantum: item.isQuantum,
              entropySource: item.entropySource,
              algorithm: item.algorithmUsed,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              lastAccessedAt: item.lastAccessedAt
            };
          } catch (decryptError) {
            console.error(`❌ Failed to decrypt item ${item.id}:`, decryptError);
            return null; // Skip corrupted items
          }
        })
      );

      // 🧹 Filter out failed decryptions
      const validItems = decryptedItems.filter(item => item !== null);

      // 🔍 Apply search filter if provided
      let filteredItems = validItems;
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredItems = validItems.filter(item =>
          item!.title.toLowerCase().includes(searchLower) ||
          item!.website?.toLowerCase().includes(searchLower) ||
          item!.username.toLowerCase().includes(searchLower)
        );
      }

      // 📝 Audit vault access
      await db.auditLog(user.id, 'VAULT_ITEMS_ACCESSED', {
        itemCount: filteredItems.length,
        quantumItems: filteredItems.filter(item => item!.isQuantum).length,
        searchQuery: search || null,
        category: category || null
      });

      console.log(`✅ Retrieved ${filteredItems.length} vault items for user: ${user.id}`);

      res.json({
        success: true,
        items: filteredItems,
        metadata: {
          total: filteredItems.length,
          quantumEncrypted: filteredItems.filter(item => item!.isQuantum).length,
          categories: [...new Set(filteredItems.map(item => item!.category))],
          algorithms: [...new Set(filteredItems.map(item => item!.algorithm))]
        }
      });

    } catch (error) {
      console.error('❌ Vault retrieve error:', error);
      await db.auditLog(req.user?.id || 'unknown', 'VAULT_RETRIEVE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve vault items'
      });
    }
  }
);

/**
 * 🔄 UPDATE PASSWORD - Re-encrypt with latest quantum algorithms
 */
router.put('/items/:id',
  auth.validateToken,
  security.vaultLimiter,
  security.sanitizeMiddleware,
  [
    param('id').isUUID(),
    body('title').optional().isString().isLength({ min: 1, max: 100 }).trim(),
    body('username').optional().isString().isLength({ max: 100 }).trim(),
    body('password').optional().isString().isLength({ min: 1, max: 1000 }),
    body('website').optional().isURL({ require_protocol: false }).trim(),
    body('category').optional().isIn(['personal', 'work', 'financial', 'other']),
    body('notes').optional().isString().isLength({ max: 2000 }).trim()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const user = req.user!;
      const itemId = req.params.id;
      const updates = req.body;

      console.log(`🔄 Updating vault item: ${itemId} for user: ${user.id}`);

      // 🔍 Find existing item
      const existingItem = await db.prisma.password.findFirst({
        where: {
          id: itemId,
          userId: user.id
        }
      });

      if (!existingItem) {
        await db.auditLog(user.id, 'VAULT_UPDATE_NOT_FOUND', { itemId });
        return res.status(404).json({
          success: false,
          error: 'Vault item not found'
        });
      }

      // 🔐 Prepare updated encrypted data
      const encryptedUpdates: any = {};
      let reencrypted = false;

      if (updates.title) {
        encryptedUpdates.titleEncrypted = await db.encryptField(updates.title);
        reencrypted = true;
      }
      if (updates.username !== undefined) {
        encryptedUpdates.usernameEncrypted = await db.encryptField(updates.username);
        reencrypted = true;
      }
      if (updates.password) {
        if (user.quantumResistant && existingItem.kemEncrypted) {
          // Re-encrypt with quantum
          const userKemKey = await db.prisma.quantumKey.findFirst({
            where: { userId: user.id, keyType: 'ML_KEM_768', active: true }
          });

          if (userKemKey?.publicKey) {
            const encryptionResult = await quantum.encryptQuantumSafe(
              new TextEncoder().encode(updates.password),
              new Uint8Array(userKemKey.publicKey)
            );
            
            encryptedUpdates.passwordEncrypted = Buffer.from(encryptionResult.ciphertext).toString('base64');
            encryptedUpdates.encapsulatedKey = encryptionResult.encapsulatedSecret;
            encryptedUpdates.nonce = encryptionResult.nonce;
          }
        } else {
          encryptedUpdates.passwordEncrypted = await db.encryptField(updates.password);
        }
        reencrypted = true;
      }
      if (updates.notes !== undefined) {
        encryptedUpdates.notesEncrypted = await db.encryptField(updates.notes);
        reencrypted = true;
      }

      // 📝 Update non-encrypted fields
      if (updates.website !== undefined) encryptedUpdates.website = updates.website;
      if (updates.category) encryptedUpdates.category = updates.category;

      // 📅 Update version if re-encrypted
      if (reencrypted) {
        encryptedUpdates.version = existingItem.version + 1;
        encryptedUpdates.schemaVersion = '2.0';
      }

      // 💾 Apply updates
      const updatedItem = await db.prisma.password.update({
        where: { id: itemId },
        data: encryptedUpdates
      });

      // 📝 Audit update
      await db.auditLog(user.id, 'VAULT_ITEM_UPDATED', {
        itemId,
        fieldsUpdated: Object.keys(updates),
        reencrypted,
        newVersion: updatedItem.version
      });

      console.log(`✅ Vault item updated: ${itemId} (Version: ${updatedItem.version})`);

      res.json({
        success: true,
        item: {
          id: updatedItem.id,
          version: updatedItem.version,
          updatedAt: updatedItem.updatedAt
        },
        reencrypted
      });

    } catch (error) {
      console.error('❌ Vault update error:', error);
      await db.auditLog(req.user?.id || 'unknown', 'VAULT_UPDATE_ERROR', {
        itemId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to update vault item'
      });
    }
  }
);

/**
 * 🗑️ DELETE PASSWORD - Secure deletion with audit
 */
router.delete('/items/:id',
  auth.validateToken,
  security.vaultLimiter,
  [
    param('id').isUUID()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid item ID'
        });
      }

      const user = req.user!;
      const itemId = req.params.id;

      console.log(`🗑️ Deleting vault item: ${itemId} for user: ${user.id}`);

      // 🔍 Verify ownership
      const existingItem = await db.prisma.password.findFirst({
        where: {
          id: itemId,
          userId: user.id
        }
      });

      if (!existingItem) {
        await db.auditLog(user.id, 'VAULT_DELETE_NOT_FOUND', { itemId });
        return res.status(404).json({
          success: false,
          error: 'Vault item not found'
        });
      }

      // 🗑️ Secure deletion
      await db.prisma.password.delete({
        where: { id: itemId }
      });

      // 📝 Audit deletion
      await db.auditLog(user.id, 'VAULT_ITEM_DELETED', {
        itemId,
        website: existingItem.website,
        category: existingItem.category,
        wasQuantum: existingItem.isQuantum
      });

      console.log(`✅ Vault item deleted: ${itemId}`);

      res.json({
        success: true,
        message: 'Vault item deleted successfully'
      });

    } catch (error) {
      console.error('❌ Vault delete error:', error);
      await db.auditLog(req.user?.id || 'unknown', 'VAULT_DELETE_ERROR', {
        itemId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete vault item'
      });
    }
  }
);

// ===========================================
// VAULT STATISTICS AND HEALTH
// ===========================================

/**
 * 📊 GET VAULT STATS - Security metrics and health
 */
router.get('/stats',
  auth.validateToken,
  security.apiLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;

      console.log(`📊 Getting vault stats for user: ${user.id}`);

      // 📊 Calculate comprehensive stats
      const totalItems = await db.prisma.password.count({
        where: { userId: user.id }
      });

      const quantumItems = await db.prisma.password.count({
        where: { userId: user.id, isQuantum: true }
      });

      const itemsByCategory = await db.prisma.password.groupBy({
        by: ['category'],
        where: { userId: user.id },
        _count: true
      });

      const recentActivity = await db.prisma.password.count({
        where: {
          userId: user.id,
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      const algorithms = await db.prisma.password.groupBy({
        by: ['algorithmUsed'],
        where: { userId: user.id },
        _count: true
      });

      // 📝 Audit stats access
      await db.auditLog(user.id, 'VAULT_STATS_ACCESSED', {
        totalItems,
        quantumItems
      });

      res.json({
        success: true,
        stats: {
          totalItems,
          quantumItems,
          traditionalItems: totalItems - quantumItems,
          quantumPercentage: totalItems > 0 ? Math.round((quantumItems / totalItems) * 100) : 0,
          categoryBreakdown: itemsByCategory.map(cat => ({
            category: cat.category,
            count: cat._count
          })),
          algorithmBreakdown: algorithms.map(alg => ({
            algorithm: alg.algorithmUsed,
            count: alg._count
          })),
          recentActivity,
          securityScore: this.calculateSecurityScore(totalItems, quantumItems, recentActivity),
          recommendations: this.generateRecommendations(totalItems, quantumItems, user.quantumResistant)
        },
        user: {
          quantumResistant: user.quantumResistant,
          plan: user.quantumResistant ? 'Quantum Pro' : 'Standard'
        }
      });

    } catch (error) {
      console.error('❌ Vault stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get vault statistics'
      });
    }
  }
);

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function calculateSecurityScore(total: number, quantum: number, recent: number): number {
  if (total === 0) return 0;
  
  const quantumScore = (quantum / total) * 50; // Up to 50 points for quantum
  const activityScore = Math.min((recent / total) * 30, 30); // Up to 30 points for recent activity
  const volumeScore = Math.min(total / 100 * 20, 20); // Up to 20 points for having passwords
  
  return Math.round(quantumScore + activityScore + volumeScore);
}

function generateRecommendations(total: number, quantum: number, isQuantumUser: boolean): string[] {
  const recommendations: string[] = [];
  
  if (total === 0) {
    recommendations.push('Add your first password to get started');
  }
  
  if (isQuantumUser && quantum < total) {
    recommendations.push('Upgrade remaining passwords to quantum encryption');
  }
  
  if (!isQuantumUser) {
    recommendations.push('Upgrade to Quantum Pro for post-quantum security');
  }
  
  if (total > 0 && quantum / total < 0.5) {
    recommendations.push('Consider using quantum-generated passwords for better security');
  }
  
  return recommendations;
}

export default router;