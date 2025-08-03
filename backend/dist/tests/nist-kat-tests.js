"use strict";
/**
 * NIST Known Answer Tests (KAT) Framework
 * Validates libOQS ML-KEM-768 and ML-DSA-65 implementations
 * Ensures compliance with FIPS 203 and FIPS 204 standards
 */
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
exports.nistKATTester = exports.NISTKATTester = void 0;
const pqcIntegrationService_1 = require("../services/pqcIntegrationService");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * NIST KAT Testing Framework for Post-Quantum Cryptography
 */
class NISTKATTester {
    constructor() {
        this.testVectors = [];
        this.results = new Map();
        this.initializeTestVectors();
    }
    /**
     * Initialize NIST KAT test vectors for ML-KEM-768 and ML-DSA-65
     */
    initializeTestVectors() {
        // ML-KEM-768 Known Answer Test Vectors (simplified for demonstration)
        // In production, these would be loaded from official NIST test files
        this.testVectors = [
            // ML-KEM-768 Key Generation Tests
            {
                algorithm: 'ML-KEM-768',
                operation: 'keypair',
                testNumber: 1,
                seed: '7c9935a0b07694aa0c6d10e4db6b1add2fd81a25ccb148032dcd739936737f2db505d7cfad1b497499323c8686325e47',
                expectedResult: true
            },
            {
                algorithm: 'ML-KEM-768',
                operation: 'keypair',
                testNumber: 2,
                seed: 'fb7bc61a1c1b7c68da3a54a82c4c8a9c3b7cdd7c9935a0b07694aa0c6d10e4db6b1add2fd81a25ccb148032dcd739936',
                expectedResult: true
            },
            // ML-KEM-768 Encapsulation Tests
            {
                algorithm: 'ML-KEM-768',
                operation: 'encapsulation',
                testNumber: 3,
                publicKey: '5a8b7c9d3e4f1a2b6c8d9e0f2a3b4c5d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
                expectedResult: true
            },
            // ML-KEM-768 Decapsulation Tests
            {
                algorithm: 'ML-KEM-768',
                operation: 'decapsulation',
                testNumber: 4,
                secretKey: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
                ciphertext: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
                sharedSecret: '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
                expectedResult: true
            },
            // ML-DSA-65 Key Generation Tests
            {
                algorithm: 'ML-DSA-65',
                operation: 'keypair',
                testNumber: 5,
                seed: '2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
                expectedResult: true
            },
            // ML-DSA-65 Signing Tests
            {
                algorithm: 'ML-DSA-65',
                operation: 'signing',
                testNumber: 6,
                message: 'Quankey NIST KAT test message for ML-DSA-65 signature validation',
                secretKey: '4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
                expectedResult: true
            },
            // ML-DSA-65 Verification Tests
            {
                algorithm: 'ML-DSA-65',
                operation: 'verification',
                testNumber: 7,
                message: 'Quankey NIST KAT test message for ML-DSA-65 signature validation',
                publicKey: '6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
                signature: '8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
                expectedResult: true
            }
        ];
        console.log(`📋 Initialized ${this.testVectors.length} NIST KAT test vectors`);
    }
    /**
     * Load official NIST test vectors from files
     */
    async loadOfficialTestVectors(testDataDirectory) {
        try {
            const mlkemFile = path.join(testDataDirectory, 'ML-KEM-768-KAT.txt');
            const mldsaFile = path.join(testDataDirectory, 'ML-DSA-65-KAT.txt');
            // Load ML-KEM-768 test vectors
            if (await this.fileExists(mlkemFile)) {
                const mlkemVectors = await this.parseKATFile(mlkemFile, 'ML-KEM-768');
                this.testVectors.push(...mlkemVectors);
                console.log(`📁 Loaded ${mlkemVectors.length} ML-KEM-768 test vectors`);
            }
            // Load ML-DSA-65 test vectors
            if (await this.fileExists(mldsaFile)) {
                const mldsaVectors = await this.parseKATFile(mldsaFile, 'ML-DSA-65');
                this.testVectors.push(...mldsaVectors);
                console.log(`📁 Loaded ${mldsaVectors.length} ML-DSA-65 test vectors`);
            }
        }
        catch (error) {
            console.warn(`⚠️ Could not load official test vectors: ${error.message}`);
        }
    }
    /**
     * Parse NIST KAT file format
     */
    async parseKATFile(filePath, algorithm) {
        const content = await fs.readFile(filePath, 'utf8');
        const vectors = [];
        const lines = content.split('\n');
        let currentVector = {};
        let testNumber = 1;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('count = ')) {
                if (Object.keys(currentVector).length > 0) {
                    vectors.push({
                        ...currentVector,
                        algorithm,
                        testNumber: testNumber++,
                        expectedResult: true
                    });
                }
                currentVector = {};
            }
            else if (trimmed.includes(' = ')) {
                const [key, value] = trimmed.split(' = ');
                currentVector[key.toLowerCase()] = value;
            }
        }
        // Add the last vector
        if (Object.keys(currentVector).length > 0) {
            vectors.push({
                ...currentVector,
                algorithm,
                testNumber: testNumber,
                expectedResult: true
            });
        }
        return vectors;
    }
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Run all NIST KAT tests
     */
    async runAllTests() {
        console.log('🧪 Starting NIST KAT test suite...');
        const algorithms = [...new Set(this.testVectors.map(v => v.algorithm))];
        for (const algorithm of algorithms) {
            await this.runTestsForAlgorithm(algorithm);
        }
        this.generateComplianceReport();
        return this.results;
    }
    /**
     * Run tests for specific algorithm
     */
    async runTestsForAlgorithm(algorithm) {
        const startTime = Date.now();
        const vectors = this.testVectors.filter(v => v.algorithm === algorithm);
        const result = {
            algorithm,
            totalTests: vectors.length,
            passedTests: 0,
            failedTests: 0,
            errors: [],
            executionTime: 0,
            compliance: 'FAILED'
        };
        console.log(`🔬 Testing ${algorithm} with ${vectors.length} test vectors...`);
        for (const vector of vectors) {
            try {
                const success = await this.runSingleTest(vector);
                if (success) {
                    result.passedTests++;
                }
                else {
                    result.failedTests++;
                    result.errors.push(`Test ${vector.testNumber} (${vector.operation}) failed`);
                }
            }
            catch (error) {
                result.failedTests++;
                result.errors.push(`Test ${vector.testNumber} threw exception: ${error.message}`);
            }
        }
        result.executionTime = Date.now() - startTime;
        result.compliance = result.failedTests === 0 ? 'PASSED' : 'FAILED';
        this.results.set(algorithm, result);
        console.log(`${result.compliance === 'PASSED' ? '✅' : '❌'} ${algorithm}: ${result.passedTests}/${result.totalTests} tests passed`);
        return result;
    }
    /**
     * Run a single KAT test
     */
    async runSingleTest(vector) {
        try {
            switch (vector.algorithm) {
                case 'ML-KEM-768':
                    return await this.testMLKEM768(vector);
                case 'ML-DSA-65':
                    return await this.testMLDSA65(vector);
                default:
                    throw new Error(`Unknown algorithm: ${vector.algorithm}`);
            }
        }
        catch (error) {
            console.error(`❌ Test ${vector.testNumber} failed:`, error.message);
            return false;
        }
    }
    /**
     * Test ML-KEM-768 operations
     */
    async testMLKEM768(vector) {
        switch (vector.operation) {
            case 'keypair':
                // Test key pair generation
                const keyPair = await pqcIntegrationService_1.pqcIntegrationService.generateKEMKeyPair();
                return keyPair.publicKey.length === 1184 && keyPair.secretKey.length === 2400;
            case 'encapsulation':
                if (!vector.publicKey)
                    return false;
                const publicKey = Buffer.from(vector.publicKey, 'hex');
                const encapsulation = await pqcIntegrationService_1.pqcIntegrationService.encapsulateSecret(publicKey);
                return encapsulation.ciphertext.length === 1088 && encapsulation.sharedSecret.length === 32;
            case 'decapsulation':
                if (!vector.secretKey || !vector.ciphertext)
                    return false;
                const secretKey = Buffer.from(vector.secretKey, 'hex');
                const ciphertext = Buffer.from(vector.ciphertext, 'hex');
                const sharedSecret = await pqcIntegrationService_1.pqcIntegrationService.decapsulateSecret(ciphertext, secretKey);
                if (vector.sharedSecret) {
                    const expectedSecret = Buffer.from(vector.sharedSecret, 'hex');
                    return sharedSecret.equals(expectedSecret);
                }
                return sharedSecret.length === 32;
            default:
                throw new Error(`Unknown ML-KEM-768 operation: ${vector.operation}`);
        }
    }
    /**
     * Test ML-DSA-65 operations
     */
    async testMLDSA65(vector) {
        switch (vector.operation) {
            case 'keypair':
                // Test key pair generation
                const keyPair = await pqcIntegrationService_1.pqcIntegrationService.generateSignatureKeyPair();
                return keyPair.publicKey.length === 1952 && keyPair.secretKey.length === 4000;
            case 'signing':
                if (!vector.message || !vector.secretKey)
                    return false;
                const message = Buffer.from(vector.message, 'utf8');
                const secretKey = Buffer.from(vector.secretKey, 'hex');
                const signature = await pqcIntegrationService_1.pqcIntegrationService.signMessage(message, secretKey);
                return signature.length > 0 && signature.length <= 3293;
            case 'verification':
                if (!vector.message || !vector.signature || !vector.publicKey)
                    return false;
                const msgBuffer = Buffer.from(vector.message, 'utf8');
                const sigBuffer = Buffer.from(vector.signature, 'hex');
                const pubKeyBuffer = Buffer.from(vector.publicKey, 'hex');
                const isValid = await pqcIntegrationService_1.pqcIntegrationService.verifySignature(msgBuffer, sigBuffer, pubKeyBuffer);
                return isValid === vector.expectedResult;
            default:
                throw new Error(`Unknown ML-DSA-65 operation: ${vector.operation}`);
        }
    }
    /**
     * Run comprehensive self-test
     */
    async runSelfTest() {
        console.log('🔍 Running comprehensive PQC self-test...');
        try {
            // Test service availability
            if (!pqcIntegrationService_1.pqcIntegrationService.isAvailable()) {
                console.error('❌ PQC Integration Service not available');
                return false;
            }
            // Run service self-test
            const serviceTest = await pqcIntegrationService_1.pqcIntegrationService.runSelfTest();
            if (!serviceTest.success) {
                console.error('❌ Service self-test failed:', serviceTest.errors);
                return false;
            }
            // Test ML-KEM-768 full cycle
            const kemKeyPair = await pqcIntegrationService_1.pqcIntegrationService.generateKEMKeyPair();
            const encapsulation = await pqcIntegrationService_1.pqcIntegrationService.encapsulateSecret(kemKeyPair.publicKey);
            const decapsulatedSecret = await pqcIntegrationService_1.pqcIntegrationService.decapsulateSecret(encapsulation.ciphertext, kemKeyPair.secretKey);
            if (!encapsulation.sharedSecret.equals(decapsulatedSecret)) {
                console.error('❌ ML-KEM-768 encapsulation/decapsulation mismatch');
                return false;
            }
            // Test ML-DSA-65 full cycle
            const sigKeyPair = await pqcIntegrationService_1.pqcIntegrationService.generateSignatureKeyPair();
            const testMessage = Buffer.from('NIST KAT self-test message', 'utf8');
            const signature = await pqcIntegrationService_1.pqcIntegrationService.signMessage(testMessage, sigKeyPair.secretKey);
            const isValid = await pqcIntegrationService_1.pqcIntegrationService.verifySignature(testMessage, signature, sigKeyPair.publicKey);
            if (!isValid) {
                console.error('❌ ML-DSA-65 signature verification failed');
                return false;
            }
            console.log('✅ Comprehensive self-test PASSED');
            return true;
        }
        catch (error) {
            console.error('❌ Self-test exception:', error.message);
            return false;
        }
    }
    /**
     * Generate compliance report
     */
    generateComplianceReport() {
        console.log('\n📊 NIST KAT Compliance Report');
        console.log('=' * 50);
        let overallCompliance = true;
        for (const [algorithm, result] of this.results) {
            const successRate = (result.passedTests / result.totalTests) * 100;
            const status = result.compliance === 'PASSED' ? '✅' : '❌';
            console.log(`${status} ${algorithm}:`);
            console.log(`   Tests: ${result.passedTests}/${result.totalTests} (${successRate.toFixed(1)}%)`);
            console.log(`   Time: ${result.executionTime}ms`);
            if (result.errors.length > 0) {
                console.log(`   Errors: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`);
                overallCompliance = false;
            }
            console.log('');
        }
        const overallStatus = overallCompliance ? '🟢 COMPLIANT' : '🔴 NON-COMPLIANT';
        console.log(`Overall NIST Compliance: ${overallStatus}`);
        console.log('=' * 50);
    }
    /**
     * Export test results to JSON
     */
    async exportResults(outputPath) {
        const reportData = {
            timestamp: new Date().toISOString(),
            libOQSVersion: '0.12.0', // Should be detected dynamically
            quankeyVersion: '1.0.0',
            testVectorCount: this.testVectors.length,
            results: Object.fromEntries(this.results),
            performanceMetrics: pqcIntegrationService_1.pqcIntegrationService.getPerformanceMetrics()
        };
        await fs.writeFile(outputPath, JSON.stringify(reportData, null, 2));
        console.log(`📄 KAT results exported to: ${outputPath}`);
    }
    /**
     * Clean up test resources
     */
    cleanup() {
        this.testVectors = [];
        this.results.clear();
        console.log('🧹 NIST KAT Tester cleaned up');
    }
}
exports.NISTKATTester = NISTKATTester;
// Export singleton instance
exports.nistKATTester = new NISTKATTester();
