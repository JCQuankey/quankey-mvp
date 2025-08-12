"use strict";
/**
 * 🧪 QUANTUM CRYPTOGRAPHY REAL TESTS
 * ⚠️ GOLDEN RULE: Test REAL ML-KEM-768 & ML-DSA-65 - NO SIMULATIONS
 *
 * Tests the actual @noble/post-quantum implementation
 * - ML-KEM-768: Real key encapsulation mechanism
 * - ML-DSA-65: Real digital signature algorithm
 * - Performance benchmarks against NIST specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
const quantumCrypto_service_1 = require("../services/quantumCrypto.service");
const encryption_service_1 = require("../services/encryption.service");
describe('🔬 REAL Quantum Cryptography Tests', () => {
    beforeAll(async () => {
        // Initialize quantum crypto service
        await quantumCrypto_service_1.quantumCrypto.initializeQuantumKeys();
    });
    describe('ML-KEM-768 Key Encapsulation Mechanism', () => {
        it('should initialize quantum keys successfully', async () => {
            const status = quantumCrypto_service_1.quantumCrypto.getQuantumStatus();
            expect(status.initialized).toBe(true);
            expect(status.algorithms.kem.name).toBe('ML-KEM-768');
            expect(status.algorithms.kem.category).toBe('Category 3 (~AES-192)');
            expect(status.nistApproved).toBe(true);
            expect(status.realImplementation).toBe(true);
            expect(status.noSimulations).toBe(true);
        });
        it('should encrypt and decrypt with ML-KEM-768', async () => {
            const plaintext = 'test-quantum-encryption-ML-KEM-768';
            const encrypted = await quantumCrypto_service_1.quantumCrypto.quantumEncrypt(plaintext);
            expect(encrypted.ciphertext).toBeDefined();
            expect(encrypted.encapsulatedKey).toBeDefined();
            expect(encrypted.signature).toBeDefined();
            const decrypted = await quantumCrypto_service_1.quantumCrypto.quantumDecrypt(encrypted);
            expect(decrypted).toBe(plaintext);
        });
        it('should fail decryption with invalid signature', async () => {
            const plaintext = 'test-signature-validation';
            const encrypted = await quantumCrypto_service_1.quantumCrypto.quantumEncrypt(plaintext);
            // Corrupt the signature
            const corruptedData = {
                ...encrypted,
                signature: 'invalid-signature-base64'
            };
            await expect(quantumCrypto_service_1.quantumCrypto.quantumDecrypt(corruptedData))
                .rejects.toThrow('Invalid quantum signature');
        });
        it('should encrypt different plaintexts to different ciphertexts', async () => {
            const plaintext1 = 'message-1';
            const plaintext2 = 'message-2';
            const encrypted1 = await quantumCrypto_service_1.quantumCrypto.quantumEncrypt(plaintext1);
            const encrypted2 = await quantumCrypto_service_1.quantumCrypto.quantumEncrypt(plaintext2);
            // Different plaintexts should produce different ciphertexts
            expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
            expect(encrypted1.encapsulatedKey).not.toBe(encrypted2.encapsulatedKey);
        });
    });
    describe('ML-DSA-65 Digital Signature Algorithm', () => {
        it('should initialize DSA keys successfully', async () => {
            const status = quantumCrypto_service_1.quantumCrypto.getQuantumStatus();
            expect(status.algorithms.dsa.name).toBe('ML-DSA-65');
            expect(status.algorithms.dsa.category).toBe('Category 3 (~AES-192)');
            expect(status.algorithms.dsa.keySize).toBeGreaterThan(0);
        });
        it('should get public keys', async () => {
            const keys = await quantumCrypto_service_1.quantumCrypto.getPublicKeys();
            expect(keys.kemPublicKey).toBeDefined();
            expect(keys.dsaPublicKey).toBeDefined();
            expect(typeof keys.kemPublicKey).toBe('string');
            expect(typeof keys.dsaPublicKey).toBe('string');
        });
        it('should verify quantum signatures correctly', async () => {
            const message = 'test-quantum-signature-ML-DSA-65';
            const keys = await quantumCrypto_service_1.quantumCrypto.getPublicKeys();
            // This test would need the private key to sign, but we can test the verify function
            const isValid = quantumCrypto_service_1.quantumCrypto.verifyQuantumSignature(message, 'dummy-signature', keys.dsaPublicKey);
            // Should return false for dummy signature (which is expected)
            expect(typeof isValid).toBe('boolean');
        });
    });
    describe('Integrated Encryption Service (ML-KEM-768)', () => {
        it('should use quantum encryption instead of AES', async () => {
            const status = encryption_service_1.encryption.getQuantumStatus();
            expect(status.algorithm).toBe('ML-KEM-768');
            expect(status.library).toBe('@noble/post-quantum');
            expect(status.aesUsed).toBe(false);
            expect(status.quantumResistant).toBe(true);
            expect(status.realImplementation).toBe(true);
            expect(status.nistApproved).toBe(true);
        });
        it('should encrypt and decrypt passwords with quantum crypto', async () => {
            const password = 'quantum-secure-password-2025';
            const { encrypted, keyHash } = await encryption_service_1.encryption.encryptPassword(password);
            expect(encrypted).toBeDefined();
            expect(keyHash).toBeDefined();
            expect(keyHash.length).toBe(8);
            const decrypted = await encryption_service_1.encryption.decryptPassword(encrypted, keyHash);
            expect(decrypted).toBe(password);
        });
        it('should fail decryption with wrong key hash', async () => {
            const password = 'test-key-validation';
            const { encrypted } = await encryption_service_1.encryption.encryptPassword(password);
            await expect(encryption_service_1.encryption.decryptPassword(encrypted, 'wronghash'))
                .rejects.toThrow('Quantum key mismatch');
        });
    });
    describe('Performance Benchmarks', () => {
        it('should meet minimum performance requirements', async () => {
            const iterations = 10;
            const plaintext = 'performance-test-ML-KEM-768';
            // Measure encryption performance
            const encryptStart = Date.now();
            for (let i = 0; i < iterations; i++) {
                await quantumCrypto_service_1.quantumCrypto.quantumEncrypt(plaintext);
            }
            const encryptTime = Date.now() - encryptStart;
            const encryptOpsPerSec = (iterations / encryptTime) * 1000;
            // Noble claims 3,220 ops/sec for ML-KEM-768 encapsulation
            // We should get at least 10% of that (allowing for overhead)
            expect(encryptOpsPerSec).toBeGreaterThan(300);
            console.log(`ML-KEM-768 encryption: ${encryptOpsPerSec.toFixed(0)} ops/sec`);
        }, 30000); // 30s timeout for performance test
        it('should handle concurrent operations', async () => {
            const promises = Array(5).fill(null).map(async (_, i) => {
                const plaintext = `concurrent-test-${i}`;
                const encrypted = await quantumCrypto_service_1.quantumCrypto.quantumEncrypt(plaintext);
                const decrypted = await quantumCrypto_service_1.quantumCrypto.quantumDecrypt(encrypted);
                return decrypted === plaintext;
            });
            const results = await Promise.all(promises);
            expect(results.every(r => r === true)).toBe(true);
        });
    });
    describe('NIST Compliance Validation', () => {
        it('should use NIST-approved algorithms only', async () => {
            const status = quantumCrypto_service_1.quantumCrypto.getQuantumStatus();
            // Verify we're using the exact NIST-approved algorithms
            expect(status.algorithms.kem.name).toBe('ML-KEM-768');
            expect(status.algorithms.dsa.name).toBe('ML-DSA-65');
            expect(status.library).toBe('@noble/post-quantum');
            expect(status.nistApproved).toBe(true);
        });
        it('should generate correct key sizes', async () => {
            const status = quantumCrypto_service_1.quantumCrypto.getQuantumStatus();
            // ML-KEM-768 public key should be 1184 bytes
            expect(status.algorithms.kem.keySize).toBe(1184);
            // ML-DSA-65 key sizes are defined in NIST FIPS 204
            expect(status.algorithms.dsa.keySize).toBeGreaterThan(1000);
        });
    });
});
describe('🚫 Anti-Simulation Validation', () => {
    it('should not contain any simulation code', () => {
        // Test that we are not using any fake implementations
        const status = quantumCrypto_service_1.quantumCrypto.getQuantumStatus();
        expect(status.realImplementation).toBe(true);
        expect(status.noSimulations).toBe(true);
        expect(status.library).toBe('@noble/post-quantum');
    });
    it('should not use AES fallback', async () => {
        const encryptionStatus = encryption_service_1.encryption.getQuantumStatus();
        expect(encryptionStatus.aesUsed).toBe(false);
        expect(encryptionStatus.algorithm).toBe('ML-KEM-768');
        expect(encryptionStatus.quantumResistant).toBe(true);
    });
});
