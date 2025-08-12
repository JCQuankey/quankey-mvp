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
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const dotenv = __importStar(require("dotenv"));
// Load test environment
dotenv.config({ path: '.env.test' });
(0, globals_1.describe)('🔒 Basic Security Tests', () => {
    test('✅ Environment variables are properly configured', () => {
        const required = [
            'DATABASE_URL',
            'JWT_PUBLIC_KEY',
            'JWT_PRIVATE_KEY',
            'DB_ENCRYPTION_KEY'
        ];
        required.forEach(envVar => {
            (0, globals_1.expect)(process.env[envVar]).toBeDefined();
            (0, globals_1.expect)(process.env[envVar]).not.toBe('');
        });
    });
    test('✅ Database encryption key has correct length', () => {
        const key = process.env.DB_ENCRYPTION_KEY;
        (0, globals_1.expect)(key).toBeDefined();
        (0, globals_1.expect)(key.length).toBe(64); // 32 bytes = 64 hex chars
    });
    test('✅ JWT keys are properly formatted', () => {
        const publicKey = process.env.JWT_PUBLIC_KEY;
        const privateKey = process.env.JWT_PRIVATE_KEY;
        (0, globals_1.expect)(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
        (0, globals_1.expect)(publicKey).toContain('-----END PUBLIC KEY-----');
        (0, globals_1.expect)(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
        (0, globals_1.expect)(privateKey).toContain('-----END PRIVATE KEY-----');
    });
    test('✅ Node environment is properly set', () => {
        const env = process.env.NODE_ENV;
        (0, globals_1.expect)(['development', 'production', 'test']).toContain(env);
    });
    test('✅ Encryption service can be imported', async () => {
        const { encryption } = await Promise.resolve().then(() => __importStar(require('../services/encryption.service')));
        (0, globals_1.expect)(encryption).toBeDefined();
        (0, globals_1.expect)(typeof encryption.encrypt).toBe('function');
        (0, globals_1.expect)(typeof encryption.decrypt).toBe('function');
    });
    test('✅ Database service can be imported', async () => {
        const { db } = await Promise.resolve().then(() => __importStar(require('../services/database.service')));
        (0, globals_1.expect)(db).toBeDefined();
        (0, globals_1.expect)(typeof db.healthCheck).toBe('function');
    });
});
