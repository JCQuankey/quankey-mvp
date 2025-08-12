/**
 * 🧬 QUANTUM-BIOMETRIC PRISMA SERVICE - Master Plan v6.0
 * ⚠️ PASSWORDLESS DATABASE: PostgreSQL with biometric-quantum encryption
 * 
 * REVOLUTIONARY FEATURES:
 * - NO password model (completely passwordless)
 * - VaultItem model with quantum encryption
 * - Biometric-derived keys for vault access
 * - Zero-knowledge storage architecture
 * 
 * GOLDEN RULE: This is a PASSWORDLESS system using quantum-biometric identity
 */

import { PrismaClient, User, VaultItem, Session } from '@prisma/client';

// Initialize Prisma client singleton
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

export interface UserData {
  id: string;
  username: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  // Quantum-biometric fields only
  quantumResistant?: boolean;
  quantumAlgorithm?: string;
  biometricEnabled: boolean;
}

export interface VaultItemData {
  id: string;
  userId: string;
  itemType: 'credential' | 'note' | 'card' | 'secure_note';
  title: string;
  encryptedData: Uint8Array;      // Quantum-encrypted item data
  wrappedDEK: Uint8Array;         // DEK wrapped with biometric-derived key
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
  lastActivity: Date;
}

export class DatabaseService {
  private client: PrismaClient;
  private static instance: DatabaseService;

