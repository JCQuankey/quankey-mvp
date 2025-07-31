"use strict";
// Simplified database service to avoid TypeScript issues
// This uses in-memory storage for now, will be upgraded to real DB later
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
// In-memory storage (temporary)
const users = new Map();
const passwords = new Map();
class DatabaseService {
    // Initialize database connection
    static initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('✅ Database service initialized (in-memory mode)');
                return true;
            }
            catch (error) {
                console.error('❌ Database initialization failed:', error);
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
    // USER MANAGEMENT
    // Create new user
    static createUser(username, displayName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = {
                    id: this.generateId(),
                    username,
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
    // PASSWORD VAULT MANAGEMENT
    // Add password to vault
    static addPassword(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const passwordEntry = {
                    id: this.generateId(),
                    title: data.title,
                    website: data.website,
                    username: data.username,
                    password: data.password,
                    notes: data.notes,
                    isQuantum: data.isQuantum,
                    entropy: data.entropy,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const userPasswords = passwords.get(userId) || [];
                userPasswords.push(passwordEntry);
                passwords.set(userId, userPasswords);
                console.log(`🔑 Added password: ${data.title} for user: ${userId}`);
                return passwordEntry;
            }
            catch (error) {
                console.error('Error adding password:', error);
                return null;
            }
        });
    }
    // Get all passwords for user
    static getUserPasswords(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userPasswords = passwords.get(userId) || [];
                return userPasswords.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            }
            catch (error) {
                console.error('Error getting user passwords:', error);
                return [];
            }
        });
    }
    // Update password
    static updatePassword(passwordId, userId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userPasswords = passwords.get(userId) || [];
                const passwordIndex = userPasswords.findIndex(p => p.id === passwordId);
                if (passwordIndex === -1) {
                    return false;
                }
                userPasswords[passwordIndex] = Object.assign(Object.assign(Object.assign({}, userPasswords[passwordIndex]), updates), { updatedAt: new Date() });
                passwords.set(userId, userPasswords);
                console.log(`📝 Updated password: ${passwordId}`);
                return true;
            }
            catch (error) {
                console.error('Error updating password:', error);
                return false;
            }
        });
    }
    // Delete password
    static deletePassword(passwordId, userId) {
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
    // Search passwords
    static searchPasswords(userId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userPasswords = passwords.get(userId) || [];
                const lowercaseQuery = query.toLowerCase();
                return userPasswords.filter(password => password.title.toLowerCase().includes(lowercaseQuery) ||
                    password.website.toLowerCase().includes(lowercaseQuery) ||
                    password.username.toLowerCase().includes(lowercaseQuery) ||
                    (password.notes && password.notes.toLowerCase().includes(lowercaseQuery)));
            }
            catch (error) {
                console.error('Error searching passwords:', error);
                return [];
            }
        });
    }
    // Get vault statistics
    static getVaultStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userPasswords = passwords.get(userId) || [];
                const quantumPasswords = userPasswords.filter(p => p.isQuantum).length;
                return {
                    totalEntries: userPasswords.length,
                    quantumPasswords,
                    classicPasswords: userPasswords.length - quantumPasswords,
                    lastSync: new Date(),
                    encryptionVersion: '1.0'
                };
            }
            catch (error) {
                console.error('Error getting vault stats:', error);
                return {
                    totalEntries: 0,
                    quantumPasswords: 0,
                    classicPasswords: 0,
                    lastSync: new Date(),
                    encryptionVersion: '1.0'
                };
            }
        });
    }
    // UTILITY METHODS
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    // Database health check
    static healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return true;
            }
            catch (error) {
                console.error('Database health check failed:', error);
                return false;
            }
        });
    }
}
exports.DatabaseService = DatabaseService;
