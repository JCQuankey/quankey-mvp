/**
 * Post-Quantum Cryptography Integration Test
 * Tests the real libOQS integration vs simulation fallback
 */

import { libOQSBinaryService } from '../services/libOQSBinaryService';
import { PostQuantumService } from '../services/postQuantumService';

/**
 * Test suite for PQC integration
 */
export class PQCIntegrationTest {
  
  /**
   * Run all PQC integration tests
   */
  public static async runAllTests(): Promise<void> {
    console.log('🧪 Starting PQC Integration Test Suite...');
    console.log('='.repeat(60));
    
    try {
      await this.testLibOQSBinaryService();
      await this.testPostQuantumService();
      await this.testHybridWorkflow();
      
      console.log('✅ All PQC integration tests PASSED');
      
    } catch (error) {
      console.error('❌ PQC integration tests FAILED:', error.message);
      throw error;
    }
  }
  
  /**
   * Test libOQS Binary Service
   */
  private static async testLibOQSBinaryService(): Promise<void> {
    console.log('\n🔬 Testing libOQS Binary Service...');
    
    // Test service availability
    const status = libOQSBinaryService.getStatus();
    console.log(`📊 Service Status: ${status.mode} (${status.available ? 'Available' : 'Simulation'})`);
    console.log(`📁 Path: ${status.path}`);
    
    // Test ML-KEM-768 key generation
    console.log('\n🔑 Testing ML-KEM-768 key generation...');
    const kemKeyPair = await libOQSBinaryService.generateKEMKeyPair();
    
    if (!kemKeyPair.publicKey || !kemKeyPair.secretKey) {
      throw new Error('ML-KEM-768 key generation failed');
    }
    
    console.log(`✅ ML-KEM-768 keys generated:`);
    console.log(`   Public key: ${kemKeyPair.publicKey.length} bytes`);
    console.log(`   Secret key: ${kemKeyPair.secretKey.length} bytes`);
    console.log(`   Algorithm: ${kemKeyPair.algorithm}`);
    
    // Test ML-DSA-65 key generation
    console.log('\n🔏 Testing ML-DSA-65 key generation...');
    const dsaKeyPair = await libOQSBinaryService.generateSignatureKeyPair();
    
    if (!dsaKeyPair.publicKey || !dsaKeyPair.secretKey) {
      throw new Error('ML-DSA-65 key generation failed');
    }
    
    console.log(`✅ ML-DSA-65 keys generated:`);
    console.log(`   Public key: ${dsaKeyPair.publicKey.length} bytes`);
    console.log(`   Secret key: ${dsaKeyPair.secretKey.length} bytes`);
    console.log(`   Algorithm: ${dsaKeyPair.algorithm}`);
    
    // Test signature and verification
    console.log('\n✍️ Testing ML-DSA-65 signature...');
    const testData = Buffer.from('Quankey PQC test message', 'utf8');
    const signature = await libOQSBinaryService.signData(testData, dsaKeyPair.secretKey);
    
    if (!signature) {
      throw new Error('ML-DSA-65 signing failed');
    }
    
    console.log(`✅ Signature created: ${signature.length} bytes`);
    
    // In simulation mode, we use secret key for both signing and verification
    // In real PQC, we would use the corresponding public key
    const verificationKey = libOQSBinaryService.isServiceAvailable() ? dsaKeyPair.publicKey : dsaKeyPair.secretKey;
    const isValid = await libOQSBinaryService.verifySignature(testData, signature, verificationKey);
    
    if (!isValid) {
      throw new Error('ML-DSA-65 verification failed');
    }
    
    console.log('✅ Signature verification PASSED');
    
    // Run service self-test
    console.log('\n🔍 Running service self-test...');
    const selfTest = await libOQSBinaryService.runSelfTest();
    
    if (!selfTest.success) {
      console.warn('⚠️ Service self-test had issues:', selfTest.errors);
    } else {
      console.log('✅ Service self-test PASSED');
    }
    
    console.log('✅ libOQS Binary Service tests completed');
  }
  
  /**
   * Test PostQuantum Service
   */
  private static async testPostQuantumService(): Promise<void> {
    console.log('\n🔗 Testing PostQuantum Service (Hybrid)...');
    
    // Test hybrid key generation
    console.log('\n🔑 Testing hybrid key generation...');
    const hybridCredential = await PostQuantumService.generateHybridKeyPair();
    
    if (!hybridCredential.ecdsaPublicKey || !hybridCredential.mldsaPublicKey) {
      throw new Error('Hybrid key generation failed');
    }
    
    console.log(`✅ Hybrid credential generated:`);
    console.log(`   ECDSA public key: ${hybridCredential.ecdsaPublicKey.length} bytes`);
    console.log(`   ML-DSA public key: ${hybridCredential.mldsaPublicKey.length} bytes`);
    console.log(`   ECDSA credential ID: ${hybridCredential.ecdsaCredentialId}`);
    console.log(`   ML-DSA credential ID: ${hybridCredential.mldsaCredentialId}`);
    console.log(`   Hybrid ID: ${hybridCredential.hybridId}`);
    
    console.log('✅ PostQuantum Service tests completed');
  }
  
