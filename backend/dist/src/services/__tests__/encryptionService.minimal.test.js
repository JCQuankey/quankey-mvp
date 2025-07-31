"use strict";
/**
 * ===============================================================================
 * MINIMAL ENCRYPTION SERVICE TEST - INVESTOR COVERAGE DEMO
 * ===============================================================================
 *
 * Simple test to demonstrate >60% coverage on critical encryption service
 * Tests only the core functionality without complex async operations
 */
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
const globals_1 = require("@jest/globals");
const encryptionService_1 = require("../encryptionService");
(0, globals_1.describe)('🔐 EncryptionService - MINIMAL COVERAGE TEST', () => {
    (0, globals_1.test)('generateUserCredential works correctly', () => {
        const credential1 = encryptionService_1.EncryptionService.generateUserCredential('user1', 'webauthn1');
        const credential2 = encryptionService_1.EncryptionService.generateUserCredential('user1', 'webauthn1');
        const credential3 = encryptionService_1.EncryptionService.generateUserCredential('user2', 'webauthn2');
        // Same inputs produce same output
        (0, globals_1.expect)(credential1).toBe(credential2);
        // Different inputs produce different output
        (0, globals_1.expect)(credential1).not.toBe(credential3);
        // Credentials have reasonable length
        (0, globals_1.expect)(credential1.length).toBeGreaterThan(10);
        (0, globals_1.expect)(typeof credential1).toBe('string');
    });
    (0, globals_1.test)('basic encrypt/decrypt cycle works', () => __awaiter(void 0, void 0, void 0, function* () {
        const testData = 'test-password-123';
        const userCredential = encryptionService_1.EncryptionService.generateUserCredential('test-user', 'test-webauthn');
        // Encrypt the data
        const encrypted = yield encryptionService_1.EncryptionService.encrypt(testData, userCredential);
        // Verify encrypted structure
        (0, globals_1.expect)(encrypted).toHaveProperty('encryptedData');
        (0, globals_1.expect)(encrypted).toHaveProperty('iv');
        (0, globals_1.expect)(encrypted).toHaveProperty('salt');
        (0, globals_1.expect)(encrypted).toHaveProperty('authTag');
        (0, globals_1.expect)(encrypted).toHaveProperty('metadata');
        // Verify metadata
        (0, globals_1.expect)(encrypted.metadata.algorithm).toBe('AES-256-GCM');
        (0, globals_1.expect)(encrypted.metadata.keyDerivation).toBe('Argon2id');
        // Verify encrypted data doesn't contain original
        (0, globals_1.expect)(encrypted.encryptedData).not.toContain(testData);
        // Decrypt and verify
        const decrypted = yield encryptionService_1.EncryptionService.decrypt(encrypted, userCredential);
        (0, globals_1.expect)(decrypted).toBe(testData);
    }));
    (0, globals_1.test)('wrong credentials fail decryption', () => __awaiter(void 0, void 0, void 0, function* () {
        const testData = 'secret-data';
        const userCredential = encryptionService_1.EncryptionService.generateUserCredential('user1', 'webauthn1');
        const wrongCredential = encryptionService_1.EncryptionService.generateUserCredential('user2', 'webauthn2');
        const encrypted = yield encryptionService_1.EncryptionService.encrypt(testData, userCredential);
        // Wrong credential should fail
        yield (0, globals_1.expect)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield encryptionService_1.EncryptionService.decrypt(encrypted, wrongCredential);
        })).rejects.toThrow();
    }));
});
