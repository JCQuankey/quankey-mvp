"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryption = exports.EncryptionService = void 0;
const crypto_1 = require("crypto");
class EncryptionService {
    constructor() {
        // Derivar master key de variable de entorno
        const keySource = process.env.DB_ENCRYPTION_KEY || process.env.MASTER_ENCRYPTION_KEY;
        if (!keySource || keySource.length < 64) {
            console.error('FATAL: DB_ENCRYPTION_KEY invalid or missing (must be 64+ chars)');
            process.exit(1);
        }
        // Derivar clave con scrypt
        const salt = (0, crypto_1.createHash)('sha256').update('quankey-v1').digest();
        this.masterKey = (0, crypto_1.scryptSync)(keySource, salt, 32);
        // Test de cifrado/descifrado
        this.selfTest();
    }
    selfTest() {
        try {
            const testData = 'encryption-self-test';
            const encrypted = this.encrypt(testData);
            const decrypted = this.decrypt(encrypted);
            if (decrypted !== testData) {
                throw new Error('Encryption self-test failed');
            }
            console.log('✅ Encryption service verified');
        }
        catch (error) {
            console.error('❌ FATAL: Encryption service failed:', error);
            process.exit(1);
        }
    }
    static getInstance() {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService();
        }
        return EncryptionService.instance;
    }
    encrypt(plaintext) {
        const iv = (0, crypto_1.randomBytes)(16);
        const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', this.masterKey, iv);
        let encrypted = cipher.update(plaintext, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const authTag = cipher.getAuthTag();
        // Format: iv:authTag:ciphertext (base64)
        return Buffer.concat([iv, authTag, encrypted]).toString('base64');
    }
    decrypt(ciphertext) {
        try {
            const buffer = Buffer.from(ciphertext, 'base64');
            const iv = buffer.subarray(0, 16);
            const authTag = buffer.subarray(16, 32);
            const encrypted = buffer.subarray(32);
            const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', this.masterKey, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString('utf8');
        }
        catch (error) {
            throw new Error('Decryption failed - possible key rotation needed');
        }
    }
    // Cifrado de campos específicos
    encryptPassword(password) {
        const encrypted = this.encrypt(password);
        const keyHash = (0, crypto_1.createHash)('sha256')
            .update(this.masterKey)
            .digest('hex')
            .substring(0, 8); // Primeros 8 chars para verificación
        return { encrypted, keyHash };
    }
    decryptPassword(encrypted, keyHash) {
        // Verificar que estamos usando la clave correcta
        const currentKeyHash = (0, crypto_1.createHash)('sha256')
            .update(this.masterKey)
            .digest('hex')
            .substring(0, 8);
        if (currentKeyHash !== keyHash) {
            throw new Error('Encryption key mismatch - possible key rotation needed');
        }
        return this.decrypt(encrypted);
    }
}
exports.EncryptionService = EncryptionService;
exports.encryption = EncryptionService.getInstance();
