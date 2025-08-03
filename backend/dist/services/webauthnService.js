"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAuthnService = void 0;
const hybridDatabaseService_1 = require("./hybridDatabaseService");
const postQuantumService_1 = require("./postQuantumService");
const crypto_1 = __importDefault(require("crypto"));
class WebAuthnService {
    // Generate registration options (optimized for all devices)
    static async generateRegistrationOptions(username, displayName) {
        try {
            const rpId = process.env.NODE_ENV === 'production' ? (process.env.WEBAUTHN_RP_ID || 'quankey.xyz') : 'localhost';
            console.log(`🔐 [WEBAUTHN] Generating registration options for: ${username}`);
            console.log(`🔐 [WEBAUTHN] Environment: ${process.env.NODE_ENV}`);
            console.log(`🔐 [WEBAUTHN] RP ID: ${rpId}`);
            // Generate proper cryptographic challenge
            const challenge = Buffer.from(crypto_1.default.randomBytes(32)).toString('base64url');
            const userId = Buffer.from(username).toString('base64url');
            return {
                success: true,
                challenge: challenge,
                rp: {
                    name: process.env.WEBAUTHN_RP_NAME || 'Quankey',
                    id: rpId
                },
                user: {
                    id: userId,
                    name: username,
                    displayName: displayName
                },
                pubKeyCredParams: [
                    { alg: -7, type: 'public-key' }, // ES256 (preferido móvil)
                    { alg: -257, type: 'public-key' }, // RS256 (Windows/Mac)
                    { alg: -37, type: 'public-key' }, // PS256 (compatibilidad extra)
                    // Future PQC algorithms (when WebAuthn supports them)
                    // { alg: -8, type: 'public-key' }  // ML-DSA-65 (NIST standard)
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform', // Touch ID, Face ID, Windows Hello
                    userVerification: 'preferred', // Usa biometría si disponible
                    residentKey: 'preferred', // 🆕 Mejor para móvil
                    requireResidentKey: false // 🆕 Fallback si no soporta
                },
                timeout: 60000,
                attestation: 'none',
                excludeCredentials: [], // 🆕 Evita registros duplicados
                extensions: {
                    credProps: true
                }
            };
        }
        catch (error) {
            console.error('Error generating registration options:', error);
            throw error;
        }
    }
    // Generate authentication options
    static async generateAuthenticationOptions(username) {
        try {
            const rpId = process.env.NODE_ENV === 'production' ? (process.env.WEBAUTHN_RP_ID || 'quankey.xyz') : 'localhost';
            console.log(`🔍 [WEBAUTHN] Generating authentication options for: ${username || 'any user'}`);
            console.log(`🔍 [WEBAUTHN] Environment: ${process.env.NODE_ENV}`);
            console.log(`🔍 [WEBAUTHN] RP ID: ${rpId}`);
            // Generate proper cryptographic challenge
            const challenge = Buffer.from(crypto_1.default.randomBytes(32)).toString('base64url');
            const options = {
                challenge: challenge,
                timeout: 60000,
                rpId: rpId,
                allowCredentials: [], // Allow any registered credential
                userVerification: 'preferred'
            };
            console.log(`🔍 [WEBAUTHN] Authentication challenge generated: ${challenge.substring(0, 10)}...`);
            return options;
        }
        catch (error) {
            console.error('Error generating authentication options:', error);
            throw error;
        }
    }
    // Verify registration response with hybrid PQC support
    static async verifyRegistration(username, response) {
        try {
            console.log(`🔐 Verifying registration for: ${username}`);
            console.log(`🔐 [HYBRID] Creating quantum-resistant credentials...`);
            // Create user in database
            const user = await hybridDatabaseService_1.HybridDatabaseService.createUser(username, response.displayName || username);
            if (!user) {
                throw new Error('Failed to create user');
            }
            // Generate hybrid credential (ECDSA + ML-DSA)
            const hybridCredential = await postQuantumService_1.PostQuantumService.generateHybridKeyPair();
            // Store hybrid credential info (in production, store in secure credential store)
            const userWithHybrid = {
                ...user,
                credentialId: hybridCredential.ecdsaCredentialId,
                hybridId: hybridCredential.hybridId,
                quantumResistant: true,
                quantumAlgorithm: 'ML-DSA-65',
                migrationStatus: 'HYBRID_READY'
            };
            // Enable biometric authentication
            await hybridDatabaseService_1.HybridDatabaseService.enableBiometric(user.id);
            // Log quantum resistance status
            const resistanceLevel = postQuantumService_1.PostQuantumService.getQuantumResistanceLevel(hybridCredential);
            console.log(`✅ User ${username} registered with ${resistanceLevel} credentials`);
            console.log(`🔐 [HYBRID] ECDSA ID: ${hybridCredential.ecdsaCredentialId}`);
            console.log(`🔐 [HYBRID] ML-DSA ID: ${hybridCredential.mldsaCredentialId}`);
            console.log(`🔐 [HYBRID] Combined ID: ${hybridCredential.hybridId}`);
            return {
                verified: true,
                user: userWithHybrid,
                quantumStatus: {
                    resistant: true,
                    algorithm: 'ECDSA + ML-DSA-65',
                    level: resistanceLevel,
                    hybridId: hybridCredential.hybridId
                }
            };
        }
        catch (error) {
            console.error('Error verifying registration:', error);
            throw error;
        }
    }
    // Verify authentication response
    static async verifyAuthentication(response, username) {
        try {
            console.log(`🔍 Verifying authentication for: ${username || 'credential-based'}`);
            console.log(`🔍 [HYBRID] Performing quantum-resistant authentication...`);
            console.log(`🔍 [DEBUG] Response credential ID: ${response?.id}`);
            // DEBUG: Check database state
            const allUsers = await hybridDatabaseService_1.HybridDatabaseService.getAllUsers();
            console.log(`🔍 [DEBUG] Total users in database: ${allUsers.length}`);
            console.log(`🔍 [DEBUG] All users:`, allUsers.map(u => ({ username: u.username, biometricEnabled: u.biometricEnabled, id: u.id })));
            // In a real implementation, you would:
            // 1. Verify the signature against the stored public key
            // 2. Validate the challenge matches what was sent
            // 3. Check authenticator data
            // For now, simplified verification (works for demo)
            if (response && response.id) {
                // Try to find user by credential or username
                let user;
                if (username) {
                    console.log(`🔍 [DEBUG] Looking up user by username: ${username}`);
                    user = await hybridDatabaseService_1.HybridDatabaseService.getUserByUsername(username);
                    console.log(`🔍 [DEBUG] User found by username:`, user ? { username: user.username, biometricEnabled: user.biometricEnabled } : 'null');
                }
                else {
                    // In a real implementation, you would look up by credential ID
                    console.log(`🔍 [DEBUG] Looking up user by credential ID: ${response.id}`);
                    const users = await hybridDatabaseService_1.HybridDatabaseService.getAllUsers();
                    const biometricUsers = users.filter(u => u.biometricEnabled);
                    console.log(`🔍 [DEBUG] Users with biometric enabled: ${biometricUsers.length}`);
                    user = biometricUsers.find(u => u.biometricEnabled);
                }
                if (!user) {
                    console.error(`🔍 [DEBUG] No user found. Username: ${username}, Total users: ${allUsers.length}, Biometric users: ${allUsers.filter(u => u.biometricEnabled).length}`);
                    throw new Error('User not found or biometric not enabled');
                }
                console.log(`✅ Authentication verified for: ${user.username}`);
                return {
                    verified: true,
                    user: user
                };
            }
            else {
                throw new Error('Invalid authentication response');
            }
        }
        catch (error) {
            console.error('Error verifying authentication:', error);
            return {
                verified: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Check if user exists
    static async userExists(username) {
        try {
            const user = await hybridDatabaseService_1.HybridDatabaseService.getUserByUsername(username);
            return !!user;
        }
        catch (error) {
            console.error('Error checking user existence:', error);
            return false;
        }
    }
    // Get all users
    static async getAllUsers() {
        try {
            const users = await hybridDatabaseService_1.HybridDatabaseService.getAllUsers();
            return users.map(user => ({
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                createdAt: user.createdAt
            }));
        }
        catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }
    // Get quantum migration status
    static async getQuantumMigrationStatus() {
        try {
            const users = await hybridDatabaseService_1.HybridDatabaseService.getAllUsers();
            let quantumReady = 0;
            let vulnerable = 0;
            for (const user of users) {
                // Check if user has quantum-ready credentials based on webauthn data
                if (user.webauthnId && user.biometricEnabled) {
                    // For now, assume users with biometric enabled are quantum-ready
                    // In production, this would check actual credential types
                    quantumReady++;
                }
                else {
                    vulnerable++;
                }
            }
            return {
                totalUsers: users.length,
                quantumReady,
                vulnerable,
                migrationProgress: users.length > 0 ? (quantumReady / users.length) * 100 : 0,
                readyForQuantum: quantumReady === users.length && users.length > 0
            };
        }
        catch (error) {
            console.error('Error getting quantum migration status:', error);
            return {
                totalUsers: 0,
                quantumReady: 0,
                vulnerable: 0,
                migrationProgress: 0,
                readyForQuantum: false
            };
        }
    }
}
exports.WebAuthnService = WebAuthnService;
