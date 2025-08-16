"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.db = exports.DatabaseService = void 0;
const client_1 = require("@prisma/client");
class DatabaseService {
    constructor() {
        const dbUrl = process.env.DATABASE_URL;
        // VALIDACIÓN EXTREMA - NO NEGOCIABLE
        if (!dbUrl) {
            console.error('❌ FATAL: DATABASE_URL not configured');
            process.exit(1);
        }
        if (!dbUrl.startsWith('postgresql://')) {
            console.error('❌ FATAL: Only PostgreSQL is supported for production');
            console.error('🧬 Quankey requires PostgreSQL for quantum biometric operations');
            process.exit(1);
        }
        // Production-grade PostgreSQL configuration
        this.prisma = new client_1.PrismaClient({
            datasources: {
                db: { url: dbUrl }
            },
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['warn', 'error'],
            errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal'
        });
        this.verifyConnection();
    }
    async verifyConnection() {
        try {
            await this.prisma.$connect();
            // Test database with a simple query
            await this.prisma.$queryRaw `SELECT 1 as test`;
            console.log('✅ PostgreSQL connected successfully (passwordless quantum biometric schema)');
            console.log('🧬 Database optimized for: ML-KEM-768, ML-DSA-65, WebAuthn, Guardian Shares');
            // Verify critical extensions are available (don't fail if missing)
            try {
                await this.prisma.$queryRaw `SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'`;
                console.log('✅ UUID extension available for quantum-resistant IDs');
            }
            catch (e) {
                console.warn('⚠️  uuid-ossp extension not found - using default UUIDs');
            }
        }
        catch (error) {
            console.error('❌ FATAL: PostgreSQL connection failed:', error);
            console.error('🔧 Run: bash scripts/setup-postgresql.sh');
            process.exit(1);
        }
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    // ========================================
    // USER MANAGEMENT (Passwordless Only)
    // ========================================
    async getUserByUsername(username) {
        try {
            return await this.prisma.user.findUnique({
                where: { username }
            });
        }
        catch (error) {
            console.error('Error getting user by username:', error);
            return null;
        }
    }
    async createUser(data) {
        try {
            return await this.prisma.user.create({
                data: {
                    username: data.username,
                    displayName: data.displayName
                }
            });
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
    async updateUserLastLogin(userId) {
        try {
            return await this.prisma.user.update({
                where: { id: userId },
                data: {
                    lastLogin: new Date(),
                    updatedAt: new Date()
                }
            });
        }
        catch (error) {
            console.error('Error updating last login:', error);
            throw error;
        }
    }
    // ========================================
    // PASSKEY CREDENTIALS (WebAuthn)
    // ========================================
    async storePasskeyCredential(data) {
        try {
            return await this.prisma.passkeyCredential.create({
                data: {
                    userId: data.userId,
                    credentialId: data.credentialId,
                    publicKey: data.publicKey,
                    signCount: data.signCount
                }
            });
        }
        catch (error) {
            console.error('Error storing passkey credential:', error);
            throw error;
        }
    }
    async getPasskeyCredential(credentialId) {
        try {
            return await this.prisma.passkeyCredential.findUnique({
                where: { credentialId }
            });
        }
        catch (error) {
            console.error('Error getting passkey credential:', error);
            return null;
        }
    }
    async updatePasskeySignCount(credentialId, signCount) {
        try {
            return await this.prisma.passkeyCredential.update({
                where: { credentialId },
                data: {
                    signCount,
                    lastUsed: new Date()
                }
            });
        }
        catch (error) {
            console.error('Error updating passkey sign count:', error);
            throw error;
        }
    }
    // ========================================
    // USER DEVICES (PQC Keys)
    // ========================================
    async createUserDevice(data) {
        try {
            return await this.prisma.userDevice.create({
                data: {
                    userId: data.userId,
                    deviceName: data.deviceName,
                    pqcPublicKey: data.pqcPublicKey,
                    wrappedMasterKey: data.wrappedMasterKey
                }
            });
        }
        catch (error) {
            console.error('Error creating user device:', error);
            throw error;
        }
    }
    async getUserDevices(userId) {
        try {
            return await this.prisma.userDevice.findMany({
                where: { userId },
                orderBy: { lastUsed: 'desc' }
            });
        }
        catch (error) {
            console.error('Error getting user devices:', error);
            return [];
        }
    }
    // ========================================
    // VAULT ITEMS (Quantum Encrypted)
    // ========================================
    async createVaultItem(data) {
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
        }
        catch (error) {
            console.error('Error creating vault item:', error);
            throw error;
        }
    }
    async getVaultItems(userId) {
        try {
            return await this.prisma.vaultItem.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' }
            });
        }
        catch (error) {
            console.error('Error getting vault items:', error);
            return [];
        }
    }
    async getVaultItem(userId, itemId) {
        try {
            return await this.prisma.vaultItem.findFirst({
                where: {
                    id: itemId,
                    userId
                }
            });
        }
        catch (error) {
            console.error('Error getting vault item:', error);
            return null;
        }
    }
    // ========================================
    // SESSIONS
    // ========================================
    async createSession(data) {
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
        }
        catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }
    async getSession(token) {
        try {
            return await this.prisma.session.findUnique({
                where: { token }
            });
        }
        catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }
    async deleteSession(token) {
        try {
            return await this.prisma.session.delete({
                where: { token }
            });
        }
        catch (error) {
            console.error('Error deleting session:', error);
            return null;
        }
    }
    // ========================================
    // TEMPORARY REGISTRATION (Passkeys)
    // ========================================
    async storeTemporaryRegistration(data) {
        try {
            return await this.prisma.temporaryRegistration.create({
                data: {
                    userId: data.userId,
                    username: data.username,
                    challenge: data.challenge,
                    expiresAt: data.expiresAt
                }
            });
        }
        catch (error) {
            console.error('Error storing temporary registration:', error);
            throw error;
        }
    }
    async getTemporaryRegistration(userId) {
        try {
            return await this.prisma.temporaryRegistration.findUnique({
                where: { userId }
            });
        }
        catch (error) {
            console.error('Error getting temporary registration:', error);
            return null;
        }
    }
    async deleteTemporaryRegistration(userId) {
        try {
            return await this.prisma.temporaryRegistration.delete({
                where: { userId }
            });
        }
        catch (error) {
            console.error('Error deleting temporary registration:', error);
            return null;
        }
    }
    // ========================================
    // AUDIT LOGGING
    // ========================================
    async createAuditLog(data) {
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
        }
        catch (error) {
            console.error('Error creating audit log:', error);
            throw error;
        }
    }
    // ========================================
    // LEGACY COMPATIBILITY METHODS
    // ========================================
    async getUserByEmail(email) {
        // Email removed in passwordless system, use username instead
        console.warn('getUserByEmail called - email removed in passwordless system');
        return null;
    }
    async getUserById(id) {
        try {
            return await this.prisma.user.findUnique({
                where: { id }
            });
        }
        catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
    }
    async createQuantumIdentity(data) {
        console.warn('createQuantumIdentity deprecated - use storePasskeyCredential');
        return null;
    }
    async getQuantumIdentity(username) {
        console.warn('getQuantumIdentity deprecated - use getUserByUsername');
        return await this.getUserByUsername(username);
    }
    async getQuantumIdentityById(id) {
        console.warn('getQuantumIdentityById deprecated - use getUserById');
        return await this.getUserById(id);
    }
    async getUserCredentials(userId) {
        try {
            return await this.prisma.passkeyCredential.findMany({
                where: { userId }
            });
        }
        catch (error) {
            console.error('Error getting user credentials:', error);
            return [];
        }
    }
    async getCredentialById(credentialId) {
        return await this.getPasskeyCredential(credentialId);
    }
    async updateCredentialCounter(credentialId, counter) {
        return await this.updatePasskeySignCount(credentialId, counter);
    }
    async auditOperation(data) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('❌ Error during cleanup:', error);
            return false;
        }
    }
    async disconnect() {
        await this.prisma.$disconnect();
        console.log('👋 Database disconnected');
    }
}
exports.DatabaseService = DatabaseService;
exports.db = DatabaseService.getInstance();
exports.prisma = exports.db['prisma']; // For legacy compatibility
