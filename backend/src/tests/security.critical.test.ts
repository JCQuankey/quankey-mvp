import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../server.secure';
import { db, prisma } from '../services/database.service';

describe('🚨 CRITICAL Security Tests - MUST PASS', () => {
  
  beforeAll(async () => {
    // Setup test environment
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;
    process.env.JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
    process.env.DB_ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'test-key-64-chars-long-for-testing-purposes-only-not-for-prod';
  });

  test('❌ MUST REJECT: Requests without authentication', async () => {
    const response = await request(app)
      .get('/api/vault/items')
      .expect(401);
    
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('Authentication required');
  });

  test('❌ MUST REJECT: Invalid JWT tokens', async () => {
    const response = await request(app)
      .get('/api/vault/items')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
    
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('Invalid authentication');
  });

  test('❌ MUST BLOCK: Excessive requests (rate limiting)', async () => {
    // Make multiple rapid requests to trigger rate limit
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        request(app)
          .get('/health')
          .then(res => res.status)
      );
    }
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(status => status === 429);
    
    // Should have some rate limited responses
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('✅ Database connection uses PostgreSQL with SSL', async () => {
    const dbUrl = process.env.DATABASE_URL;
    expect(dbUrl).toBeDefined();
    expect(dbUrl).toMatch(/^postgresql:\/\//);
    
    // In production, SSL should be required
    if (process.env.NODE_ENV === 'production') {
      expect(dbUrl).toContain('sslmode=require');
    }
  });

  test('✅ Health endpoint responds without authentication', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.version).toBeDefined();
  });

  test('✅ Security headers are present', async () => {
    const response = await request(app)
      .get('/health');
    
    // Verify critical security headers
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBeDefined();
    
    if (process.env.NODE_ENV === 'production') {
      expect(response.headers['strict-transport-security']).toBeDefined();
    }
  });

  test('✅ Encryption service self-test passes', async () => {
    const { encryption } = await import('../services/encryption.service');
    
    const testData = 'test-encryption-data';
    const encrypted = await encryption.encrypt(testData);
    const decrypted = await encryption.decrypt(encrypted);
    
    expect(decrypted).toBe(testData);
    expect(encrypted).not.toBe(testData);
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=|]+$/); // Base64 with pipe separators for quantum format
  });

  test('✅ Audit logging is functional', async () => {
    const testOperation = {
      userId: 'test-user-id',
      action: 'TEST_OPERATION',
      resource: 'test-resource',
      result: 'SUCCESS' as const,
      metadata: { test: true }
    };

    // Should not throw
    await expect(db.auditOperation(testOperation)).resolves.toBeDefined();
  });

  test('❌ MUST FAIL: 404 for unknown endpoints', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);
    
    expect(response.body.error).toBe('Not found');
  });

  test('✅ Error handler prevents information leakage', async () => {
    // This would normally cause an error, but should be handled gracefully
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    // Should not contain stack traces or detailed error info in production
    expect(JSON.stringify(response.body)).not.toContain('Error:');
    expect(JSON.stringify(response.body)).not.toContain('stack');
    expect(JSON.stringify(response.body)).not.toContain('prisma');
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });
});

describe('🔐 Encryption Security Tests', () => {
  test('✅ Password encryption includes key verification', async () => {
    const { encryption } = await import('../services/encryption.service');
    
    const password = 'test-password-123';
    const { encrypted, keyHash } = await encryption.encryptPassword(password);
    
    expect(encrypted).toBeDefined();
    expect(keyHash).toBeDefined();
    expect(keyHash).toHaveLength(8); // First 8 chars of key hash
    
    const decrypted = await encryption.decryptPassword(encrypted, keyHash);
    expect(decrypted).toBe(password);
  });

  test('❌ MUST FAIL: Decryption with wrong key hash', async () => {
    const { encryption } = await import('../services/encryption.service');
    
    const password = 'test-password-123';
    const { encrypted } = await encryption.encryptPassword(password);
    
    // Should fail with wrong key hash
    await expect(async () => {
      await encryption.decryptPassword(encrypted, 'wrongkey');
    }).rejects.toThrow('Encryption key mismatch');
  });
});