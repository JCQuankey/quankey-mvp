/**
 * 🧬 DATABASE SERVICE - Master Plan v6.0 PASSWORDLESS
 * ⚠️ ONLY USES REAL PRISMA SCHEMA MODELS
 * 
 * AVAILABLE MODELS (from schema.prisma):
 * - User (id, username, displayName, createdAt, updatedAt, lastLogin)
 * - PasskeyCredential (WebAuthn credentials)
 * - UserDevice (PQC keys for devices)
 * - VaultItem (quantum-encrypted vault items)
 * - Session (user sessions)
 * - GuardianShare (recovery shares)
 * - TemporaryRegistration (passkey registration)
 * - PairingSession (device pairing)
 * - AuditLog (audit trails)
 * 
 * NO PASSWORD FIELDS ANYWHERE - This is a passwordless system!
 */

import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;
  
  private constructor() {
    const dbUrl = process.env.DATABASE_URL;
    
    // VALIDACIÓN EXTREMA - NO NEGOCIABLE
    if (!dbUrl) {
      console.error('❌ FATAL: DATABASE_URL not configured');
      process.exit(1);
    }
    
    if (!dbUrl.startsWith('postgresql://')) {
      console.error('❌ FATAL: Only PostgreSQL is supported');
      process.exit(1);
    }
    
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: dbUrl }
      },
      log: ['error', 'warn'],
      errorFormat: 'minimal'
    });
    
    this.verifyConnection();
  }
  
  private async verifyConnection() {
    try {
      await this.prisma.$connect();
      console.log('✅ PostgreSQL connected (passwordless schema)');
    } catch (error) {
      console.error('❌ FATAL: Database connection failed:', error);
      process.exit(1);
    }
  }
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // ========================================
  // USER MANAGEMENT (Passwordless Only)
  // ========================================

  async getUserByUsername(username: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { username }
      });
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  async createUser(data: {
    username: string;
    displayName: string;
  }) {
    try {
      return await this.prisma.user.create({
        data: {
          username: data.username,
          displayName: data.displayName
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserLastLogin(userId: string) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  // ========================================
  // PASSKEY CREDENTIALS (WebAuthn)
  // ========================================

  async storePasskeyCredential(data: {
    userId: string;
    credentialId: string;
    publicKey: Uint8Array;
    signCount: number;
  }) {
    try {
      return await this.prisma.passkeyCredential.create({
        data: {
          userId: data.userId,
          credentialId: data.credentialId,
          publicKey: data.publicKey,
          signCount: data.signCount
        }
      });
    } catch (error) {
      console.error('Error storing passkey credential:', error);
      throw error;
    }
  }

  async getPasskeyCredential(credentialId: string) {
    try {
      return await this.prisma.passkeyCredential.findUnique({
        where: { credentialId }
      });
    } catch (error) {
      console.error('Error getting passkey credential:', error);
      return null;
    }
  }

  async updatePasskeySignCount(credentialId: string, signCount: number) {
    try {
      return await this.prisma.passkeyCredential.update({
        where: { credentialId },
        data: { 
          signCount,
          lastUsed: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating passkey sign count:', error);
      throw error;
    }
  }

  // ========================================
  // USER DEVICES (PQC Keys)
  // ========================================

  async createUserDevice(data: {
    userId: string;
    deviceName: string;
    pqcPublicKey: Uint8Array;
    wrappedMasterKey?: Uint8Array;
  }) {
    try {
      return await this.prisma.userDevice.create({
        data: {
          userId: data.userId,
          deviceName: data.deviceName,
          pqcPublicKey: data.pqcPublicKey,
          wrappedMasterKey: data.wrappedMasterKey
        }
      });
    } catch (error) {
      console.error('Error creating user device:', error);
      throw error;
    }
  }

  async getUserDevices(userId: string) {
    try {
      return await this.prisma.userDevice.findMany({
        where: { userId },
        orderBy: { lastUsed: 'desc' }
      });
    } catch (error) {
      console.error('Error getting user devices:', error);
      return [];
    }
  }

  // ========================================
  // VAULT ITEMS (Quantum Encrypted)
  // ========================================

  async createVaultItem(data: {
    userId: string;
    itemType: string;
    title: string;
    encryptedData: Uint8Array;
    wrappedDEK: Uint8Array;
  }) {
    try {
      return await this.prisma.vaultItem.create({
        data: {
          userId: data.userId,
          itemType: data.itemType,
          title: data.title,
          encryptedData: data.encryptedData,
          wrappedDEK: data.wrappedDEK
        }
      });
    } catch (error) {
      console.error('Error creating vault item:', error);
      throw error;
    }
  }

  async getVaultItems(userId: string) {
    try {
      return await this.prisma.vaultItem.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });
    } catch (error) {
      console.error('Error getting vault items:', error);
      return [];
    }
  }

  async getVaultItem(userId: string, itemId: string) {
    try {
      return await this.prisma.vaultItem.findFirst({
        where: {
          id: itemId,
          userId
        }
      });
    } catch (error) {
      console.error('Error getting vault item:', error);
      return null;
    }
  }

  // ========================================
  // SESSIONS
  // ========================================

  async createSession(data: {
    token: string;
    userId: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.session.create({
        data: {
          token: data.token,
          userId: data.userId,
          expiresAt: data.expiresAt,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          lastActivity: new Date()
        }
      });
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(token: string) {
    try {
      return await this.prisma.session.findUnique({
        where: { token }
      });
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async deleteSession(token: string) {
    try {
      return await this.prisma.session.delete({
        where: { token }
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      return null;
    }
  }

  // ========================================
  // TEMPORARY REGISTRATION (Passkeys)
  // ========================================

  async storeTemporaryRegistration(data: {
    userId: string;
    username: string;
    challenge: string;
    expiresAt: Date;
  }) {
    try {
      return await this.prisma.temporaryRegistration.create({
        data: {
          userId: data.userId,
          username: data.username,
          challenge: data.challenge,
          expiresAt: data.expiresAt
        }
      });
    } catch (error) {
      console.error('Error storing temporary registration:', error);
      throw error;
    }
  }

  async getTemporaryRegistration(userId: string) {
    try {
      return await this.prisma.temporaryRegistration.findUnique({
        where: { userId }
      });
    } catch (error) {
      console.error('Error getting temporary registration:', error);
      return null;
    }
  }

  async deleteTemporaryRegistration(userId: string) {
    try {
      return await this.prisma.temporaryRegistration.delete({
        where: { userId }
      });
    } catch (error) {
      console.error('Error deleting temporary registration:', error);
      return null;
    }
  }

  // ========================================
  // AUDIT LOGGING
  // ========================================

  async createAuditLog(data: {
    userId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          metadata: data.metadata,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  // ========================================
  // LEGACY COMPATIBILITY METHODS
  // ========================================

  async getUserByEmail(email: string) {
    // Email removed in passwordless system, use username instead
    console.warn('getUserByEmail called - email removed in passwordless system');
    return null;
  }

  async getUserById(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async createQuantumIdentity(data: any) {
    console.warn('createQuantumIdentity deprecated - use storePasskeyCredential');
    return null;
  }

  async getQuantumIdentity(username: string) {
    console.warn('getQuantumIdentity deprecated - use getUserByUsername');
    return await this.getUserByUsername(username);
  }

  async getQuantumIdentityById(id: string) {
    console.warn('getQuantumIdentityById deprecated - use getUserById');
    return await this.getUserById(id);
  }

  async getUserCredentials(userId: string) {
    try {
      return await this.prisma.passkeyCredential.findMany({
        where: { userId }
      });
    } catch (error) {
      console.error('Error getting user credentials:', error);
      return [];
    }
  }

  async getCredentialById(credentialId: string) {
    return await this.getPasskeyCredential(credentialId);
  }

  async updateCredentialCounter(credentialId: string, counter: number) {
    return await this.updatePasskeySignCount(credentialId, counter);
  }

  async auditOperation(data: {
    userId: string;
    action: string;
    resource: string;
    result: string;
    metadata?: any;
  }) {
    return await this.createAuditLog({
      userId: data.userId,
      action: data.action,
      entityType: 'resource',
      entityId: data.resource,
      metadata: { result: data.result, ...data.metadata }
    });
  }

  async healthCheck() {
    try {
      await this.prisma.user.count();
      return { status: 'healthy', database: 'connected' };
    } catch (error) {
      return { status: 'unhealthy', database: 'disconnected', error };
    }
  }

  // ========================================
  // SYSTEM OPERATIONS
  // ========================================

  async getStats() {
    try {
      const [userCount, credentialCount, vaultItemCount, sessionCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.passkeyCredential.count(),
        this.prisma.vaultItem.count(),
        this.prisma.session.count()
      ]);

      return {
        users: userCount,
        credentials: credentialCount,
        vaultItems: vaultItemCount,
        sessions: sessionCount
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { users: 0, credentials: 0, vaultItems: 0, sessions: 0 };
    }
  }

  async cleanup() {
    try {
      // Clean up in correct order due to foreign keys
      await this.prisma.auditLog.deleteMany({});
      await this.prisma.session.deleteMany({});
      await this.prisma.vaultItem.deleteMany({});
      await this.prisma.userDevice.deleteMany({});
      await this.prisma.passkeyCredential.deleteMany({});
      await this.prisma.temporaryRegistration.deleteMany({});
      await this.prisma.user.deleteMany({});

      console.log('🧹 Database cleanup completed (passwordless system)');
      return true;
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return false;
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
    console.log('👋 Database disconnected');
  }
}

export const db = DatabaseService.getInstance();
export const prisma = db['prisma']; // For legacy compatibility