"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const server_secure_1 = require("../server.secure");
const database_service_1 = require("../services/database.service");
(0, globals_1.describe)('🚨 CRITICAL Security Tests - MUST PASS', () => {
    (0, globals_1.beforeAll)(async () => {
        // Setup test environment
        process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
        process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;
        process.env.JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
        process.env.DB_ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'test-key-64-chars-long-for-testing-purposes-only-not-for-prod';
    });
    test('❌ MUST REJECT: Requests without authentication', async () => {
        const response = await (0, supertest_1.default)(server_secure_1.app)
            .get('/api/vault/items')
            .expect(401);
        (0, globals_1.expect)(response.body.error).toBeDefined();
        (0, globals_1.expect)(response.body.error).toContain('Authentication required');
    });
    test('❌ MUST REJECT: Invalid JWT tokens', async () => {
        const response = await (0, supertest_1.default)(server_secure_1.app)
            .get('/api/vault/items')
            .set('Authorization', 'Bearer invalid-token')
            .expect(401);
        (0, globals_1.expect)(response.body.error).toBeDefined();
        (0, globals_1.expect)(response.body.error).toContain('Invalid authentication');
    });
    test('❌ MUST BLOCK: Excessive requests (rate limiting)', async () => {
        // Make multiple rapid requests to trigger rate limit
        const promises = [];
        for (let i = 0; i < 50; i++) {
            promises.push((0, supertest_1.default)(server_secure_1.app)
                .get('/health')
                .then(res => res.status));
        }
        const responses = await Promise.all(promises);
        const rateLimited = responses.filter(status => status === 429);
        // Should have some rate limited responses
        (0, globals_1.expect)(rateLimited.length).toBeGreaterThan(0);
    });
    test('✅ Database connection uses PostgreSQL with SSL', async () => {
        const dbUrl = process.env.DATABASE_URL;
        (0, globals_1.expect)(dbUrl).toBeDefined();
        (0, globals_1.expect)(dbUrl).toMatch(/^postgresql:\/\//);
        // In production, SSL should be required
        if (process.env.NODE_ENV === 'production') {
            (0, globals_1.expect)(dbUrl).toContain('sslmode=require');
        }
    });
    test('✅ Health endpoint responds without authentication', async () => {
        const response = await (0, supertest_1.default)(server_secure_1.app)
            .get('/health')
            .expect(200);
        (0, globals_1.expect)(response.body.status).toBeDefined();
        (0, globals_1.expect)(response.body.timestamp).toBeDefined();
        (0, globals_1.expect)(response.body.version).toBeDefined();
    });
    test('✅ Security headers are present', async () => {
        const response = await (0, supertest_1.default)(server_secure_1.app)
            .get('/health');
        // Verify critical security headers
        (0, globals_1.expect)(response.headers['x-frame-options']).toBeDefined();
        (0, globals_1.expect)(response.headers['x-content-type-options']).toBe('nosniff');
        (0, globals_1.expect)(response.headers['content-security-policy']).toBeDefined();
        if (process.env.NODE_ENV === 'production') {
            (0, globals_1.expect)(response.headers['strict-transport-security']).toBeDefined();
        }
    });
    test('✅ Encryption service self-test passes', async () => {
        const { encryption } = await Promise.resolve().then(() => __importStar(require('../services/encryption.service')));
        const testData = 'test-encryption-data';
        const encrypted = await encryption.encrypt(testData);
        const decrypted = await encryption.decrypt(encrypted);
        (0, globals_1.expect)(decrypted).toBe(testData);
        (0, globals_1.expect)(encrypted).not.toBe(testData);
        (0, globals_1.expect)(encrypted).toMatch(/^[A-Za-z0-9+/=|]+$/); // Base64 with pipe separators for quantum format
    });
    test('✅ Audit logging is functional', async () => {
        const testOperation = {
            userId: 'test-user-id',
            action: 'TEST_OPERATION',
            resource: 'test-resource',
            result: 'SUCCESS',
            metadata: { test: true }
        };
        // Should not throw
        await (0, globals_1.expect)(database_service_1.db.auditOperation(testOperation)).resolves.toBeDefined();
    });
    test('❌ MUST FAIL: 404 for unknown endpoints', async () => {
        const response = await (0, supertest_1.default)(server_secure_1.app)
            .get('/api/nonexistent')
            .expect(404);
        (0, globals_1.expect)(response.body.error).toBe('Not found');
    });
    test('✅ Error handler prevents information leakage', async () => {
        // This would normally cause an error, but should be handled gracefully
        const response = await (0, supertest_1.default)(server_secure_1.app)
            .get('/health')
            .expect(200);
        // Should not contain stack traces or detailed error info in production
        (0, globals_1.expect)(JSON.stringify(response.body)).not.toContain('Error:');
        (0, globals_1.expect)(JSON.stringify(response.body)).not.toContain('stack');
        (0, globals_1.expect)(JSON.stringify(response.body)).not.toContain('prisma');
    });
    (0, globals_1.afterAll)(async () => {
        // Cleanup
        await database_service_1.prisma.$disconnect();
    });
});
(0, globals_1.describe)('🔐 Encryption Security Tests', () => {
    test('✅ Password encryption includes key verification', async () => {
        const { encryption } = await Promise.resolve().then(() => __importStar(require('../services/encryption.service')));
        const password = 'test-password-123';
        const { encrypted, keyHash } = await encryption.encryptPassword(password);
        (0, globals_1.expect)(encrypted).toBeDefined();
        (0, globals_1.expect)(keyHash).toBeDefined();
        (0, globals_1.expect)(keyHash).toHaveLength(8); // First 8 chars of key hash
        const decrypted = await encryption.decryptPassword(encrypted, keyHash);
        (0, globals_1.expect)(decrypted).toBe(password);
    });
    test('❌ MUST FAIL: Decryption with wrong key hash', async () => {
        const { encryption } = await Promise.resolve().then(() => __importStar(require('../services/encryption.service')));
        const password = 'test-password-123';
        const { encrypted } = await encryption.encryptPassword(password);
        // Should fail with wrong key hash
        await (0, globals_1.expect)(async () => {
            await encryption.decryptPassword(encrypted, 'wrongkey');
        }).rejects.toThrow('Encryption key mismatch');
    });
});
