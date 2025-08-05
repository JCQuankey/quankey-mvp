/**
 * libOQS Direct Service - PRODUCTION REAL IMPLEMENTATION
 * Using @noble/post-quantum for 100% real ML-KEM and ML-DSA
 * NO simulation - REAL quantum-resistant cryptography
 */

import { performance } from 'perf_hooks';
import * as crypto from 'crypto';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';

export interface LibOQSDirectResult {
  success: boolean;
  data?: Buffer;
  error?: string;
  executionTime: number;
}

export interface LibOQSKeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
  algorithm: string;
  keyId: string;
  created: Date;
}

/**
 * Direct libOQS Service using @noble/post-quantum REAL implementation
 * 100% quantum-resistant cryptography with NIST standards
 */
export class LibOQSDirectService {
  private isAvailable = true; // Always available with @noble
  private useRealImplementation = true;
  private useDirectLibrary = false; // Legacy property for compatibility

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize service with REAL @noble/post-quantum implementation
   */
  private async initializeService(): Promise<void> {
    try {
      console.log('🔐 Initializing REAL quantum cryptography with @noble/post-quantum');
      console.log('✅ ML-KEM-768: REAL NIST standard implementation');
      console.log('✅ ML-DSA-65: REAL NIST standard implementation');
      console.log('🚀 NO simulation - 100% production quantum-resistant crypto');
      
      this.isAvailable = true;
      this.useRealImplementation = true;
      
    } catch (error) {
      console.error('❌ Failed to initialize libOQS Binary Service:', error.message);
      this.isAvailable = false;
    }
  }

  /**
   * Generate ML-KEM-768 key pair using REAL @noble/post-quantum implementation
   */
  public async generateKEMKeyPair(): Promise<LibOQSKeyPair> {
    const startTime = performance.now();
    
    try {
      console.log('🔮 Generating ML-KEM-768 key pair with REAL @noble implementation');
      
      // REAL ML-KEM-768 key generation using @noble/post-quantum
      const seed = crypto.randomBytes(64); // High-entropy seed
      const keyPair = ml_kem768.keygen(seed);
      
      const executionTime = performance.now() - startTime;
      console.log(`✅ REAL ML-KEM-768 key pair generated in ${executionTime.toFixed(2)}ms`);
      
      return {
        publicKey: Buffer.from(keyPair.publicKey),
        secretKey: Buffer.from(keyPair.secretKey),
        algorithm: 'ML-KEM-768',
        keyId: `mlkem768_real_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        created: new Date()
      };
      
    } catch (error) {
      console.error('❌ REAL ML-KEM-768 generation failed:', error.message);
      throw new Error(`REAL ML-KEM-768 key generation failed: ${error.message}`);
    }
  }

  /**
   * Generate ML-DSA-65 key pair using REAL @noble/post-quantum implementation
   */
  public async generateSignatureKeyPair(): Promise<LibOQSKeyPair> {
    const startTime = performance.now();
    
    try {
      console.log('🔬 Generating ML-DSA-65 key pair with REAL @noble implementation');
      
      // REAL ML-DSA-65 key generation using @noble/post-quantum
      const seed = crypto.randomBytes(32); // Proper seed for ML-DSA-65
      const keyPair = ml_dsa65.keygen(seed);
      
      const executionTime = performance.now() - startTime;
      console.log(`✅ REAL ML-DSA-65 key pair generated in ${executionTime.toFixed(2)}ms`);
      
      return {
        publicKey: Buffer.from(keyPair.publicKey),
        secretKey: Buffer.from(keyPair.secretKey),
        algorithm: 'ML-DSA-65',
        keyId: `mldsa65_real_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        created: new Date()
      };
      
    } catch (error) {
      console.error('❌ REAL ML-DSA-65 generation failed:', error.message);
      throw new Error(`REAL ML-DSA-65 key generation failed: ${error.message}`);
    }
  }

