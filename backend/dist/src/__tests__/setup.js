"use strict";
// src/__tests__/setup.ts - Global test setup for security testing
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
exports.MockQuantumService = exports.TestUtils = void 0;
const globals_1 = require("@jest/globals");
// Extend Jest timeout for quantum operations that may be slower
globals_1.jest.setTimeout(30000);
// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '5001'; // Different port for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/quankey_test';
// Global test utilities
global.console = Object.assign(Object.assign({}, console), { 
    // Suppress logs during testing unless needed for debugging
    log: globals_1.jest.fn(), warn: globals_1.jest.fn(), error: globals_1.jest.fn(), info: globals_1.jest.fn(), debug: globals_1.jest.fn() });
// Security testing utilities
exports.TestUtils = {
    /**
     * Generate test user credentials for encryption tests
     */
    generateTestCredentials() {
        return {
            userId: 'test-user-123',
            webauthnId: 'test-webauthn-456',
            email: 'test@quankey.com'
        };
    },
    /**
     * Generate random test data for security tests
     */
    generateTestData(length = 16) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    /**
     * Measure performance for security operations
     */
    measurePerformance(operation) {
        return __awaiter(this, void 0, void 0, function* () {
            const start = performance.now();
            const result = yield operation();
            const timeMs = performance.now() - start;
            return { result, timeMs };
        });
    },
    /**
     * Verify cryptographic operations produce different outputs
     */
    verifyUniqueness(outputs) {
        const unique = new Set(outputs);
        return unique.size === outputs.length;
    },
    /**
     * Test entropy quality (basic statistical test)
     */
    testEntropy(data) {
        const chars = new Set(data.split(''));
        const entropy = chars.size / data.length;
        const score = Math.round(entropy * 100);
        return {
            score,
            isGood: score > 50 // Basic threshold for good entropy
        };
    }
};
// Mock external quantum service for deterministic testing
exports.MockQuantumService = {
    generateMockQuantumData(length) {
        // Generate pseudo-random data that looks quantum but is deterministic
        const data = [];
        let seed = 12345; // Fixed seed for reproducible tests
        for (let i = 0; i < length; i++) {
            seed = (seed * 9301 + 49297) % 233280; // Linear congruential generator
            data.push(seed % 256);
        }
        return data;
    },
    mockAxiosResponse(data) {
        return {
            data: { data },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        };
    }
};
// Setup/Teardown hooks
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Global setup for all tests
    console.log('🧪 Starting security tests for Quankey...');
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Global cleanup
    console.log('✅ Security tests completed');
}));
beforeEach(() => {
    // Reset mocks before each test
    globals_1.jest.clearAllMocks();
    globals_1.jest.resetModules();
});
afterEach(() => {
    // Cleanup after each test
    globals_1.jest.restoreAllMocks();
});
