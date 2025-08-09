import { describe, it, expect } from '@jest/globals';
import * as dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

describe('🔒 Basic Security Tests', () => {
  
  test('✅ Environment variables are properly configured', () => {
    const required = [
      'DATABASE_URL',
      'JWT_PUBLIC_KEY', 
      'JWT_PRIVATE_KEY',
      'DB_ENCRYPTION_KEY'
    ];
    
    required.forEach(envVar => {
      expect(process.env[envVar]).toBeDefined();
      expect(process.env[envVar]).not.toBe('');
    });
  });
  
  test('✅ Database encryption key has correct length', () => {
    const key = process.env.DB_ENCRYPTION_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBe(64); // 32 bytes = 64 hex chars
  });
  
  test('✅ JWT keys are properly formatted', () => {
    const publicKey = process.env.JWT_PUBLIC_KEY;
    const privateKey = process.env.JWT_PRIVATE_KEY;
    
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(publicKey).toContain('-----END PUBLIC KEY-----');
    
    expect(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(privateKey).toContain('-----END PRIVATE KEY-----');
  });
  
  test('✅ Node environment is properly set', () => {
    const env = process.env.NODE_ENV;
    expect(['development', 'production', 'test']).toContain(env);
  });

  test('✅ Encryption service can be imported', async () => {
    const { encryption } = await import('../services/encryption.service');
    expect(encryption).toBeDefined();
    expect(typeof encryption.encrypt).toBe('function');
    expect(typeof encryption.decrypt).toBe('function');
  });

  test('✅ Database service can be imported', async () => {
    const { db } = await import('../services/database.service');
    expect(db).toBeDefined();
    expect(typeof db.healthCheck).toBe('function');
  });
});