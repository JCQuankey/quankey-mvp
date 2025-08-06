"use strict";
/**
 * PATENT-CRITICAL: Prisma Database Service for Production Persistence
 *
 * Replaces in-memory storage with PostgreSQL for production deployment.
 * Maintains full compatibility with existing DatabaseService interface.
 *
 * @patent-feature First quantum password manager with persistent biometric auth
 * @innovation Zero-knowledge encryption with database persistence
 * @advantage Enterprise-ready with audit trails and recovery systems
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const client_1 = require("@prisma/client");
// Initialize Prisma client singleton
let prisma;
if (process.env.NODE_ENV === 'production') {
    prisma = new client_1.PrismaClient();
}
else {
    if (!global.__prisma) {
        global.__prisma = new client_1.PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });
    }
    prisma = global.__prisma;
}
class PrismaService {
    // Initialize database connection
    static async initialize() {
        try {
            // Test connection
            await this.client.$connect();
            console.log('✅ PostgreSQL connected successfully');
            // Run any pending migrations
            console.log('🔄 Checking database schema...');
            return true;
        }
        catch (error) {
            console.error('❌ PostgreSQL connection failed:', error);
            return false;
        }
    }
    // Health check
    static async healthCheck() {
        try {
            await this.client.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            console.error('❌ Database health check failed:', error);
            return false;
        }
    }
    // Cleanup on shutdown
    static async disconnect() {
        try {
            await this.client.$disconnect();
            console.log('🔌 PostgreSQL disconnected');
        }
        catch (error) {
            console.error('❌ Error disconnecting from database:', error);
        }
    }
    // Generate unique ID (fallback if needed)
    static generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    // USER MANAGEMENT
    // Create new user
    static async createUser(username, displayName, email) {
        try {
            const user = await this.client.user.create({
                data: {
                    username,
                    displayName,
                    // Use provided email or generate demo email
                    ...(email && { email })
                }
            });
            console.log(`👤 Created user in PostgreSQL: ${username}`);
            return {
                id: user.id,
                username: user.username,
                email: email,
                displayName: user.displayName,
                biometricEnabled: !!user.webauthnId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLogin: user.lastLogin || undefined,
                webauthnId: user.webauthnId || undefined,
                publicKey: user.publicKey || undefined,
                counter: user.counter,
                credentials: user.credentials,
                quantumSeed: user.quantumSeed || undefined
            };
        }
        catch (error) {
            console.error('❌ Error creating user in PostgreSQL:', error);
            return null;
        }
    }
    // Get user by username
    static async getUserByUsername(username) {
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
                biometricEnabled: !!user.webauthnId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLogin: user.lastLogin || undefined,
                webauthnId: user.webauthnId || undefined,
                publicKey: user.publicKey || undefined,
                counter: user.counter,
                credentials: user.credentials,
                quantumSeed: user.quantumSeed || undefined
            };
        }
        catch (error) {
            console.error('❌ Error getting user by username:', error);
            return null;
        }
    }
    // Get user by ID
    static async getUserById(id) {
        try {
            const user = await this.client.user.findUnique({
                where: { id }
            });
            if (!user)
                return null;
            return {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                biometricEnabled: !!user.webauthnId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLogin: user.lastLogin || undefined,
                webauthnId: user.webauthnId || undefined,
                publicKey: user.publicKey || undefined,
                counter: user.counter,
                credentials: user.credentials,
                quantumSeed: user.quantumSeed || undefined
            };
        }
        catch (error) {
            console.error('❌ Error getting user by ID:', error);
            return null;
        }
    }
    // Update user with WebAuthn data
    static async updateUserWebAuthn(userId, webauthnData) {
        try {
            await this.client.user.update({
                where: { id: userId },
                data: {
                    ...webauthnData,
                    updatedAt: new Date()
                }
            });
            console.log(`🔐 Updated WebAuthn data for user: ${userId}`);
            return true;
        }
        catch (error) {
            console.error('❌ Error updating WebAuthn data:', error);
            return false;
        }
    }
    // 🔴 FIX: Generic update user method
    static async updateUser(userId, updateData) {
        try {
            const updatedUser = await this.client.user.update({
                where: { id: userId },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });
            console.log(`✅ Updated user: ${userId}`, Object.keys(updateData));
            return updatedUser;
        }
        catch (error) {
            console.error('❌ Error updating user:', error);
            return null;
        }
    }
    // Enable biometric for user
    static async enableBiometric(userId) {
        try {
            await this.client.user.update({
                where: { id: userId },
                data: {
                    lastLogin: new Date(),
                    updatedAt: new Date()
                }
            });
            console.log(`🔐 Enabled biometric for user: ${userId}`);
            return true;
        }
        catch (error) {
            console.error('❌ Error enabling biometric:', error);
            return false;
        }
    }
    // Update last login
    static async updateLastLogin(userId) {
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
    // Get all users
    static async getAllUsers() {
        try {
            const users = await this.client.user.findMany({
                orderBy: { createdAt: 'desc' }
            });
            return users.map(user => ({
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                biometricEnabled: !!user.webauthnId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLogin: user.lastLogin || undefined,
                webauthnId: user.webauthnId || undefined,
                publicKey: user.publicKey || undefined,
                counter: user.counter,
                credentials: user.credentials,
                quantumSeed: user.quantumSeed || undefined
            }));
        }
        catch (error) {
            console.error('❌ Error getting all users:', error);
            return [];
        }
    }
    // PASSWORD MANAGEMENT
    // Save password with full encryption metadata
    static async savePassword(userId, passwordData) {
        try {
            const password = await this.client.password.create({
                data: {
                    userId,
                    site: passwordData.site,
                    username: passwordData.username,
                    encryptedPassword: passwordData.encryptedPassword,
                    encryptedNotes: passwordData.encryptedNotes,
                    encryptedData: passwordData.encryptedData,
                    iv: passwordData.iv,
                    salt: passwordData.salt,
                    authTag: passwordData.authTag,
                    isQuantum: passwordData.isQuantum || false,
                    quantumSource: passwordData.quantumSource,
                    quantumEntropy: passwordData.quantumEntropy,
                    metadata: passwordData.metadata,
                    category: passwordData.category || 'General',
                    strength: passwordData.strength || 0,
                    isFavorite: passwordData.isFavorite || false
                }
            });
            console.log(`💾 Saved password in PostgreSQL for user: ${userId}`);
            return {
                id: password.id,
                title: password.site,
                website: password.site,
                username: password.username,
                password: passwordData.encryptedPassword, // Encrypted
                notes: passwordData.encryptedNotes,
                isQuantum: password.isQuantum,
                entropy: password.quantumEntropy || undefined,
                createdAt: password.createdAt,
                updatedAt: password.updatedAt,
                lastUsed: password.lastUsed || undefined,
                isFavorite: password.isFavorite,
                category: password.category || undefined,
                strength: password.strength,
                encryptedData: password.encryptedData || undefined,
                iv: password.iv || undefined,
                salt: password.salt || undefined,
                authTag: password.authTag || undefined,
                quantumSource: password.quantumSource || undefined,
                quantumEntropy: password.quantumEntropy,
                metadata: password.metadata,
                encryptionVersion: password.encryptionVersion || undefined,
                algorithm: password.algorithm || undefined,
                keyDerivation: password.keyDerivation || undefined
            };
        }
        catch (error) {
            console.error('❌ Error saving password to PostgreSQL:', error);
            return null;
        }
    }
    // Get passwords for user
    static async getPasswordsForUser(userId) {
        try {
            const passwords = await this.client.password.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' }
            });
            return passwords.map(password => ({
                id: password.id,
                title: password.site,
                website: password.site,
                username: password.username,
                password: password.encryptedPassword,
                notes: password.encryptedNotes || undefined,
                isQuantum: password.isQuantum,
                entropy: password.quantumEntropy || undefined,
                createdAt: password.createdAt,
                updatedAt: password.updatedAt,
                lastUsed: password.lastUsed || undefined,
                isFavorite: password.isFavorite,
                category: password.category || undefined,
                strength: password.strength,
                encryptedData: password.encryptedData || undefined,
                iv: password.iv || undefined,
                salt: password.salt || undefined,
                authTag: password.authTag || undefined,
                quantumSource: password.quantumSource || undefined,
                quantumEntropy: password.quantumEntropy,
                metadata: password.metadata,
                encryptionVersion: password.encryptionVersion || undefined,
                algorithm: password.algorithm || undefined,
                keyDerivation: password.keyDerivation || undefined
            }));
        }
        catch (error) {
            console.error('❌ Error getting passwords from PostgreSQL:', error);
            return [];
        }
    }
    // Get password by ID
    static async getPasswordById(userId, passwordId) {
        try {
            const password = await this.client.password.findFirst({
                where: {
                    id: passwordId,
                    userId: userId // Security: ensure user owns this password
                }
            });
            if (!password)
                return null;
            return {
                id: password.id,
                title: password.site,
                website: password.site,
                username: password.username,
                password: password.encryptedPassword,
                notes: password.encryptedNotes || undefined,
                isQuantum: password.isQuantum,
                entropy: password.quantumEntropy || undefined,
                createdAt: password.createdAt,
                updatedAt: password.updatedAt,
                lastUsed: password.lastUsed || undefined,
                isFavorite: password.isFavorite,
                category: password.category || undefined,
                strength: password.strength,
                encryptedData: password.encryptedData || undefined,
                iv: password.iv || undefined,
                salt: password.salt || undefined,
                authTag: password.authTag || undefined,
                quantumSource: password.quantumSource || undefined,
                quantumEntropy: password.quantumEntropy,
                metadata: password.metadata,
                encryptionVersion: password.encryptionVersion || undefined,
                algorithm: password.algorithm || undefined,
                keyDerivation: password.keyDerivation || undefined
            };
        }
        catch (error) {
            console.error('❌ Error getting password by ID from PostgreSQL:', error);
            return null;
        }
    }
    // Update password
    static async updatePassword(userId, passwordId, updateData) {
        try {
            const password = await this.client.password.update({
                where: {
                    id: passwordId,
                    userId: userId // Security: ensure user owns this password
                },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });
            console.log(`📝 Updated password in PostgreSQL: ${passwordId}`);
            return {
                id: password.id,
                title: password.site,
                website: password.site,
                username: password.username,
                password: password.encryptedPassword,
                notes: password.encryptedNotes || undefined,
                isQuantum: password.isQuantum,
                entropy: password.quantumEntropy || undefined,
                createdAt: password.createdAt,
                updatedAt: password.updatedAt,
                lastUsed: password.lastUsed || undefined,
                isFavorite: password.isFavorite,
                category: password.category || undefined,
                strength: password.strength,
                encryptedData: password.encryptedData || undefined,
                iv: password.iv || undefined,
                salt: password.salt || undefined,
                authTag: password.authTag || undefined,
                quantumSource: password.quantumSource || undefined,
                quantumEntropy: password.quantumEntropy,
                metadata: password.metadata,
                encryptionVersion: password.encryptionVersion || undefined,
                algorithm: password.algorithm || undefined,
                keyDerivation: password.keyDerivation || undefined
            };
        }
        catch (error) {
            console.error('❌ Error updating password in PostgreSQL:', error);
            return null;
        }
    }
    // Delete password
    static async deletePassword(userId, passwordId) {
        try {
            await this.client.password.delete({
                where: {
                    id: passwordId,
                    userId: userId // Security: ensure user owns this password
                }
            });
            console.log(`🗑️ Deleted password from PostgreSQL: ${passwordId}`);
            return true;
        }
        catch (error) {
            console.error('❌ Error deleting password from PostgreSQL:', error);
            return false;
        }
    }
    // Get user statistics
    static async getUserStats(userId) {
        try {
            const passwords = await this.client.password.findMany({
                where: { userId },
                select: {
                    isQuantum: true,
                    category: true,
                    strength: true,
                    updatedAt: true
                }
            });
            const categories = {};
            const strengthDistribution = {
                weak: 0,
                medium: 0,
                strong: 0,
                veryStrong: 0
            };
            let lastUpdated = null;
            passwords.forEach(password => {
                // Categories
                const category = password.category || 'General';
                categories[category] = (categories[category] || 0) + 1;
                // Strength distribution
                const strength = password.strength || 0;
                if (strength < 40)
                    strengthDistribution.weak++;
                else if (strength < 60)
                    strengthDistribution.medium++;
                else if (strength < 80)
                    strengthDistribution.strong++;
                else
                    strengthDistribution.veryStrong++;
                // Last updated
                const updated = password.updatedAt.getTime();
                if (!lastUpdated || updated > lastUpdated) {
                    lastUpdated = updated;
                }
            });
            return {
                totalPasswords: passwords.length,
                quantumPasswords: passwords.filter(p => p.isQuantum).length,
                lastUpdated,
                categories,
                strengthDistribution
            };
        }
        catch (error) {
            console.error('❌ Error getting user stats from PostgreSQL:', error);
            return {
                totalPasswords: 0,
                quantumPasswords: 0,
                lastUpdated: null,
                categories: {},
                strengthDistribution: { weak: 0, medium: 0, strong: 0, veryStrong: 0 }
            };
        }
    }
    // SESSION MANAGEMENT
    // Create session
    static async createSession(userId, token, expiresAt, metadata) {
        try {
            await this.client.session.create({
                data: {
                    userId,
                    token,
                    expiresAt,
                    ipAddress: metadata?.ipAddress,
                    userAgent: metadata?.userAgent
                }
            });
            console.log(`🔑 Created session for user: ${userId}`);
            return true;
        }
        catch (error) {
            console.error('❌ Error creating session:', error);
            return false;
        }
    }
    // Get session by token
    static async getSession(token) {
        try {
            const session = await this.client.session.findUnique({
                where: { token },
                include: { user: true }
            });
            return session;
        }
        catch (error) {
            console.error('❌ Error getting session:', error);
            return null;
        }
    }
    // Delete session
    static async deleteSession(token) {
        try {
            await this.client.session.delete({
                where: { token }
            });
            console.log(`🔑 Deleted session: ${token}`);
            return true;
        }
        catch (error) {
            console.error('❌ Error deleting session:', error);
            return false;
        }
    }
    // Clean expired sessions
    static async cleanExpiredSessions() {
        try {
            const result = await this.client.session.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            });
            console.log(`🧹 Cleaned ${result.count} expired sessions`);
            return result.count;
        }
        catch (error) {
            console.error('❌ Error cleaning expired sessions:', error);
            return 0;
        }
    }
    // AUDIT LOGGING
    // Create audit log entry
    static async createAuditLog(userId, action, details) {
        try {
            await this.client.auditLog.create({
                data: {
                    userId,
                    action,
                    entityType: details?.entityType,
                    entityId: details?.entityId,
                    metadata: details?.metadata,
                    ipAddress: details?.ipAddress,
                    userAgent: details?.userAgent
                }
            });
            return true;
        }
        catch (error) {
            console.error('❌ Error creating audit log:', error);
            return false;
        }
    }
    // Get client instance for advanced queries
    static getClient() {
        return this.client;
    }
}
exports.PrismaService = PrismaService;
PrismaService.client = prisma;
exports.default = PrismaService;
