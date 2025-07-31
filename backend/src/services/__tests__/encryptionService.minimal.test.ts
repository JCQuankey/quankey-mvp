/**
 * ===============================================================================
 * MINIMAL ENCRYPTION SERVICE TEST - INVESTOR COVERAGE DEMO
 * ===============================================================================
 * 
 * Simple test to demonstrate >60% coverage on critical encryption service
 * Tests only the core functionality without complex async operations
 */

import { describe, test, expect } from '@jest/globals';
import { EncryptionService } from '../encryptionService';

describe('🔐 EncryptionService - MINIMAL COVERAGE TEST', () => {
  
  test('generateUserCredential works correctly', () => {
    const credential1 = EncryptionService.generateUserCredential('user1', 'webauthn1');
    const credential2 = EncryptionService.generateUserCredential('user1', 'webauthn1');
    const credential3 = EncryptionService.generateUserCredential('user2', 'webauthn2');
    
    // Same inputs produce same output
    expect(credential1).toBe(credential2);
    
    // Different inputs produce different output
    expect(credential1).not.toBe(credential3);
    
    // Credentials have reasonable length
    expect(credential1.length).toBeGreaterThan(10);
    expect(typeof credential1).toBe('string');
  });

  test('basic encrypt/decrypt cycle works', async () => {
    const testData = 'test-password-123';
    const userCredential = EncryptionService.generateUserCredential('test-user', 'test-webauthn');
    
    // Encrypt the data
    const encrypted = await EncryptionService.encrypt(testData, userCredential);
    
    // Verify encrypted structure
    expect(encrypted).toHaveProperty('encryptedData');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('salt');
    expect(encrypted).toHaveProperty('authTag');
    expect(encrypted).toHaveProperty('metadata');
    
    // Verify metadata
    expect(encrypted.metadata.algorithm).toBe('AES-256-GCM');
    expect(encrypted.metadata.keyDerivation).toBe('Argon2id');
    
    // Verify encrypted data doesn't contain original
    expect(encrypted.encryptedData).not.toContain(testData);
    
    // Decrypt and verify
    const decrypted = EncryptionService.decrypt(encrypted, userCredential);
    expect(decrypted).toBe(testData);
  });

  test('wrong credentials fail decryption', async () => {
    const testData = 'secret-data';
    const userCredential = EncryptionService.generateUserCredential('user1', 'webauthn1');
    const wrongCredential = EncryptionService.generateUserCredential('user2', 'webauthn2');
    
    const encrypted = await EncryptionService.encrypt(testData, userCredential);
    
    // Wrong credential should fail
    expect(() => {
      EncryptionService.decrypt(encrypted, wrongCredential);
    }).toThrow();
  });

});

// Export to contribute to coverage
export { };