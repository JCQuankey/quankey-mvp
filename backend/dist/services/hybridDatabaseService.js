"use strict";
/**
 * PATENT-CRITICAL: Hybrid Database Service - Development + Production
 *
 * Automatically switches between in-memory (development) and PostgreSQL (production)
 * based on environment variables. Maintains full compatibility with existing API.
 *
 * @patent-feature Seamless development-to-production database migration
 * @innovation Zero-downtime transition from in-memory to persistent storage
 * @advantage Enterprise-ready with development flexibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridDatabaseService = void 0;
const databaseService_1 = require("./databaseService");
const prismaService_1 = require("./prismaService");
// Configuration
const USE_POSTGRESQL = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';
class HybridDatabaseService {
    // Initialize the appropriate database service
    static async initialize() {
        try {
            if (this.usePostgreSQL) {
                console.log('🐘 Initializing PostgreSQL for production...');
                const success = await prismaService_1.PrismaService.initialize();
                if (success) {
                    console.log('✅ PostgreSQL initialized successfully');
                    this.initialized = true;
                    return true;
                }
                else {
                    console.log('⚠️ PostgreSQL failed, falling back to in-memory storage');
                    this.usePostgreSQL = false;
                }
            }
            console.log('💾 Using in-memory storage for development');
            const success = await databaseService_1.DatabaseService.initialize();
            this.initialized = success;
            return success;
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error);
            return false;
        }
    }
    // Health check
    static async healthCheck() {
        if (!this.initialized) {
            return false;
        }
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.healthCheck();
        }
        else {
            return await databaseService_1.DatabaseService.healthCheck();
        }
    }
    // Get current database type
    static getDatabaseType() {
        return this.usePostgreSQL ? 'postgresql' : 'in-memory';
    }
    // Cleanup on shutdown
    static async disconnect() {
        if (this.usePostgreSQL) {
            await prismaService_1.PrismaService.disconnect();
        }
        else {
            await databaseService_1.DatabaseService.disconnect();
        }
    }
    // Generate unique ID
    static generateId() {
        if (this.usePostgreSQL) {
            return prismaService_1.PrismaService.generateId();
        }
        else {
            return databaseService_1.DatabaseService.generateId();
        }
    }
    // USER MANAGEMENT
    // Create new user
    static async createUser(username, displayName, email) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.createUser(username, displayName, email);
        }
        else {
            return await databaseService_1.DatabaseService.createUser(username, displayName);
        }
    }
    // Get user by username
    static async getUserByUsername(username) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.getUserByUsername(username);
        }
        else {
            return await databaseService_1.DatabaseService.getUserByUsername(username);
        }
    }
    // Get user by ID
    static async getUserById(id) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.getUserById(id);
        }
        else {
            return await databaseService_1.DatabaseService.getUserById(id);
        }
    }
    // Update user with WebAuthn data (only for PostgreSQL)
    static async updateUserWebAuthn(userId, webauthnData) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.updateUserWebAuthn(userId, webauthnData);
        }
        else {
            // For in-memory, just enable biometric flag
            return await databaseService_1.DatabaseService.enableBiometric(userId);
        }
    }
    // Enable biometric for user
    static async enableBiometric(userId) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.enableBiometric(userId);
        }
        else {
            return await databaseService_1.DatabaseService.enableBiometric(userId);
        }
    }
    // Update last login (only for PostgreSQL)
    static async updateLastLogin(userId) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.updateLastLogin(userId);
        }
        else {
            // In-memory doesn't track last login
            return true;
        }
    }
    // Get all users
    static async getAllUsers() {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.getAllUsers();
        }
        else {
            return await databaseService_1.DatabaseService.getAllUsers();
        }
    }
    // PASSWORD MANAGEMENT
    // Save password - handles both simple and complex encryption metadata
    static async savePassword(userId, passwordData) {
        if (this.usePostgreSQL) {
            // PostgreSQL expects full encryption metadata
            if (!passwordData.encryptedData || !passwordData.iv || !passwordData.salt || !passwordData.authTag) {
                console.error('❌ PostgreSQL requires full encryption metadata');
                return null;
            }
            return await prismaService_1.PrismaService.savePassword(userId, passwordData);
        }
        else {
            // In-memory uses simplified format
            const simpleData = {
                title: passwordData.site || passwordData.title,
                website: passwordData.site || passwordData.website,
                username: passwordData.username,
                password: passwordData.encryptedPassword || passwordData.password,
                notes: passwordData.encryptedNotes || passwordData.notes,
                isQuantum: passwordData.isQuantum || false,
                entropy: passwordData.quantumEntropy || passwordData.entropy
            };
            return await databaseService_1.DatabaseService.savePassword(userId, simpleData);
        }
    }
    // Get passwords for user
    static async getPasswordsForUser(userId) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.getPasswordsForUser(userId);
        }
        else {
            return await databaseService_1.DatabaseService.getPasswordsForUser(userId);
        }
    }
    // Get password by ID
    static async getPasswordById(userId, passwordId) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.getPasswordById(userId, passwordId);
        }
        else {
            return await databaseService_1.DatabaseService.getPasswordById(userId, passwordId);
        }
    }
    // Update password
    static async updatePassword(userId, passwordId, updateData) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.updatePassword(userId, passwordId, updateData);
        }
        else {
            return await databaseService_1.DatabaseService.updatePassword(userId, passwordId, updateData);
        }
    }
    // Delete password
    static async deletePassword(userId, passwordId) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.deletePassword(userId, passwordId);
        }
        else {
            return await databaseService_1.DatabaseService.deletePassword(userId, passwordId);
        }
    }
    // Get user statistics
    static async getUserStats(userId) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.getUserStats(userId);
        }
        else {
            return await databaseService_1.DatabaseService.getUserStats(userId);
        }
    }
    // SESSION MANAGEMENT (PostgreSQL only)
    // Create session
    static async createSession(userId, token, expiresAt, metadata) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.createSession(userId, token, expiresAt, metadata);
        }
        else {
            // In-memory doesn't persist sessions
            console.log(`📝 Session would be created for user ${userId} (in-memory mode)`);
            return true;
        }
    }
    // Get session by token
    static async getSession(token) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.getSession(token);
        }
        else {
            // In-memory doesn't persist sessions
            return null;
        }
    }
    // Delete session
    static async deleteSession(token) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.deleteSession(token);
        }
        else {
            // In-memory doesn't persist sessions
            return true;
        }
    }
    // Clean expired sessions
    static async cleanExpiredSessions() {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.cleanExpiredSessions();
        }
        else {
            return 0;
        }
    }
    // AUDIT LOGGING (PostgreSQL only)
    // Create audit log entry
    static async createAuditLog(userId, action, details) {
        if (this.usePostgreSQL) {
            return await prismaService_1.PrismaService.createAuditLog(userId, action, details);
        }
        else {
            // In-memory mode: just log to console
            console.log(`📋 Audit Log [${action}] User: ${userId}`, details);
            return true;
        }
    }
    // MIGRATION UTILITIES
    // Export in-memory data for migration
    static async exportInMemoryData() {
        if (this.usePostgreSQL) {
            console.log('⚠️ Already using PostgreSQL, no in-memory data to export');
            return null;
        }
        try {
            const users = await databaseService_1.DatabaseService.getAllUsers();
            const passwords = [];
            for (const user of users) {
                const userPasswords = await databaseService_1.DatabaseService.getPasswordsForUser(user.id);
                passwords.push({ userId: user.id, passwords: userPasswords });
            }
            console.log(`📤 Exported ${users.length} users and ${passwords.reduce((total, p) => total + p.passwords.length, 0)} passwords`);
            return { users, passwords };
        }
        catch (error) {
            console.error('❌ Error exporting in-memory data:', error);
            return null;
        }
    }
    // Import data to PostgreSQL
    static async importToPostgreSQL(data) {
        if (!this.usePostgreSQL) {
            console.log('⚠️ PostgreSQL not active, cannot import');
            return false;
        }
        try {
            // Import users
            for (const user of data.users) {
                await prismaService_1.PrismaService.createUser(user.username, user.displayName);
            }
            // Import passwords (would need encryption metadata for production)
            console.log('⚠️ Password import requires proper encryption metadata for PostgreSQL');
            console.log(`📥 Imported ${data.users.length} users to PostgreSQL`);
            return true;
        }
        catch (error) {
            console.error('❌ Error importing to PostgreSQL:', error);
            return false;
        }
    }
    // Get database information
    static getDatabaseInfo() {
        if (this.usePostgreSQL) {
            return {
                type: 'postgresql',
                persistent: true,
                features: [
                    'Persistent storage',
                    'WebAuthn credentials',
                    'Session management',
                    'Audit logging',
                    'Full encryption metadata',
                    'Recovery systems',
                    'Team collaboration'
                ]
            };
        }
        else {
            return {
                type: 'in-memory',
                persistent: false,
                features: [
                    'Fast development',
                    'No setup required',
                    'Basic password storage',
                    'User management'
                ]
            };
        }
    }
}
exports.HybridDatabaseService = HybridDatabaseService;
HybridDatabaseService.initialized = false;
HybridDatabaseService.usePostgreSQL = USE_POSTGRESQL;
exports.default = HybridDatabaseService;