  private constructor() {
    this.client = prisma;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // ========================================
  // USER MANAGEMENT (Passwordless)
  // ========================================

  async createUser(userData: {
    username: string;
    displayName: string;
  }): Promise<UserData | null> {
    try {
      const user = await this.client.user.create({
        data: {
          username: userData.username,
          displayName: userData.displayName,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`👤 Created passwordless user in PostgreSQL: ${userData.username}`);
      
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        biometricEnabled: true, // Always true in this passwordless system
        quantumResistant: true,
        quantumAlgorithm: 'ML-KEM-768'
      };
    } catch (error) {
      console.error('❌ Error creating passwordless user:', error);
      return null;
    }
  }

  async findUserByUsername(username: string): Promise<UserData | null> {
    try {
      const user = await this.client.user.findUnique({
        where: { username }
      });

      if (!user) return null;

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        biometricEnabled: true,
        quantumResistant: true,
        quantumAlgorithm: 'ML-KEM-768'
      };
    } catch (error) {
      console.error('❌ Error finding user:', error);
      return null;
    }
  }

  async updateLastLogin(userId: string): Promise<boolean> {
    try {
      await this.client.user.update({
        where: { id: userId },
        data: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('❌ Error updating last login:', error);
      return false;
    }
  }

  // ========================================
  // VAULT ITEM MANAGEMENT (Quantum-Biometric)
  // ========================================

  async createVaultItem(userId: string, vaultData: {
    itemType: 'credential' | 'note' | 'card' | 'secure_note';
    title: string;
    encryptedData: Uint8Array;
    wrappedDEK: Uint8Array;
  }): Promise<VaultItemData | null> {
    try {
      const vaultItem = await this.client.vaultItem.create({
        data: {
          userId,
          itemType: vaultData.itemType,
          title: vaultData.title,
          encryptedData: vaultData.encryptedData,
          wrappedDEK: vaultData.wrappedDEK,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`🔒 Created quantum vault item for user: ${userId}`);
      
      return {
        id: vaultItem.id,
        userId: vaultItem.userId,
        itemType: vaultItem.itemType as any,
        title: vaultItem.title,
        encryptedData: new Uint8Array(vaultItem.encryptedData),
        wrappedDEK: new Uint8Array(vaultItem.wrappedDEK),
        createdAt: vaultItem.createdAt,
        updatedAt: vaultItem.updatedAt
      };
    } catch (error) {
      console.error('❌ Error creating vault item:', error);
      return null;
    }
  }

  async getVaultItems(userId: string): Promise<VaultItemData[]> {
    try {
      const vaultItems = await this.client.vaultItem.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });

      console.log(`📋 Retrieved ${vaultItems.length} vault items for user: ${userId}`);

      return vaultItems.map(item => ({
        id: item.id,
        userId: item.userId,
        itemType: item.itemType as any,
        title: item.title,
        encryptedData: item.encryptedData,
        wrappedDEK: item.wrappedDEK,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      console.error('❌ Error getting vault items:', error);
      return [];
    }
  }

  async getVaultItem(userId: string, itemId: string): Promise<VaultItemData | null> {
    try {
      const vaultItem = await this.client.vaultItem.findFirst({
        where: {
          id: itemId,
          userId
        }
      });

      if (!vaultItem) return null;

      return {
        id: vaultItem.id,
        userId: vaultItem.userId,
        itemType: vaultItem.itemType as any,
        title: vaultItem.title,
        encryptedData: new Uint8Array(vaultItem.encryptedData),
        wrappedDEK: new Uint8Array(vaultItem.wrappedDEK),
        createdAt: vaultItem.createdAt,
        updatedAt: vaultItem.updatedAt
      };
    } catch (error) {
      console.error('❌ Error getting vault item:', error);
      return null;
    }
  }

  async updateVaultItem(userId: string, itemId: string, updateData: {
    title?: string;
    encryptedData?: Uint8Array;
    wrappedDEK?: Uint8Array;
  }): Promise<boolean> {
    try {
      await this.client.vaultItem.update({
        where: { id: itemId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('❌ Error updating vault item:', error);
      return false;
    }
  }

  async deleteVaultItem(userId: string, itemId: string): Promise<boolean> {
    try {
      await this.client.vaultItem.deleteMany({
        where: {
          id: itemId,
          userId
        }
      });
      console.log(`🗑️ Deleted vault item: ${itemId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting vault item:', error);
      return false;
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  async createSession(sessionData: {
    token: string;
    userId: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<SessionData | null> {
    try {
      const session = await this.client.session.create({
        data: {
          token: sessionData.token,
          userId: sessionData.userId,
          expiresAt: sessionData.expiresAt,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
          createdAt: new Date(),
          lastActivity: new Date()
        }
      });

      return {
        id: session.id,
        token: session.token,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        lastActivity: session.lastActivity
      };
    } catch (error) {
      console.error('❌ Error creating session:', error);
      return null;
    }
  }

  async findSession(token: string): Promise<SessionData | null> {
    try {
      const session = await this.client.session.findUnique({
        where: { token }
      });

      if (!session) return null;

      return {
        id: session.id,
        token: session.token,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        lastActivity: session.lastActivity
      };
    } catch (error) {
      console.error('❌ Error finding session:', error);
      return null;
    }
  }

  async deleteSession(token: string): Promise<boolean> {
    try {
      await this.client.session.delete({
        where: { token }
      });
      return true;
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      return false;
    }
  }

  // ========================================
  // AUDIT OPERATIONS
  // ========================================

  async auditOperation(data: {
    userId: string;
    action: string;
    resource: string;
    result: 'SUCCESS' | 'FAILURE';
    metadata?: any;
  }): Promise<void> {
    try {
      // In this passwordless system, we could add audit logging
      // For now, just console log
      console.log(`📊 AUDIT: User ${data.userId} performed ${data.action} on ${data.resource}: ${data.result}`);
    } catch (error) {
      console.error('❌ Audit operation failed:', error);
    }
  }

  // ========================================
  // SYSTEM OPERATIONS
  // ========================================

  async getStats(): Promise<{ users: number; vaultItems: number; sessions: number }> {
    try {
      const [userCount, vaultItemCount, sessionCount] = await Promise.all([
        this.client.user.count(),
        this.client.vaultItem.count(),
        this.client.session.count()
      ]);

      return {
        users: userCount,
        vaultItems: vaultItemCount,
        sessions: sessionCount
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return { users: 0, vaultItems: 0, sessions: 0 };
    }
  }

  async cleanup(): Promise<{ deletedUsers: number; deletedVaultItems: number; deletedSessions: number }> {
    try {
      const [deletedVaultItems, deletedSessions, deletedUsers] = await Promise.all([
        this.client.vaultItem.deleteMany({}),
        this.client.session.deleteMany({}),
        this.client.user.deleteMany({})
      ]);

      console.log('🧹 Database cleanup completed (passwordless system)');
      
      return {
        deletedUsers: deletedUsers.count,
        deletedVaultItems: deletedVaultItems.count,
        deletedSessions: deletedSessions.count
      };
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return { deletedUsers: 0, deletedVaultItems: 0, deletedSessions: 0 };
    }
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}

export { prisma };