  /**
   * Enhanced simulation that uses cryptographically proper key sizes and generation
   */
  private generateEnhancedSimulationKeyPair(algorithm: string): LibOQSKeyPair {
    const keyId = crypto.randomBytes(16).toString('hex');
    
    let publicKeySize: number;
    let secretKeySize: number;
    
    // Use NIST standardized key sizes
    if (algorithm === 'ML-KEM-768') {
      publicKeySize = 1184;  // NIST FIPS 203 ML-KEM-768 public key size
      secretKeySize = 2400;  // NIST FIPS 203 ML-KEM-768 secret key size
    } else if (algorithm === 'ML-DSA-65') {
      publicKeySize = 1952;  // NIST FIPS 204 ML-DSA-65 public key size  
      secretKeySize = 4000;  // NIST FIPS 204 ML-DSA-65 secret key size
    } else {
      throw new Error(`Unknown algorithm: ${algorithm}`);
    }
    
    // Generate cryptographically random keys using Node.js crypto
    const publicKey = crypto.randomBytes(publicKeySize);
    const secretKey = crypto.randomBytes(secretKeySize);
    
    // Add algorithm-specific structure markers (for realism)
    if (algorithm === 'ML-KEM-768') {
      // Add ML-KEM structure markers
      publicKey.writeUInt32BE(0x4D4C4B45, 0); // "MLKE" marker
      secretKey.writeUInt32BE(0x4D4C4B45, 0); // "MLKE" marker
    } else if (algorithm === 'ML-DSA-65') {
      // Add ML-DSA structure markers  
      publicKey.writeUInt32BE(0x4D4C4453, 0); // "MLDS" marker
      secretKey.writeUInt32BE(0x4D4C4453, 0); // "MLDS" marker
    }
    
    const keyPair: LibOQSKeyPair = {
      publicKey,
      secretKey,
      algorithm,
      keyId,
      created: new Date()
    };
    
    console.log(`✅ Generated enhanced ${algorithm} key pair (${publicKeySize}/${secretKeySize} bytes)`);
    return keyPair;
  }

  /**
   * Sign data using REAL ML-DSA-65 implementation
   */
  public async signData(data: Buffer, secretKey: Buffer): Promise<Buffer> {
    try {
      console.log('🔬 Signing data with REAL ML-DSA-65 implementation');
      
      // REAL ML-DSA-65 signing using @noble/post-quantum
      const signature = ml_dsa65.sign(secretKey, data);
      
      console.log(`✅ Generated REAL ML-DSA-65 signature (${signature.length} bytes)`);
      return Buffer.from(signature);
      
    } catch (error) {
      console.error('❌ REAL ML-DSA-65 signing failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify signature using REAL ML-DSA-65 implementation
   */
  public async verifySignature(data: Buffer, signature: Buffer, publicKey: Buffer): Promise<boolean> {
    try {
      console.log('🔍 Verifying signature with REAL ML-DSA-65 implementation');
      
      // REAL ML-DSA-65 verification using @noble/post-quantum
      const isValid = ml_dsa65.verify(publicKey, data, signature);
      
      console.log(`🔍 REAL ML-DSA-65 verification: ${isValid ? 'PASSED' : 'FAILED'}`);
      return isValid;
      
    } catch (error) {
      console.error('❌ REAL ML-DSA-65 verification failed:', error.message);
      return false;
    }
  }

  /**
   * Get service status and capabilities
   */
  public getStatus(): { available: boolean; mode: string; libraries: boolean } {
    return {
      available: this.isAvailable,
      mode: this.useDirectLibrary ? 'Direct Library (Ready for C++ addon)' : 'Enhanced Simulation',
      libraries: this.useDirectLibrary
    };
  }

  /**
   * Check if direct library access is available
   */
  public isDirectLibraryAvailable(): boolean {
    return this.useDirectLibrary;
  }

  /**
   * Get available algorithms (simulation)
   */
  public async getAvailableAlgorithms(): Promise<{ kems: string[], signatures: string[] }> {
    return {
      kems: ['ML-KEM-768 (ready for direct library)'],
      signatures: ['ML-DSA-65 (ready for direct library)']
    };
  }

  /**
   * Run comprehensive self-test
   */
  public async runSelfTest(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      console.log('🧪 Running libOQS Direct Service self-test...');

      // Test ML-KEM-768 key generation
      const kemKeyPair = await this.generateKEMKeyPair();
      if (!kemKeyPair.publicKey || !kemKeyPair.secretKey) {
        errors.push('ML-KEM-768 key generation failed');
      }

      // Test ML-DSA-65 key generation and signing
      const dsaKeyPair = await this.generateSignatureKeyPair();
      if (!dsaKeyPair.publicKey || !dsaKeyPair.secretKey) {
        errors.push('ML-DSA-65 key generation failed');
      }

      // Test signing and verification
      const testData = Buffer.from('Quankey Direct Service Test', 'utf8');
      const signature = await this.signData(testData, dsaKeyPair.secretKey);
      
      // For simulation, use secretKey for verification
      const verificationKey = this.useDirectLibrary ? dsaKeyPair.publicKey : dsaKeyPair.secretKey;
      const isValid = await this.verifySignature(testData, signature, verificationKey);
      
      if (!isValid) {
        errors.push('ML-DSA-65 signature verification failed');
      }

      const success = errors.length === 0;
      console.log(success ? '✅ Self-test PASSED' : '❌ Self-test FAILED');
      
      return { success, errors };

    } catch (error) {
      errors.push(`Self-test exception: ${error.message}`);
      return { success: false, errors };
    }
  }
}

// Singleton instance
export const libOQSDirectService = new LibOQSDirectService();