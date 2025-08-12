"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.DatabaseService = void 0;
const client_1 = require("@prisma/client");
// Initialize Prisma client singleton
let prisma;
if (process.env.NODE_ENV === 'production') {
    exports.prisma = prisma = new client_1.PrismaClient();
}
else {
    if (!global.__prisma) {
        global.__prisma = new client_1.PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });
    }
    exports.prisma = prisma = global.__prisma;
}
class DatabaseService {
    constructor() {
        this.client = prisma;
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    // ========================================
    // USER MANAGEMENT (Passwordless)
    // ========================================
    async createUser(userData) {
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
        }
        catch (error) {
            console.error('❌ Error creating passwordless user:', error);
            return null;
        }
    }
    async findUserByUsername(username) {
        try {
            const user = await this.client.user.findUnique({
                where: { username }
            });
            if (!user)
                return null;
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
        }
        catch (error) {
            console.error('❌ Error finding user:', error);
            return null;
        }
    }
    async updateLastLogin(userId) {
        try {
            await this.client.user.update({
                where: { id: userId },
                data: {
                    lastLogin: new Date(),
                    updatedAt: new Date()
                }
            });
            return true;
        }
        catch (error) {
            console.error('❌ Error updating last login:', error);
            return false;
        }
    }
    // ========================================
    // VAULT ITEM MANAGEMENT (Quantum-Biometric)
    // ========================================
    async createVaultItem(userId, vaultData) {
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
                itemType: vaultItem.itemType,
                title: vaultItem.title,
                encryptedData: new Uint8Array(vaultItem.encryptedData),
                wrappedDEK: new Uint8Array(vaultItem.wrappedDEK),
                createdAt: vaultItem.createdAt,
                updatedAt: vaultItem.updatedAt
            };
        }
        catch (error) {
            console.error('❌ Error creating vault item:', error);
            return null;
        }
    }
    async getVaultItems(userId) {
        try {
            const vaultItems = await this.client.vaultItem.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' }
            });
            console.log(`📋 Retrieved ${vaultItems.length} vault items for user: ${userId}`);
            return vaultItems.map(item => ({
                id: item.id,
                userId: item.userId,
                itemType: item.itemType,
                title: item.title,
                encryptedData: item.encryptedData,
                wrappedDEK: item.wrappedDEK,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));
        }
        catch (error) {
            console.error('❌ Error getting vault items:', error);
            return [];
        }
    }
    async getVaultItem(userId, itemId) {
        try {
            const vaultItem = await this.client.vaultItem.findFirst({
                where: {
                    id: itemId,
                    userId
                }
            });
            if (!vaultItem)
                return null;
            return {
                id: vaultItem.id,
                userId: vaultItem.userId,
                itemType: vaultItem.itemType,
                title: vaultItem.title,
                encryptedData: new Uint8Array(vaultItem.encryptedData),
                wrappedDEK: new Uint8Array(vaultItem.wrappedDEK),
                createdAt: vaultItem.createdAt,
                updatedAt: vaultItem.updatedAt
            };
        }
        catch (error) {
            console.error('❌ Error getting vault item:', error);
            return null;
        }
    }
    async updateVaultItem(userId, itemId, updateData) {
        try {
            await this.client.vaultItem.update({
                where: { id: itemId },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });
            return true;
        }
        catch (error) {
            console.error('❌ Error updating vault item:', error);
            return false;
        }
    }
    async deleteVaultItem(userId, itemId) {
        try {
            await this.client.vaultItem.deleteMany({
                where: {
                    id: itemId,
                    userId
                }
            });
            console.log(`🗑️ Deleted vault item: ${itemId}`);
            return true;
        }
        catch (error) {
            console.error('❌ Error deleting vault item:', error);
            return false;
        }
    }
    // ========================================
    // SESSION MANAGEMENT
    // ========================================
    async createSession(sessionData) {
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
        }
        catch (error) {
            console.error('❌ Error creating session:', error);
            return null;
        }
    }
    async findSession(token) {
        try {
            const session = await this.client.session.findUnique({
                where: { token }
            });
            if (!session)
                return null;
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
        }
        catch (error) {
            console.error('❌ Error finding session:', error);
            return null;
        }
    }
    async deleteSession(token) {
        try {
            await this.client.session.delete({
                where: { token }
            });
            return true;
        }
        catch (error) {
            console.error('❌ Error deleting session:', error);
            return false;
        }
    }
    // ========================================
    // AUDIT OPERATIONS
    // ========================================
    async auditOperation(data) {
        try {
            // In this passwordless system, we could add audit logging
            // For now, just console log
            console.log(`📊 AUDIT: User ${data.userId} performed ${data.action} on ${data.resource}: ${data.result}`);
        }
        catch (error) {
            console.error('❌ Audit operation failed:', error);
        }
    }
    // ========================================
    // SYSTEM OPERATIONS
    // ========================================
    async getStats() {
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
        }
        catch (error) {
            console.error('❌ Error getting stats:', error);
            return { users: 0, vaultItems: 0, sessions: 0 };
        }
    }
    async cleanup() {
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
        }
        catch (error) {
            console.error('❌ Error during cleanup:', error);
            return { deletedUsers: 0, deletedVaultItems: 0, deletedSessions: 0 };
        }
    }
    async disconnect() {
        await this.client.$disconnect();
    }
}
exports.DatabaseService = DatabaseService;
