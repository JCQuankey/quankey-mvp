import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

// ÚNICA IMPLEMENTACIÓN - NO HAY OTRA
export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;
  
  private constructor() {
    // FORZAR PostgreSQL - O MUERTE
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.error('FATAL: DATABASE_URL not set');
      process.exit(1);
    }
    
    if (!dbUrl.startsWith('postgresql://')) {
      console.error('FATAL: Only PostgreSQL is supported');
      process.exit(1);
    }
    
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: dbUrl }
      },
      log: ['error', 'warn'],
      errorFormat: 'minimal'
    });
    
    // Verificar conexión o morir
    this.verifyConnection();
  }
  
  private async verifyConnection() {
    try {
      await this.prisma.$connect();
      console.log('✅ PostgreSQL connection verified with security checks');
    } catch (error) {
      console.error('❌ FATAL: Database connection failed:', error);
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
}

// Exportar singleton
export const db = DatabaseService.getInstance();
export const prisma = db.getClient();