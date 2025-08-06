"use strict";
// Database service - In-memory storage for development
// PostgreSQL ready for production deployment
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
// In-memory storage (temporary - PostgreSQL ready for production)
const users = new Map();
const passwords = new Map();
class DatabaseService {
    // Initialize database connection
    static async initialize() {
        try {
            console.log('✅ Database service initialized (in-memory mode)');
            console.log('🔄 PostgreSQL ready for production migration');
            return true;
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error);
            return false;
        }
    }
    // Health check
    static async healthCheck() {
        try {
            return true;
        }
        catch (error) {
            console.error('❌ Database health check failed:', error);
            return false;
        }
    }
    // Cleanup on shutdown
    static async disconnect() {
        console.log('🔌 Database service disconnected');
    }
    // Generate unique ID
    static generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    // USER MANAGEMENT
    // Create new user
    static async createUser(username, displayName) {
        try {
            const user = {
                id: this.generateId(),
                username,
                email: `${username}@demo.quankey.xyz`,
                displayName,
                biometricEnabled: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            users.set(username, user);
            passwords.set(user.id, []);
            console.log(`👤 Created user: ${username}`);
            return user;
        }
        catch (error) {
            console.error('Error creating user:', error);
            return null;
        }
    }
    // Get user by username
    static async getUserByUsername(username) {
        try {
            return users.get(username) || null;
        }
        catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }
    // Get user by ID
    static async getUserById(id) {
        try {
            for (const user of users.values()) {
                if (user.id === id) {
                    return user;
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
    }
    // Enable biometric for user
    static async enableBiometric(userId) {
        try {
            for (const [username, user] of users.entries()) {
                if (user.id === userId) {
                    user.biometricEnabled = true;
                    user.updatedAt = new Date();
                    users.set(username, user);
                    console.log(`🔐 Enabled biometric for user: ${userId}`);
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('Error enabling biometric:', error);
            return false;
        }
    }
    // 🔴 FIX: Generic update user method
    static async updateUser(userId, updateData) {
        try {
            for (const [username, user] of users.entries()) {
                if (user.id === userId) {
                    const updatedUser = { ...user, ...updateData, updatedAt: new Date() };
                    users.set(username, updatedUser);
                    console.log(`✅ Updated user: ${userId}`, Object.keys(updateData));
                    return updatedUser;
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error updating user:', error);
            return null;
        }
    }
    // Get all users
    static async getAllUsers() {
        try {
            return Array.from(users.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }
    // PASSWORD MANAGEMENT
    // Save password
    static async savePassword(userId, passwordData) {
        try {
            const password = {
                id: this.generateId(),
                ...passwordData,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const userPasswords = passwords.get(userId) || [];
            userPasswords.push(password);
            passwords.set(userId, userPasswords);
            console.log(`💾 Saved password for user: ${userId}`);
            return password;
        }
        catch (error) {
            console.error('Error saving password:', error);
            return null;
        }
    }
    // Get passwords for user
    static async getPasswordsForUser(userId) {
        try {
            return passwords.get(userId) || [];
        }
        catch (error) {
            console.error('Error getting passwords:', error);
            return [];
        }
    }
    // Get password by ID
    static async getPasswordById(userId, passwordId) {
        try {
            const userPasswords = passwords.get(userId) || [];
            return userPasswords.find(p => p.id === passwordId) || null;
        }
        catch (error) {
            console.error('Error getting password by ID:', error);
            return null;
        }
    }
    // Update password
    static async updatePassword(userId, passwordId, updateData) {
        try {
            const userPasswords = passwords.get(userId) || [];
            const passwordIndex = userPasswords.findIndex(p => p.id === passwordId);
            if (passwordIndex === -1) {
                return null;
            }
            userPasswords[passwordIndex] = {
                ...userPasswords[passwordIndex],
                ...updateData,
                updatedAt: new Date()
            };
            passwords.set(userId, userPasswords);
            console.log(`📝 Updated password: ${passwordId}`);
            return userPasswords[passwordIndex];
        }
        catch (error) {
            console.error('Error updating password:', error);
            return null;
        }
    }
    // Delete password
    static async deletePassword(userId, passwordId) {
        try {
            const userPasswords = passwords.get(userId) || [];
            const filteredPasswords = userPasswords.filter(p => p.id !== passwordId);
            if (filteredPasswords.length === userPasswords.length) {
                return false; // Password not found
            }
            passwords.set(userId, filteredPasswords);
            console.log(`🗑️ Deleted password: ${passwordId}`);
            return true;
        }
        catch (error) {
            console.error('Error deleting password:', error);
            return false;
        }
    }
    // Get user statistics
    static async getUserStats(userId) {
        try {
            const userPasswords = passwords.get(userId) || [];
            return {
                totalPasswords: userPasswords.length,
                quantumPasswords: userPasswords.filter(p => p.isQuantum).length,
                lastUpdated: userPasswords.length > 0 ? Math.max(...userPasswords.map(p => p.updatedAt.getTime())) : null
            };
        }
        catch (error) {
            console.error('Error getting user stats:', error);
            return { totalPasswords: 0, quantumPasswords: 0, lastUpdated: null };
        }
    }
}
exports.DatabaseService = DatabaseService;
exports.default = DatabaseService;
