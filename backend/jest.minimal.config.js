// Minimal jest config for debugging
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 5000,
  testMatch: ['**/simple.test.ts'],
  verbose: true
};