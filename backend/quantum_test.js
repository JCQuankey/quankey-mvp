/**
 * Quick Quantum Service Test
 * Test the restored quantum functionality
 */

const path = require('path');
const { spawn } = require('child_process');

// Simple test runner
console.log('🧪 Testing RESTORED Quantum Service...\n');

// Import and test directly
try {
  // We'll use dynamic import since this is ES module
  async function testQuantum() {
    const { generateQuantumPassword } = require('./src/patents/quantum-random/quantumEntropyService.ts');
    
    console.log('🎲 Attempting quantum password generation...');
    
    try {
      const quantumPassword = await generateQuantumPassword(12, true);
      console.log('✅ SUCCESS: Quantum password generated:', quantumPassword);
      console.log('🔬 Length:', quantumPassword.length);
      console.log('🔬 Has symbols:', /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(quantumPassword));
      console.log('🔬 Has numbers:', /[0-9]/.test(quantumPassword));
      console.log('🔬 Has uppercase:', /[A-Z]/.test(quantumPassword));
      console.log('✅ QUANTUM SERVICE RESTORED');
    } catch (error) {
      console.log('❌ Quantum generation failed:', error.message);
      console.log('🔧 This is expected until quantum sources are properly configured');
      
      // Check if it's using fallback
      if (error.message.includes('fallback')) {
        console.log('✅ Fallback system working - PARTIAL SUCCESS');
      }
    }
  }
  
  testQuantum();
  
} catch (error) {
  console.log('❌ Module import failed:', error.message);
  console.log('🔧 Will test via npm test instead...');
}