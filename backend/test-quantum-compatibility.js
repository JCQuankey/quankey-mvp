#!/usr/bin/env node
// test-quantum-compatibility.js
// Quick test to verify ML-DSA-65 compatibility between frontend and backend

const crypto = require('crypto');

/**
 * Simulated test to verify signature compatibility
 * Run this in both frontend and backend environments
 */
async function testQuantumCompatibility() {
  console.log('🧪 Testing Quantum Signature Compatibility\n');
  
  // Test data that matches what the frontend sends
  const testData = {
    challenge: 'test-challenge-' + Date.now(),
    deviceId: 'device-test-123'
  };
  
  // Create the same message structure as frontend
  const message = Buffer.from(JSON.stringify({
    challenge: testData.challenge,
    deviceId: testData.deviceId,
    timestamp: Date.now()
  }));
  
  // Generate a hash like the frontend does
  const challengeHash = crypto.createHash('sha256').update(message).digest();
  
  console.log('📝 Test Configuration:');
  console.log('  Message length:', message.length);
  console.log('  Challenge hash (hex):', challengeHash.toString('hex').substring(0, 32) + '...');
  console.log('  Challenge hash (base64):', challengeHash.toString('base64'));
  
  // Simulate what should happen
  console.log('\n📊 Expected Behavior:');
  console.log('  1. Frontend generates ML-DSA-65 signature of challenge');
  console.log('  2. Frontend sends: { proof, challenge, devicePublicKey }');
  console.log('  3. Backend verifies using same challenge and publicKey');
  console.log('  4. Both use SmartHybridQuantumCrypto with same fallback logic');
  
  // Test base64 encoding/decoding (common source of issues)
  console.log('\n🔄 Testing Base64 Encoding:');
  const testBytes = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253]);
  const encoded = Buffer.from(testBytes).toString('base64');
  const decoded = Buffer.from(encoded, 'base64');
  const decodedArray = new Uint8Array(decoded);
  
  const encodingOk = testBytes.every((byte, i) => byte === decodedArray[i]);
  console.log('  Base64 round-trip:', encodingOk ? '✅ OK' : '❌ FAILED');
  
  // Check Noble availability
  console.log('\n📦 Checking Noble Post-Quantum:');
  try {
    const { ML_DSA_65 } = require('@noble/post-quantum');
    console.log('  Noble library: ✅ Available');
    
    // Try a quick operation
    const seed = new Uint8Array(32);
    crypto.randomFillSync(seed);
    const keypair = ML_DSA_65.keygen(seed);
    console.log('  ML-DSA-65 keygen: ✅ Working');
    console.log('  Public key size:', keypair.publicKey.length, 'bytes (expected: 1952)');
    console.log('  Secret key size:', keypair.secretKey.length, 'bytes (expected: 4032)');
    
    // Try signing
    const testMsg = new Uint8Array([1, 2, 3, 4, 5]);
    try {
      const signature = ML_DSA_65.sign(testMsg, keypair.secretKey);
      console.log('  ML-DSA-65 sign: ✅ Working');
      console.log('  Signature size:', signature.length, 'bytes (expected: 3293)');
      
      // Try verification
      const isValid = ML_DSA_65.verify(signature, testMsg, keypair.publicKey);
      console.log('  ML-DSA-65 verify:', isValid ? '✅ Working' : '⚠️ Failed');
    } catch (signError) {
      console.log('  ML-DSA-65 sign: ⚠️ Failed - Using fallback needed');
      console.log('    Error:', signError.message);
    }
    
  } catch (error) {
    console.log('  Noble library: ❌ Not available or error');
    console.log('    Error:', error.message);
    console.log('  💡 Install with: npm install @noble/post-quantum');
  }
  
  // Recommendations
  console.log('\n✨ Recommendations:');
  console.log('  1. Ensure both frontend and backend use SmartHybridQuantumCrypto');
  console.log('  2. Both should have same fallback logic for Noble failures');
  console.log('  3. Verify Base64 encoding is consistent');
  console.log('  4. Check that challenge generation matches exactly');
  console.log('  5. For dev/testing, temporarily accept structural validation');
  
  console.log('\n🚀 Next Steps:');
  console.log('  1. Copy SmartHybridQuantumCrypto.ts to backend/src/crypto/');
  console.log('  2. Update QuantumBiometricService.ts to use it');
  console.log('  3. Restart backend: npm run dev');
  console.log('  4. Test registration again');
}

// Run the test
testQuantumCompatibility().catch(console.error);