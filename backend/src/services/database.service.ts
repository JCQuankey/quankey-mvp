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
}

// Exportar singleton
export const db = DatabaseService.getInstance();
export const prisma = db.getClient();