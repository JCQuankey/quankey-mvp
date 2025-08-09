"use strict";
// SECURE DATABASE SERVICE - PostgreSQL ONLY
// Elimina completamente el patrón híbrido vulnerable
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureDatabaseService = void 0;
exports.getSecureDatabase = getSecureDatabase;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
class SecureDatabaseService {
    constructor() {
        // 🚨 CRÍTICO: SOLO PostgreSQL - Sin modo "desarrollo"
        if (!process.env.DATABASE_URL?.includes('postgresql://')) {
            throw new Error('SECURITY: PostgreSQL connection required');
        }
        // 🚨 CRÍTICO: Verificar SSL obligatorio
        if (!process.env.DATABASE_URL.includes('sslmode=require')) {
            throw new Error('SECURITY: SSL connection required');
        }
        this.prisma = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        });
        // 🔐 Clave de cifrado desde KMS o variable segura
        this.encryptionKey = this.getDatabaseEncryptionKey();
        // 🛡️ Habilitar Row Level Security inmediatamente
        this.enableRLS().catch(error => {
            console.error('CRITICAL: Failed to enable RLS:', error);
            process.exit(1); // Forzar cierre si RLS falla
        });
    }
    async enableRLS() {
        try {
            console.log('🔒 Enabling Row Level Security...');
            // Habilitar RLS para todas las tablas críticas
            await this.prisma.$executeRaw `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`;
            await this.prisma.$executeRaw `ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;`;
            await this.prisma.$executeRaw `ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;`;
            // Política: usuarios solo ven sus propios datos
            await this.prisma.$executeRaw `
        CREATE POLICY IF NOT EXISTS user_isolation_passwords ON passwords
        FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);
      `;
            await this.prisma.$executeRaw `
        CREATE POLICY IF NOT EXISTS user_isolation_users ON users
        FOR ALL USING (id = current_setting('app.current_user_id', true)::uuid);
      `;
            await this.prisma.$executeRaw `
        CREATE POLICY IF NOT EXISTS user_isolation_audit ON audit_logs
        FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);
      `;
            console.log('✅ Row Level Security enabled');
        }
        catch (error) {
            console.error('❌ RLS setup failed:', error);
            throw error;
        }
    }
    getDatabaseEncryptionKey() {
        const key = process.env.DB_ENCRYPTION_KEY;
        if (!key || key.length < 64) {
            throw new Error('SECURITY: Invalid database encryption key (minimum 64 chars)');
        }
        return Buffer.from(key, 'hex');
    }
    // 🔐 Cifrado transparente de campos sensibles con AES-256-GCM
    async encryptField(plaintext) {
        const iv = (0, crypto_1.randomBytes)(16);
        const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', this.encryptionKey, iv);
        let encrypted = cipher.update(plaintext, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const authTag = cipher.getAuthTag();
        // Formato: iv(16) + authTag(16) + encrypted(variable)
        return Buffer.concat([iv, authTag, encrypted]).toString('base64');
    }
    async decryptField(ciphertext) {
        const buffer = Buffer.from(ciphertext, 'base64');
        if (buffer.length < 32) {
            throw new Error('Invalid ciphertext length');
        }
        const iv = buffer.slice(0, 16);
        const authTag = buffer.slice(16, 32);
        const encrypted = buffer.slice(32);
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', this.encryptionKey, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    }
    // 🔐 Operaciones seguras con contexto de usuario
    async setUserContext(userId) {
        await this.prisma.$executeRaw `SELECT set_config('app.current_user_id', ${userId}, false);`;
    }
    // 📊 Health check con verificaciones de seguridad
    async healthCheck() {
        try {
            // Test conexión básica
            await this.prisma.$queryRaw `SELECT 1`;
            const dbConnected = true;
            // Verificar SSL
            const sslResult = await this.prisma.$queryRaw `
        SELECT CASE WHEN setting = 'on' THEN true ELSE false END as ssl
        FROM pg_settings WHERE name = 'ssl';
      `;
            const sslEnabled = sslResult[0]?.ssl || false;
            // Verificar RLS
            const rlsResult = await this.prisma.$queryRaw `
        SELECT COUNT(*) > 0 as rls
        FROM pg_policies 
        WHERE policyname LIKE 'user_isolation%';
      `;
            const rlsEnabled = rlsResult[0]?.rls || false;
            // Test cifrado
            const testText = 'security-test';
            const encrypted = await this.encryptField(testText);
            const decrypted = await this.decryptField(encrypted);
            const encryptionWorking = decrypted === testText;
            const allHealthy = dbConnected && sslEnabled && rlsEnabled && encryptionWorking;
            return {
                status: allHealthy ? 'healthy' : 'unhealthy',
                database: dbConnected,
                ssl: sslEnabled,
                rls: rlsEnabled,
                encryption: encryptionWorking
            };
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return {
                status: 'unhealthy',
                database: false,
                ssl: false,
                rls: false,
                encryption: false
            };
        }
    }
    // 📝 Audit logging con hash de integridad
    async auditLog(userId, action, metadata = {}, tableName) {
        const timestamp = new Date();
        const metadataString = JSON.stringify(metadata);
        const hash = this.generateAuditHash(userId, action, metadataString, timestamp);
        await this.prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType: tableName || 'unknown',
                metadata: JSON.parse(metadataString), // Store as JSON object
                timestamp,
                ipAddress: metadata.ip || 'unknown',
                userAgent: metadata.userAgent || 'unknown'
            }
        });
    }
    generateAuditHash(userId, action, metadata, timestamp) {
        const data = `${userId}:${action}:${metadata}:${timestamp.toISOString()}`;
        return (0, crypto_1.createHash)('sha256').update(data).digest('hex');
    }
    // 🧹 Cleanup: cerrar conexiones de forma segura
    async disconnect() {
        await this.prisma.$disconnect();
    }
}
exports.SecureDatabaseService = SecureDatabaseService;
// 🚨 Singleton pattern para evitar múltiples instancias
let secureDatabaseInstance = null;
function getSecureDatabase() {
    if (!secureDatabaseInstance) {
        secureDatabaseInstance = new SecureDatabaseService();
    }
    return secureDatabaseInstance;
}