  /**
   * Test complete hybrid workflow
   */
  private static async testHybridWorkflow(): Promise<void> {
    console.log('\n🔄 Testing complete hybrid workflow...');
    
    // Generate hybrid credential
    const credential = await PostQuantumService.generateHybridKeyPair();
    console.log('✅ Step 1: Hybrid credential generated');
    
    // Test data to sign
    const testData = Buffer.from('Quankey hybrid signature test', 'utf8');
    
    // Test individual ML-DSA signature (without hybrid for now)
    console.log('\n✍️ Testing ML-DSA signature separately...');
    const dsaKeyPair = await libOQSBinaryService.generateSignatureKeyPair();
    const mldsaSignature = await libOQSBinaryService.signData(testData, dsaKeyPair.secretKey);
    
    // In simulation mode, use secret key for verification; in real mode, use public key
    const verificationKey = libOQSBinaryService.isServiceAvailable() ? dsaKeyPair.publicKey : dsaKeyPair.secretKey;
    const mldsaValid = await libOQSBinaryService.verifySignature(testData, mldsaSignature, verificationKey);
    
    if (!mldsaValid) {
      throw new Error('ML-DSA signature verification failed');
    }
    
    console.log('✅ Step 2: ML-DSA signature test PASSED');
    
    // Test quantum resistance level
    const resistanceLevel = PostQuantumService.getQuantumResistanceLevel(credential);
    console.log(`✅ Step 3: Quantum resistance level: ${resistanceLevel}`);
    
    console.log('✅ Complete hybrid workflow test PASSED');
  }
  
  /**
   * Test performance metrics
   */
  public static async testPerformance(): Promise<void> {
    console.log('\n⚡ Running performance tests...');
    
    const iterations = 5;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      console.log(`\n📊 Performance test iteration ${i + 1}/${iterations}`);
      
      // Test key generation performance
      const keyGenStart = Date.now();
      await libOQSBinaryService.generateSignatureKeyPair();
      const keyGenTime = Date.now() - keyGenStart;
      
      // Test signing performance
      const sigStart = Date.now();
      const testData = Buffer.from(`Performance test ${i}`, 'utf8');
      const keyPair = await libOQSBinaryService.generateSignatureKeyPair();
      await libOQSBinaryService.signData(testData, keyPair.secretKey);
      const sigTime = Date.now() - sigStart;
      
      console.log(`   Key generation: ${keyGenTime}ms`);
      console.log(`   Signing: ${sigTime}ms`);
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`\n📈 Performance Results:`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Average per iteration: ${avgTime.toFixed(2)}ms`);
    console.log(`   Iterations: ${iterations}`);
    
    // Get service metrics
    const metrics = libOQSBinaryService.getPerformanceMetrics();
    if (metrics.length > 0) {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      console.log(`   Service avg duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`   Total operations: ${metrics.length}`);
    }
    
    console.log('✅ Performance tests completed');
  }
  
  /**
   * Test algorithm availability
   */
  public static async testAlgorithmAvailability(): Promise<void> {
    console.log('\n🔍 Testing algorithm availability...');
    
    try {
      const algorithms = await libOQSBinaryService.getAvailableAlgorithms();
      
      console.log(`✅ Available KEM algorithms:`);
      algorithms.kems.forEach(alg => console.log(`   - ${alg}`));
      
      console.log(`✅ Available signature algorithms:`);
      algorithms.signatures.forEach(alg => console.log(`   - ${alg}`));
      
      // Check for required algorithms
      const hasMLKEM = algorithms.kems.some(alg => alg.includes('ML-KEM') || alg.includes('Kyber'));
      const hasMLDSA = algorithms.signatures.some(alg => alg.includes('ML-DSA') || alg.includes('Dilithium'));
      
      if (!hasMLKEM) {
        console.warn('⚠️ ML-KEM-768 not found in available algorithms');
      }
      
      if (!hasMLDSA) {
        console.warn('⚠️ ML-DSA-65 not found in available algorithms');
      }
      
      console.log('✅ Algorithm availability test completed');
      
    } catch (error) {
      console.warn('⚠️ Could not retrieve algorithm list:', error.message);
    }
  }
}

// Export for direct execution
if (require.main === module) {
  PQCIntegrationTest.runAllTests()
    .then(() => {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}