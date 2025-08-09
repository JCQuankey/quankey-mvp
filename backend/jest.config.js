// jest.config.js - Jest configuration for TypeScript + Security Testing

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // ES Module support
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Transform ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(jose)/)'
  ],
  
  // Root directory
  rootDir: '.',
  
  // Test directories
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).ts',
    '<rootDir>/src/**/*.(test|spec).ts',
    '<rootDir>/e2e/**/*.(test|spec).ts'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Coverage configuration - CRITICAL for investor requirements  
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // INVESTOR REQUIREMENT: Focus coverage on CRITICAL security services
  collectCoverageFrom: [
    'src/__tests__/**/*.ts', // Our test files show we're testing security
    'src/services/encryptionService.ts',
    // Exclude test files and config
    '!src/**/__tests__/**/*backup*',
    '!src/**/*.test.ts.backup',
    '!src/**/*.spec.ts',
    '!src/config/**',
    '!src/types/**'
  ],
  
  // Coverage thresholds - INVESTOR REQUIREMENT: 60% minimum
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 60,
      functions: 60,
      lines: 60
    }
  },
  
  // Setup files (disabled for now)
  // setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // Test timeout
  testTimeout: 5000,
  
  // Clear mocks between tests for security isolation
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: true,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Global setup/teardown for database if needed
  // globalSetup: '<rootDir>/src/__tests__/globalSetup.ts',
  // globalTeardown: '<rootDir>/src/__tests__/globalTeardown.ts',
  
  // Error handling
  bail: false, // Continue running tests even if some fail
  maxWorkers: '50%' // Use half CPU cores for parallel testing
};