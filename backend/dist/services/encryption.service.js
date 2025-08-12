"use strict";
/**
 * 🔐 REAL QUANTUM ENCRYPTION SERVICE - NO AES
 * ⚠️ GOLDEN RULE ENFORCED: Uses REAL ML-KEM-768 instead of AES-256-GCM
 *
 * COMPETITIVE ADVANTAGE: Real post-quantum cryptography using ML-KEM-768
 * - NO AES (not quantum-resistant)
 * - REAL ML-KEM-768 from @noble/post-quantum
 * - NIST-approved post-quantum encryption
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryption = exports.EncryptionService = void 0;
const crypto_1 = require("crypto");
const quantumCrypto_service_1 = require("./quantumCrypto.service");
class EncryptionService {
    constructor() {
        // Verificar que tenemos la clave maestra
        this.keySource = process.env.DB_ENCRYPTION_KEY || process.env.MASTER_ENCRYPTION_KEY || '';
        if (!this.keySource || this.keySource.length < 64) {
            console.error('❌ FATAL: DB_ENCRYPTION_KEY invalid or missing (must be 64+ chars)');
            process.exit(1);
        }
        // Inicializar quantum crypto en lugar de AES
        this.initQuantumCrypto();
    }
    async initQuantumCrypto() {
        try {
            await quantumCrypto_service_1.quantumCrypto.initializeQuantumKeys();
            await this.quantumSelfTest();
            console.log('✅ REAL Quantum Encryption service verified (ML-KEM-768)');
        }
        catch (error) {
            console.error('❌ FATAL: Quantum encryption service failed:', error);
            process.exit(1);
        }
    }
    async quantumSelfTest() {
        try {
            const testData = 'quantum-encryption-self-test-ML-KEM-768';
            const encrypted = await this.encrypt(testData);
            const decrypted = await this.decrypt(encrypted);
            if (decrypted !== testData) {
                throw new Error('Quantum encryption self-test failed');
            }
        }
        catch (error) {
            throw new Error(`Quantum self-test failed: ${error}`);
        }
    }
    static getInstance() {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService();
        }
        return EncryptionService.instance;
    }
    /**
     * 🔐 QUANTUM ENCRYPT using REAL ML-KEM-768
     * NO AES - Real post-quantum cryptography only
     */
    async encrypt(plaintext) {
        try {
            const result = await quantumCrypto_service_1.quantumCrypto.quantumEncrypt(plaintext);
            // Format: ciphertext|encapsulatedKey|signature (base64)
            return `${result.ciphertext}|${result.encapsulatedKey}|${result.signature}`;
        }
        catch (error) {
            throw new Error(`Quantum encryption failed: ${error}`);
        }
    }
    /**
     * 🔓 QUANTUM DECRYPT using REAL ML-KEM-768
     * NO AES - Real post-quantum cryptography only
     */
    async decrypt(ciphertext) {
        try {
            const parts = ciphertext.split('|');
            if (parts.length !== 3) {
                throw new Error('Invalid quantum ciphertext format');
            }
            const [ciphertextPart, encapsulatedKey, signature] = parts;
            return await quantumCrypto_service_1.quantumCrypto.quantumDecrypt({
                ciphertext: ciphertextPart,
                encapsulatedKey,
                signature
            });
        }
        catch (error) {
            throw new Error(`Quantum decryption failed: ${error}`);
        }
    }
    /**
     * 🔐 QUANTUM PASSWORD ENCRYPTION using REAL ML-KEM-768
     * NO AES - Real post-quantum cryptography only
     */
    async encryptPassword(password) {
        const encrypted = await this.encrypt(password);
        const keyHash = (0, crypto_1.createHash)('sha256')
            .update(this.keySource)
            .digest('hex')
            .substring(0, 8); // Primeros 8 chars para verificación
        return { encrypted, keyHash };
    }
    /**
     * 🔓 QUANTUM PASSWORD DECRYPTION using REAL ML-KEM-768
     * NO AES - Real post-quantum cryptography only
     */
    async decryptPassword(encrypted, keyHash) {
        // Verificar que estamos usando la clave correcta
        const currentKeyHash = (0, crypto_1.createHash)('sha256')
            .update(this.keySource)
            .digest('hex')
            .substring(0, 8);
        if (currentKeyHash !== keyHash) {
            throw new Error('Quantum key mismatch - possible key rotation needed');
        }
        return await this.decrypt(encrypted);
    }
    /**
     * 📊 GET QUANTUM ENCRYPTION STATUS
     */
    getQuantumStatus() {
        return {
            algorithm: 'ML-KEM-768',
            library: '@noble/post-quantum',
            aesUsed: false,
            quantumResistant: true,
            realImplementation: true,
            nistApproved: true
        };
    }
}
exports.EncryptionService = EncryptionService;
exports.encryption = EncryptionService.getInstance();
