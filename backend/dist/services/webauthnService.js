"use strict";
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
exports.WebAuthnService = void 0;
const databaseService_1 = require("./databaseService");
class WebAuthnService {
    // Generate registration options (completely simplified)
    static generateRegistrationOptions(username, displayName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`🔐 Generating registration options for: ${username}`);
                return {
                    success: true,
                    challenge: Date.now().toString(),
                    rp: { name: 'Quankey', id: 'localhost' },
                    user: {
                        id: username,
                        name: username,
                        displayName: displayName
                    },
                    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform',
                        userVerification: 'preferred'
                    },
                    timeout: 60000,
                    attestation: 'none'
                };
            }
            catch (error) {
                console.error('Error generating registration options:', error);
                throw error;
            }
        });
    }
    // Verify registration response (completely simplified)
    static verifyRegistration(username, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`🔐 Verifying registration for: ${username}`);
                // Create user in database
                const user = yield databaseService_1.DatabaseService.createUser(username, response.displayName || username);
                if (!user) {
                    throw new Error('Failed to create user');
                }
                // Enable biometric authentication
                yield databaseService_1.DatabaseService.enableBiometric(user.id);
                console.log(`✅ User ${username} registered successfully`);
                return {
                    verified: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName
                    }
                };
            }
            catch (error) {
                console.error('Error verifying registration:', error);
                throw error;
            }
        });
    }
    // Generate authentication options (completely simplified)
    static generateAuthenticationOptions(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`🔍 Generating authentication options for: ${username || 'any user'}`);
                return {
                    success: true,
                    challenge: Date.now().toString(),
                    timeout: 60000,
                    rpId: 'localhost',
                    allowCredentials: [],
                    userVerification: 'preferred'
                };
            }
            catch (error) {
                console.error('Error generating authentication options:', error);
                throw error;
            }
        });
    }
    // Verify authentication response (completely simplified)
    static verifyAuthentication(response, username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`🔍 Verifying authentication for: ${username || 'credential-based'}`);
                const users = yield databaseService_1.DatabaseService.getAllUsers();
                const user = username
                    ? users.find(u => u.username === username && u.biometricEnabled)
                    : users.find(u => u.biometricEnabled);
                if (!user) {
                    throw new Error('User not found or biometric not enabled');
                }
                console.log(`✅ User ${user.username} authenticated successfully`);
                return {
                    verified: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName
                    }
                };
            }
            catch (error) {
                console.error('Error verifying authentication:', error);
                throw error;
            }
        });
    }
    // Check if user exists in database
    static userExists(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield databaseService_1.DatabaseService.getUserByUsername(username);
                return !!user;
            }
            catch (error) {
                console.error('Error checking user existence:', error);
                return false;
            }
        });
    }
    // Get user info from database
    static getUser(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield databaseService_1.DatabaseService.getUserByUsername(username);
            }
            catch (error) {
                console.error('Error getting user:', error);
                return null;
            }
        });
    }
    // Get all users from database
    static getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield databaseService_1.DatabaseService.getAllUsers();
            }
            catch (error) {
                console.error('Error getting all users:', error);
                return [];
            }
        });
    }
    // Check if user has biometric enabled
    static hasBiometric(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield databaseService_1.DatabaseService.getUserByUsername(username);
                return user ? user.biometricEnabled : false;
            }
            catch (error) {
                console.error('Error checking biometric status:', error);
                return false;
            }
        });
    }
}
exports.WebAuthnService = WebAuthnService;
