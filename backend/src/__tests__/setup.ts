// src/__tests__/setup.ts - Global test setup for security testing

import { jest } from '@jest/globals';

// Extend Jest timeout for quantum operations that may be slower
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '5001'; // Different port for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/quankey_test';

// Global test utilities
global.console = {
  ...console,
  // Suppress logs during testing unless needed for debugging
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Security testing utilities
export const TestUtils = {
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
  generateTestData(length: number = 16): string {
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
  async measurePerformance<T>(operation: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
    const start = performance.now();
    const result = await operation();
    const timeMs = performance.now() - start;
    return { result, timeMs };
  },

  /**
   * Verify cryptographic operations produce different outputs
   */
  verifyUniqueness(outputs: string[]): boolean {
    const unique = new Set(outputs);
    return unique.size === outputs.length;
  },

  /**
   * Test entropy quality (basic statistical test)
   */
  testEntropy(data: string): { score: number; isGood: boolean } {
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
export const MockQuantumService = {
  generateMockQuantumData(length: number): number[] {
    // Generate pseudo-random data that looks quantum but is deterministic
    const data = [];
    let seed = 12345; // Fixed seed for reproducible tests
    
    for (let i = 0; i < length; i++) {
      seed = (seed * 9301 + 49297) % 233280; // Linear congruential generator
      data.push(seed % 256);
    }
    
    return data;
  },

  mockAxiosResponse(data: number[]) {
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
beforeAll(async () => {
  // Global setup for all tests
  console.log('🧪 Starting security tests for Quankey...');
});

afterAll(async () => {
  // Global cleanup
  console.log('✅ Security tests completed');
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
  jest.resetModules();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});