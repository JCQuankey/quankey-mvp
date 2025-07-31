// backend/start.js - Production TypeScript wrapper for Render
// Alternative solution if ts-node direct execution has issues

console.log('🚀 [START] Quankey Backend - Loading TypeScript via ts-node...');

try {
  // Register ts-node to handle TypeScript files
  require('ts-node/register');
  
  // Load and execute the main TypeScript server
  require('./src/server.ts');
  
  console.log('✅ [START] TypeScript server loaded successfully');
} catch (error) {
  console.error('❌ [START] Failed to start TypeScript server:', error);
  
  // Fallback to compiled JavaScript if available
  console.log('🔄 [START] Attempting fallback to compiled JavaScript...');
  try {
    require('./dist/server.js');
    console.log('✅ [START] Fallback to compiled JavaScript successful');
  } catch (fallbackError) {
    console.error('❌ [START] Fallback also failed:', fallbackError);
    process.exit(1);
  }
}