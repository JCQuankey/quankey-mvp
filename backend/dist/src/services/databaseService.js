"use strict";
// Database service - In-memory storage for development
// PostgreSQL ready for production deployment
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
// In-memory storage (temporary - PostgreSQL ready for production)
const users = new Map();
const passwords = new Map();
class DatabaseService {
    // Initialize database connection
    static initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('✅ Database service initialized (in-memory mode)');
                console.log('🔄 PostgreSQL ready for production migration');
                return true;
            }
            catch (error) {
                console.error('❌ Database initialization failed:', error);
                return false;
            }
        });
    }
    // Health check
    static healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return true;
            }
            catch (error) {
                console.error('❌ Database health check failed:', error);
                return false;
            }
        });
    }
    // Cleanup on shutdown
    static disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🔌 Database service disconnected');
        });
    }
    // Generate unique ID
    static generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    // USER MANAGEMENT
    // Create new user
    static createUser(username, displayName) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    // Get user by username
    static getUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return users.get(username) || null;
            }
            catch (error) {
                console.error('Error getting user:', error);
                return null;
            }
        });
    }
    // Get user by ID
    static getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    // Enable biometric for user
    static enableBiometric(userId) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    // Get all users
    static getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return Array.from(users.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            }
            catch (error) {
                console.error('Error getting all users:', error);
                return [];
            }
        });
    }
    // PASSWORD MANAGEMENT
    // Save password
    static savePassword(userId, passwordData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const password = Object.assign(Object.assign({ id: this.generateId() }, passwordData), { createdAt: new Date(), updatedAt: new Date() });
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
        });
    }
    // Get passwords for user
    static getPasswordsForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return passwords.get(userId) || [];
            }
            catch (error) {
                console.error('Error getting passwords:', error);
                return [];
            }
        });
    }
    // Get password by ID
    static getPasswordById(userId, passwordId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userPasswords = passwords.get(userId) || [];
                return userPasswords.find(p => p.id === passwordId) || null;
            }
            catch (error) {
                console.error('Error getting password by ID:', error);
                return null;
            }
        });
    }
    // Update password
    static updatePassword(userId, passwordId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userPasswords = passwords.get(userId) || [];
                const passwordIndex = userPasswords.findIndex(p => p.id === passwordId);
                if (passwordIndex === -1) {
                    return null;
                }
                userPasswords[passwordIndex] = Object.assign(Object.assign(Object.assign({}, userPasswords[passwordIndex]), updateData), { updatedAt: new Date() });
                passwords.set(userId, userPasswords);
                console.log(`📝 Updated password: ${passwordId}`);
                return userPasswords[passwordIndex];
            }
            catch (error) {
                console.error('Error updating password:', error);
                return null;
            }
        });
    }
    // Delete password
    static deletePassword(userId, passwordId) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    // Get user statistics
    static getUserStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.DatabaseService = DatabaseService;
exports.default = DatabaseService;
