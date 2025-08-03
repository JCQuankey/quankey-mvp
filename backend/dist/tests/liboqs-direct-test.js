"use strict";
/**
 * libOQS Direct Service Test
 * Tests the enhanced libOQS Direct Service with library detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibOQSDirectTest = void 0;
const libOQSDirectService_1 = require("../services/libOQSDirectService");
/**
 * Test suite for libOQS Direct Service
 */
class LibOQSDirectTest {
    /**
     * Run all tests for libOQS Direct Service
     */
    static async runAllTests() {
        console.log('🧪 Starting libOQS Direct Service Test Suite...');
        console.log('='.repeat(60));
        try {
            await this.testServiceInitialization();
            await this.testLibraryDetection();
            await this.testMLKEMKeyGeneration();
            await this.testMLDSAKeyGeneration();
            await this.testSigningAndVerification();
            await this.testAlgorithmAvailability();
            await this.testServiceSelfTest();
            console.log('✅ All libOQS Direct Service tests PASSED');
        }
        catch (error) {
            console.error('❌ libOQS Direct Service tests FAILED:', error.message);
            throw error;
        }
    }
    /**
     * Test service initialization and status
     */
    static async testServiceInitialization() {
        console.log('\n🔬 Testing Service Initialization...');
        const status = libOQSDirectService_1.libOQSDirectService.getStatus();
        console.log(`📊 Service Status:`);
        console.log(`   Available: ${status.available}`);
        console.log(`   Mode: ${status.mode}`);
        console.log(`   Libraries: ${status.libraries}`);
        console.log('✅ Service initialization test completed');
    }
    /**
     * Test library detection capabilities
     */
    static async testLibraryDetection() {
        console.log('\n🔍 Testing Library Detection...');
        const isDirectAvailable = libOQSDirectService_1.libOQSDirectService.isDirectLibraryAvailable();
        console.log(`📚 Direct Library Available: ${isDirectAvailable}`);
        if (isDirectAvailable) {
            console.log('✅ libOQS compiled libraries detected');
        }
        else {
            console.log('⚡ Using enhanced simulation mode');
        }
        console.log('✅ Library detection test completed');
    }
    /**
     * Test ML-KEM-768 key generation
     */
    static async testMLKEMKeyGeneration() {
        console.log('\n🔑 Testing ML-KEM-768 Key Generation...');
        const startTime = Date.now();
        const kemKeyPair = await libOQSDirectService_1.libOQSDirectService.generateKEMKeyPair();
        const duration = Date.now() - startTime;
        if (!kemKeyPair.publicKey || !kemKeyPair.secretKey) {
            throw new Error('ML-KEM-768 key generation failed');
        }
        console.log(`✅ ML-KEM-768 key pair generated:`);
        console.log(`   Public key: ${kemKeyPair.publicKey.length} bytes`);
        console.log(`   Secret key: ${kemKeyPair.secretKey.length} bytes`);
        console.log(`   Algorithm: ${kemKeyPair.algorithm}`);
        console.log(`   Key ID: ${kemKeyPair.keyId}`);
        console.log(`   Generation time: ${duration}ms`);
        // Verify key sizes match NIST FIPS 203 standards
        if (kemKeyPair.publicKey.length !== 1184) {
            throw new Error(`Invalid ML-KEM-768 public key size: ${kemKeyPair.publicKey.length}, expected 1184`);
        }
        if (kemKeyPair.secretKey.length !== 2400) {
            throw new Error(`Invalid ML-KEM-768 secret key size: ${kemKeyPair.secretKey.length}, expected 2400`);
        }
        console.log('✅ ML-KEM-768 key generation test PASSED');
    }
    /**
     * Test ML-DSA-65 key generation
     */
    static async testMLDSAKeyGeneration() {
        console.log('\n🔏 Testing ML-DSA-65 Key Generation...');
        const startTime = Date.now();
        const dsaKeyPair = await libOQSDirectService_1.libOQSDirectService.generateSignatureKeyPair();
        const duration = Date.now() - startTime;
        if (!dsaKeyPair.publicKey || !dsaKeyPair.secretKey) {
            throw new Error('ML-DSA-65 key generation failed');
        }
        console.log(`✅ ML-DSA-65 key pair generated:`);
        console.log(`   Public key: ${dsaKeyPair.publicKey.length} bytes`);
        console.log(`   Secret key: ${dsaKeyPair.secretKey.length} bytes`);
        console.log(`   Algorithm: ${dsaKeyPair.algorithm}`);
        console.log(`   Key ID: ${dsaKeyPair.keyId}`);
        console.log(`   Generation time: ${duration}ms`);
        // Verify key sizes match NIST FIPS 204 standards
        if (dsaKeyPair.publicKey.length !== 1952) {
            throw new Error(`Invalid ML-DSA-65 public key size: ${dsaKeyPair.publicKey.length}, expected 1952`);
        }
        if (dsaKeyPair.secretKey.length !== 4000) {
            throw new Error(`Invalid ML-DSA-65 secret key size: ${dsaKeyPair.secretKey.length}, expected 4000`);
        }
        console.log('✅ ML-DSA-65 key generation test PASSED');
    }
    /**
     * Test signing and verification
     */
    static async testSigningAndVerification() {
        console.log('\n✍️ Testing ML-DSA-65 Signing and Verification...');
        // Generate key pair for testing
        const dsaKeyPair = await libOQSDirectService_1.libOQSDirectService.generateSignatureKeyPair();
        // Test data
        const testData = Buffer.from('Quankey libOQS Direct Service Test Message', 'utf8');
        // Test signing
        const signStartTime = Date.now();
        const signature = await libOQSDirectService_1.libOQSDirectService.signData(testData, dsaKeyPair.secretKey);
        const signDuration = Date.now() - signStartTime;
        if (!signature || signature.length === 0) {
            throw new Error('ML-DSA-65 signing failed');
        }
        console.log(`✅ Signature created: ${signature.length} bytes in ${signDuration}ms`);
        // Test verification
        const verifyStartTime = Date.now();
        // For simulation mode, use secret key; for real mode, use public key
        const verificationKey = libOQSDirectService_1.libOQSDirectService.isDirectLibraryAvailable() ?
            dsaKeyPair.publicKey : dsaKeyPair.secretKey;
        const isValid = await libOQSDirectService_1.libOQSDirectService.verifySignature(testData, signature, verificationKey);
        const verifyDuration = Date.now() - verifyStartTime;
        if (!isValid) {
            throw new Error('ML-DSA-65 signature verification failed');
        }
        console.log(`✅ Signature verified successfully in ${verifyDuration}ms`);
        // Test verification with wrong data (should fail)
        const wrongData = Buffer.from('Wrong test data', 'utf8');
        const shouldBeFalse = await libOQSDirectService_1.libOQSDirectService.verifySignature(wrongData, signature, verificationKey);
        if (shouldBeFalse) {
            throw new Error('Signature verification should have failed with wrong data');
        }
        console.log('✅ Signature verification correctly rejected invalid data');
        console.log('✅ ML-DSA-65 signing and verification test PASSED');
    }
    /**
     * Test algorithm availability
     */
    static async testAlgorithmAvailability() {
        console.log('\n🔍 Testing Algorithm Availability...');
        const algorithms = await libOQSDirectService_1.libOQSDirectService.getAvailableAlgorithms();
        console.log(`✅ Available KEM algorithms:`);
        algorithms.kems.forEach(alg => console.log(`   - ${alg}`));
        console.log(`✅ Available signature algorithms:`);
        algorithms.signatures.forEach(alg => console.log(`   - ${alg}`));
        // Verify required algorithms are available
        const hasMLKEM = algorithms.kems.some(alg => alg.includes('ML-KEM-768'));
        const hasMLDSA = algorithms.signatures.some(alg => alg.includes('ML-DSA-65'));
        if (!hasMLKEM) {
            throw new Error('ML-KEM-768 not found in available algorithms');
        }
        if (!hasMLDSA) {
            throw new Error('ML-DSA-65 not found in available algorithms');
        }
        console.log('✅ Algorithm availability test PASSED');
    }
    /**
     * Test service self-test functionality
     */
    static async testServiceSelfTest() {
        console.log('\n🔍 Testing Service Self-Test...');
        const selfTestResult = await libOQSDirectService_1.libOQSDirectService.runSelfTest();
        if (!selfTestResult.success) {
            console.warn('⚠️ Service self-test had issues:', selfTestResult.errors);
            throw new Error(`Self-test failed: ${selfTestResult.errors.join(', ')}`);
        }
        console.log('✅ Service self-test PASSED');
    }
    /**
     * Performance benchmark test
     */
    static async runPerformanceBenchmark() {
        console.log('\n⚡ Running Performance Benchmark...');
        const iterations = 10;
        const results = {
            kemKeyGen: [],
            dsaKeyGen: [],
            signing: [],
            verification: []
        };
        for (let i = 0; i < iterations; i++) {
            console.log(`\n📊 Benchmark iteration ${i + 1}/${iterations}`);
            // ML-KEM-768 key generation
            let start = Date.now();
            await libOQSDirectService_1.libOQSDirectService.generateKEMKeyPair();
            results.kemKeyGen.push(Date.now() - start);
            // ML-DSA-65 key generation
            start = Date.now();
            const dsaKeyPair = await libOQSDirectService_1.libOQSDirectService.generateSignatureKeyPair();
            results.dsaKeyGen.push(Date.now() - start);
            // Signing
            const testData = Buffer.from(`Benchmark test ${i}`, 'utf8');
            start = Date.now();
            const signature = await libOQSDirectService_1.libOQSDirectService.signData(testData, dsaKeyPair.secretKey);
            results.signing.push(Date.now() - start);
            // Verification
            const verificationKey = libOQSDirectService_1.libOQSDirectService.isDirectLibraryAvailable() ?
                dsaKeyPair.publicKey : dsaKeyPair.secretKey;
            start = Date.now();
            await libOQSDirectService_1.libOQSDirectService.verifySignature(testData, signature, verificationKey);
            results.verification.push(Date.now() - start);
        }
        // Calculate averages
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        console.log(`\n📈 Performance Results (${iterations} iterations):`);
        console.log(`   ML-KEM-768 Key Generation: ${avg(results.kemKeyGen).toFixed(2)}ms avg`);
        console.log(`   ML-DSA-65 Key Generation: ${avg(results.dsaKeyGen).toFixed(2)}ms avg`);
        console.log(`   ML-DSA-65 Signing: ${avg(results.signing).toFixed(2)}ms avg`);
        console.log(`   ML-DSA-65 Verification: ${avg(results.verification).toFixed(2)}ms avg`);
        console.log('✅ Performance benchmark completed');
    }
}
exports.LibOQSDirectTest = LibOQSDirectTest;
// Export for direct execution
if (require.main === module) {
    LibOQSDirectTest.runAllTests()
        .then(() => {
        console.log('\n🎉 All libOQS Direct Service tests completed successfully!');
        return LibOQSDirectTest.runPerformanceBenchmark();
    })
        .then(() => {
        console.log('\n🚀 libOQS Direct Service testing complete!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n💥 Test suite failed:', error);
        process.exit(1);
    });
}
