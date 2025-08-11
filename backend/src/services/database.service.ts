import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

// ÚNICA IMPLEMENTACIÓN - NO HAY OTRA
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
    
    // SSL OBLIGATORIO - SIN EXCEPCIONES
    if (!dbUrl.includes('sslmode=require') && !dbUrl.includes('sslmode=verify-full')) {
      console.error('❌ FATAL: SSL is MANDATORY. Add ?sslmode=require to DATABASE_URL');
      console.error('Current URL:', dbUrl.replace(/\/\/.*@/, '//***:***@')); // Log sin credenciales
      process.exit(1);
    }
    
    // VERIFICAR CERTIFICADO EN PRODUCCIÓN
    if (process.env.NODE_ENV === 'production' && !dbUrl.includes('sslmode=verify-full')) {
      console.error('❌ FATAL: Production requires sslmode=verify-full');
      process.exit(1);
    }
    
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: dbUrl }
      },
      log: ['error', 'warn'],
      errorFormat: 'minimal'
    });
    
    this.verifySecureConnection();
  }
  
  private async verifySecureConnection() {
    try {
      // Conectar primero
      await this.prisma.$connect();
      
      // Verificar que la conexión es SSL
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          current_setting('ssl') as ssl_enabled,
          version() as pg_version
      `;
      
      if (!result[0]?.ssl_enabled || result[0].ssl_enabled !== 'on') {
        throw new Error('SSL connection not established');
      }
      
      console.log('✅ Secure database connection verified');
      console.log(`   SSL Status: ${result[0].ssl_enabled}`);
      console.log(`   PostgreSQL: ${result[0].pg_version}`);
      
    } catch (error) {
      console.error('❌ FATAL: Secure connection verification failed:', error);
      process.exit(1);
    }
  }
  
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  getClient(): PrismaClient {
    return this.prisma;
  }
  
  // Audit trail obligatorio
  async auditOperation(operation: {
    userId: string;
    action: string;
    resource: string;
    result: 'SUCCESS' | 'FAILURE';
    metadata?: any;
  }) {
    const hash = createHash('sha256')
      .update(JSON.stringify(operation))
      .digest('hex');
    
    try {
      return await this.prisma.auditLog.create({
        data: {
          entityType: operation.resource,
          entityId: operation.userId,
          action: operation.action,
          timestamp: new Date(),
          metadata: operation.metadata ? JSON.stringify(operation.metadata) : null,
          userId: operation.userId
        }
      });
    } catch (error) {
      console.error('Audit log failed:', error);
      // No fallar la operación por un error de audit
    }
  }

  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // User Management Methods for WebAuthn
  async getUserByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email }
      });
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

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

  async storeTemporaryRegistration(data: {
    userId: string;
    username: string;
    email: string;
    challenge: string;
    expiresAt: Date;
  }) {
    try {
      // Store in a temporary table or cache
      // For now, using the User table with a flag
      return await this.prisma.user.create({
        data: {
          id: data.userId,
          username: data.username,
          email: data.email,
          passwordHash: '', // No password for WebAuthn users
          biometricEnabled: false, // Will be true after registration completes
          metadata: JSON.stringify({
            challenge: data.challenge,
            expiresAt: data.expiresAt.toISOString(),
            registrationPending: true
          })
        }
      });
    } catch (error) {
      console.error('Error storing temporary registration:', error);
      throw error;
    }
  }

  async createUser(data: {
    id: string;
    username: string;
    email: string;
    biometricEnabled?: boolean;
    metadata?: any;
  }) {
    try {
      return await this.prisma.user.create({
        data: {
          id: data.id,
          username: data.username,
          email: data.email,
          passwordHash: '', // No password for WebAuthn users
          biometricEnabled: data.biometricEnabled || true,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: Partial<{
    biometricEnabled: boolean;
    metadata: any;
  }>) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          biometricEnabled: data.biometricEnabled,
          metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
        }
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // =========================================
  // QUANTUM BIOMETRIC IDENTITY METHODS
  // =========================================

  async createQuantumIdentity(data: {
    id: string;
    username: string;
    credentialId: string;
    credentialPublicKey: string;
    quantumPublicKey: string;
    counter: number;
    deviceId: string;
    biometricType: string;
    algorithm: string;
    createdAt: Date;
  }) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Create quantum identity
        const identity = await tx.quantumIdentity.create({
          data: {
            id: data.id,
            username: data.username,
            quantumPublicKey: data.quantumPublicKey,
            biometricType: data.biometricType,
            algorithm: data.algorithm,
            deviceId: data.deviceId,
            createdAt: data.createdAt
          }
        });

        // Store credential
        await tx.biometricCredential.create({
          data: {
            id: data.credentialId,
            identityId: data.id,
            credentialPublicKey: data.credentialPublicKey,
            counter: data.counter,
            deviceId: data.deviceId
          }
        });

        return identity;
      });
    } catch (error) {
      console.error('Error creating quantum identity:', error);
      throw error;
    }
  }

  async getQuantumIdentity(username: string) {
    try {
      return await this.prisma.quantumIdentity.findUnique({
        where: { username }
      });
    } catch (error) {
      console.error('Error getting quantum identity:', error);
      throw error;
    }
  }

  async getQuantumIdentityById(id: string) {
    try {
      return await this.prisma.quantumIdentity.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error('Error getting quantum identity by id:', error);
      throw error;
    }
  }

  async getUserCredentials(identityId: string) {
    try {
      return await this.prisma.biometricCredential.findMany({
        where: { identityId }
      });
    } catch (error) {
      console.error('Error getting user credentials:', error);
      throw error;
    }
  }

  async getCredentialById(credentialId: string) {
    try {
      return await this.prisma.biometricCredential.findUnique({
        where: { id: credentialId }
      });
    } catch (error) {
      console.error('Error getting credential by id:', error);
      throw error;
    }
  }

  async updateCredentialCounter(credentialId: string, newCounter: number) {
    try {
      return await this.prisma.biometricCredential.update({
        where: { id: credentialId },
        data: { counter: newCounter }
      });
    } catch (error) {
      console.error('Error updating credential counter:', error);
      throw error;
    }
  }

  async getTemporaryRegistration(username: string) {
    try {
      const tempReg = await this.prisma.temporaryRegistration.findUnique({
        where: { username }
      });

      // Check if expired
      if (tempReg && tempReg.expiresAt < new Date()) {
        await this.deleteTemporaryRegistration(username);
        return null;
      }

      return tempReg;
    } catch (error) {
      console.error('Error getting temporary registration:', error);
      throw error;
    }
  }

  async deleteTemporaryRegistration(username: string) {
    try {
      return await this.prisma.temporaryRegistration.delete({
        where: { username }
      });
    } catch (error) {
      console.error('Error deleting temporary registration:', error);
      throw error;
    }
  }
}

// Exportar singleton
export const db = DatabaseService.getInstance();
export const prisma = db.getClient();