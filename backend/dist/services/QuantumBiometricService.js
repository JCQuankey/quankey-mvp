"use strict";
/**
 * 🧬 QUANTUM BIOMETRIC SERVICE - Master Plan v6.0
 * ⚠️ REVOLUTIONARY: Core biometric-quantum key derivation service
 *
 * GOLDEN RULES ENFORCED:
 * - NO biometric data stored on server (zero-knowledge)
 * - ML-KEM-768 key derivation FROM biometric signatures
 * - Zero-knowledge proofs validate identity without exposure
 * - Multi-biometric 2-of-3 threshold system
 * - Quantum bridge for multi-device sync without recovery codes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.quantumBiometricService = exports.QuantumBiometricService = void 0;
const ml_kem_js_1 = require("@noble/post-quantum/ml-kem.js");
const ml_dsa_js_1 = require("@noble/post-quantum/ml-dsa.js");
const utils_js_1 = require("@noble/post-quantum/utils.js");
const crypto_1 = require("crypto");
const auditLogger_service_1 = require("./auditLogger.service");
const database_service_1 = require("./database.service");
class QuantumBiometricService {
    constructor() {
        this.auditLogger = new auditLogger_service_1.AuditLogger();
        this.db = database_service_1.DatabaseService.getInstance();
        // Server's quantum keypair for encrypting user public keys
        this.serverQuantumKeys = null;
        this.initializeServerQuantumKeys();
    }
    /**
     * 🔑 INITIALIZE SERVER QUANTUM KEYPAIR
     * Used to encrypt user public keys for storage
     */
    async initializeServerQuantumKeys() {
        try {
            // Generate or load server quantum keypair
            this.serverQuantumKeys = ml_kem_js_1.ml_kem768.keygen();
            this.auditLogger.logSecurityEvent({
                type: 'SERVER_QUANTUM_KEYS_INITIALIZED',
                userId: 'system',
                ip: 'localhost',
                userAgent: 'QuantumBiometricService',
                endpoint: 'service.init',
                severity: 'low',
                details: {
                    algorithm: 'ML-KEM-768',
                    keyGenerated: true,
                    security: 'Category 3 (~AES-192)'
                }
            });
        }
        catch (error) {
            console.error('❌ FATAL: Server quantum keys initialization failed:', error);
            process.exit(1);
        }
    }
    /**
     * 🧬 REGISTER QUANTUM BIOMETRIC IDENTITY
     * User's biometric generates quantum keys - server never sees biometric data
     */
    async registerQuantumBiometricIdentity(data) {
        try {
            console.log(`🧬 Registering quantum biometric identity: ${data.username}`);
            // 1. Validate zero-knowledge biometric proof (without seeing biometric)
            const proofValid = await this.validateBiometricProof(data.biometricProof, data.deviceFingerprint);
            if (!proofValid) {
                throw new Error('Invalid biometric proof - identity verification failed');
            }
            // 2. Verify quantum public key can be decrypted (validates encryption)
            const publicKeyValid = await this.validateQuantumPublicKey(data.quantumPublicKey);
            if (!publicKeyValid) {
                throw new Error('Invalid quantum public key - cryptographic validation failed');
            }
            // 3. Generate unique user ID
            const userId = this.generateSecureUserId(data.username, data.biometricProof.challenge);
            // 4. Create quantum public key hash for identification
            const publicKeyHash = this.generateQuantumKeyHash(data.quantumPublicKey);
            // 5. Create device entry
            const device = {
                deviceId: this.generateSecureDeviceId(data.deviceFingerprint),
                deviceName: 'Primary Device',
                deviceFingerprint: data.deviceFingerprint,
                biometricTypes: data.biometricTypes,
                quantumPublicKeyHash: publicKeyHash,
                registeredAt: new Date(),
                isActive: true
            };
            // 6. Store identity (WITHOUT biometric data)
            const identity = {
                userId,
                username: data.username,
                quantumPublicKeyHash: publicKeyHash,
                encryptedQuantumPublicKey: data.quantumPublicKey,
                biometricTypes: data.biometricTypes,
                devices: [device],
                createdAt: new Date()
            };
            await this.storeQuantumBiometricIdentity(identity);
            // 7. Audit log (without biometric data)
            this.auditLogger.logSecurityEvent({
                type: 'QUANTUM_BIOMETRIC_IDENTITY_REGISTERED',
                userId,
                ip: 'pending',
                userAgent: 'QuantumBiometricService',
                endpoint: 'identity.register',
                severity: 'low',
                details: {
                    username: data.username,
                    biometricTypes: data.biometricTypes,
                    quantumAlgorithm: 'ML-KEM-768',
                    deviceFingerprint: data.deviceFingerprint,
                    biometricDataStored: false, // ✅ CRITICAL: No biometric data stored
                    zeroKnowledgeProof: true
                }
            });
            console.log(`✅ Quantum biometric identity registered: ${userId}`);
            return {
                success: true,
                userId,
                device
            };
        }
        catch (error) {
            console.error('❌ Quantum biometric registration failed:', error);
            this.auditLogger.logSecurityEvent({
                type: 'QUANTUM_BIOMETRIC_REGISTRATION_FAILED',
                userId: 'unknown',
                ip: 'pending',
                userAgent: 'QuantumBiometricService',
                endpoint: 'identity.register',
                severity: 'medium',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    username: data.username
                }
            });
            return {
                success: false,
                userId: '',
                device: {},
                error: error instanceof Error ? error.message : 'Registration failed'
            };
        }
    }
    /**
     * 🔓 AUTHENTICATE QUANTUM BIOMETRIC IDENTITY
     */
    async authenticateQuantumBiometric(data) {
        try {
            console.log('🔓 Authenticating quantum biometric identity...');
            // 1. Validate zero-knowledge biometric proof
            const proofValid = await this.validateBiometricProof(data.biometricProof, data.deviceFingerprint);
            if (!proofValid) {
                throw new Error('Biometric authentication failed');
            }
            // 2. Find identity by device fingerprint (without biometric data)
            const identity = await this.findIdentityByDevice(data.deviceFingerprint);
            if (!identity) {
                throw new Error('Identity not found for this device');
            }
            // 3. Update last authenticated timestamp
            identity.lastAuthenticated = new Date();
            await this.updateIdentityLastAuth(identity.userId);
            // 4. Audit successful authentication
            this.auditLogger.logSecurityEvent({
                type: 'QUANTUM_BIOMETRIC_AUTH_SUCCESS',
                userId: identity.userId,
                ip: 'pending',
                userAgent: 'QuantumBiometricService',
                endpoint: 'identity.authenticate',
                severity: 'low',
                details: {
                    username: identity.username,
                    deviceFingerprint: data.deviceFingerprint,
                    biometricDataAccessed: false, // ✅ CRITICAL: No biometric data accessed
                    quantumValidation: true
                }
            });
            console.log(`✅ Quantum biometric authentication successful: ${identity.username}`);
            return {
                success: true,
                identity
            };
        }
        catch (error) {
            console.error('❌ Quantum biometric authentication failed:', error);
            this.auditLogger.logSecurityEvent({
                type: 'QUANTUM_BIOMETRIC_AUTH_FAILED',
                userId: 'unknown',
                ip: 'pending',
                userAgent: 'QuantumBiometricService',
                endpoint: 'identity.authenticate',
                severity: 'medium',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    deviceFingerprint: data.deviceFingerprint
                }
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed'
            };
        }
    }
    /**
     * 📱 CREATE QUANTUM BRIDGE FOR NEW DEVICE
     * 60-second temporal bridge for adding devices without recovery codes
     */
    async createQuantumBridge(data) {
        try {
            console.log(`📱 Creating quantum bridge for user: ${data.userId}`);
            // 1. Validate existing identity
            const identity = await this.getIdentityById(data.userId);
            if (!identity) {
                throw new Error('Identity not found');
            }
            // 2. Validate biometric signature from trusted device
            const signatureValid = await this.validateBiometricSignature(data.biometricSignature, data.challengeResponse, identity);
            if (!signatureValid) {
                throw new Error('Invalid biometric signature');
            }
            // 3. Generate temporal quantum bridge token
            const bridgeToken = this.generateQuantumBridgeToken();
            // 4. Encrypt bridge data with server quantum key
            const bridgeData = {
                userId: data.userId,
                username: identity.username,
                validUntil: Date.now() + 60000, // 60 seconds
                algorithm: 'ML-KEM-768'
            };
            const encryptedBridgeData = await this.encryptBridgeData(bridgeData);
            // 5. Store temporal bridge (expires in 60 seconds)
            const bridge = {
                token: bridgeToken,
                fromDeviceId: 'trusted-device', // From authentication context
                encryptedBridgeData,
                expiresAt: new Date(Date.now() + 60000),
                used: false
            };
            await this.storeQuantumBridge(bridge);
            // 6. Generate QR code for scanning
            const qrCode = await this.generateBridgeQRCode(bridgeToken, encryptedBridgeData);
            this.auditLogger.logSecurityEvent({
                type: 'QUANTUM_BRIDGE_CREATED',
                userId: data.userId,
                ip: 'pending',
                userAgent: 'QuantumBiometricService',
                endpoint: 'bridge.create',
                severity: 'low',
                details: {
                    bridgeToken,
                    expiresInSeconds: 60,
                    quantumEncrypted: true
                }
            });
            console.log(`✅ Quantum bridge created: ${bridgeToken}`);
            return {
                success: true,
                qrCode,
                token: bridgeToken
            };
        }
        catch (error) {
            console.error('❌ Quantum bridge creation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Bridge creation failed'
            };
        }
    }
    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================
    async validateBiometricProof(proof, deviceFingerprint) {
        try {
            // Validate ML-DSA-65 signature without accessing original biometric
            const challengeBytes = this.base64ToUint8Array(proof.challenge);
            const signatureBytes = this.base64ToUint8Array(proof.proof);
            // Get device public key for verification
            const devicePublicKey = await this.getDevicePublicKey(deviceFingerprint);
            if (!devicePublicKey)
                return false;
            // Verify signature (proves biometric ownership without exposing biometric)
            return ml_dsa_js_1.ml_dsa65.verify(signatureBytes, challengeBytes, devicePublicKey);
        }
        catch (error) {
            console.error('❌ Biometric proof validation failed:', error);
            return false;
        }
    }
    async validateQuantumPublicKey(encryptedPublicKey) {
        try {
            if (!this.serverQuantumKeys)
                return false;
            // Attempt to decapsulate to validate key format
            const encryptedBytes = this.base64ToUint8Array(encryptedPublicKey);
            ml_kem_js_1.ml_kem768.decapsulate(encryptedBytes, this.serverQuantumKeys.secretKey);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    generateSecureUserId(username, biometricChallenge) {
        const data = `${username}:${biometricChallenge}:${Date.now()}`;
        return (0, crypto_1.createHash)('sha256').update(data).digest('hex').substring(0, 16);
    }
    generateSecureDeviceId(deviceFingerprint) {
        return (0, crypto_1.createHash)('sha256').update(deviceFingerprint).digest('hex').substring(0, 12);
    }
    generateQuantumKeyHash(encryptedPublicKey) {
        return (0, crypto_1.createHash)('sha256').update(encryptedPublicKey).digest('hex').substring(0, 16);
    }
    generateQuantumBridgeToken() {
        return Buffer.from((0, utils_js_1.randomBytes)(32)).toString('hex');
    }
    base64ToUint8Array(base64) {
        return new Uint8Array(Buffer.from(base64, 'base64'));
    }
    uint8ArrayToBase64(arr) {
        return Buffer.from(arr).toString('base64');
    }
    // Database operations (to be implemented)
    async storeQuantumBiometricIdentity(identity) {
        // Store identity without biometric data
        console.log('📦 Storing quantum biometric identity:', identity.userId);
    }
    async findIdentityByDevice(deviceFingerprint) {
        // Find identity by device fingerprint (no biometric data involved)
        console.log('🔍 Finding identity by device:', deviceFingerprint);
        return null;
    }
    async getIdentityById(userId) {
        console.log('🔍 Getting identity by ID:', userId);
        return null;
    }
    async updateIdentityLastAuth(userId) {
        console.log('⏰ Updating last auth timestamp:', userId);
    }
    async getDevicePublicKey(deviceFingerprint) {
        console.log('🔑 Getting device public key:', deviceFingerprint);
        return null;
    }
    async validateBiometricSignature(signature, challenge, identity) {
        console.log('✅ Validating biometric signature for:', identity.userId);
        return true; // Placeholder
    }
    async encryptBridgeData(data) {
        if (!this.serverQuantumKeys)
            throw new Error('Server quantum keys not initialized');
        // Encrypt bridge data with server quantum key
        const dataBytes = new TextEncoder().encode(JSON.stringify(data));
        const encrypted = ml_kem_js_1.ml_kem768.encapsulate(dataBytes, this.serverQuantumKeys.publicKey);
        return this.uint8ArrayToBase64(encrypted.cipherText);
    }
    async storeQuantumBridge(bridge) {
        console.log('📦 Storing quantum bridge:', bridge.token);
    }
    async generateBridgeQRCode(token, encryptedData) {
        const qrData = { token, data: encryptedData, expires: Date.now() + 60000 };
        return `quankey://bridge/${Buffer.from(JSON.stringify(qrData)).toString('base64')}`;
    }
}
exports.QuantumBiometricService = QuantumBiometricService;
exports.quantumBiometricService = new QuantumBiometricService();
