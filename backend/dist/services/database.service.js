"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.db = exports.DatabaseService = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
// ÚNICA IMPLEMENTACIÓN - NO HAY OTRA
class DatabaseService {
    constructor() {
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
        this.prisma = new client_1.PrismaClient({
            datasources: {
                db: { url: dbUrl }
            },
            log: ['error', 'warn'],
            errorFormat: 'minimal'
        });
        // Verificar conexión o morir
        this.verifyConnection();
    }
    async verifyConnection() {
        try {
            await this.prisma.$connect();
            console.log('✅ PostgreSQL connection verified with security checks');
        }
        catch (error) {
            console.error('❌ FATAL: Database connection failed:', error);
            process.exit(1);
        }
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    getClient() {
        return this.prisma;
    }
    // Audit trail obligatorio
    async auditOperation(operation) {
        const hash = (0, crypto_1.createHash)('sha256')
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
        }
        catch (error) {
            console.error('Audit log failed:', error);
            // No fallar la operación por un error de audit
        }
    }
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return { status: 'healthy' };
        }
        catch (error) {
            return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
}
exports.DatabaseService = DatabaseService;
// Exportar singleton
exports.db = DatabaseService.getInstance();
exports.prisma = exports.db.getClient();
