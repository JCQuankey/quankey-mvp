/**
 * Post-Quantum Cryptography Integration Service
 * Implements real libOQS ML-KEM-768 and ML-DSA-65 algorithms
 * Replaces simulation with NIST FIPS 203/204 compliant implementations
 */

import * as ffi from 'ffi-napi';
import * as ref from 'ref-napi';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

// Type definitions for libOQS FFI
const voidPtr = ref.refType(ref.types.void);
const uint8Ptr = ref.refType(ref.types.uint8);
const size_t = ref.types.size_t;

interface LibOQSInterface {
  // KEM Operations (ML-KEM-768)
  OQS_KEM_new: (algorithm_name: string) => any;
  OQS_KEM_free: (kem: any) => void;
  OQS_KEM_keypair: (kem: any, public_key: Buffer, secret_key: Buffer) => number;
  OQS_KEM_encaps: (kem: any, ciphertext: Buffer, shared_secret: Buffer, public_key: Buffer) => number;
  OQS_KEM_decaps: (kem: any, shared_secret: Buffer, ciphertext: Buffer, secret_key: Buffer) => number;
  
  // Signature Operations (ML-DSA-65)
  OQS_SIG_new: (algorithm_name: string) => any;
  OQS_SIG_free: (sig: any) => void;
  OQS_SIG_keypair: (sig: any, public_key: Buffer, secret_key: Buffer) => number;
  OQS_SIG_sign: (sig: any, signature: Buffer, signature_len: Buffer, message: Buffer, message_len: number, secret_key: Buffer) => number;
  OQS_SIG_verify: (sig: any, message: Buffer, message_len: number, signature: Buffer, signature_len: number, public_key: Buffer) => number;
  
  // Memory allocation helpers
  OQS_MEM_secure_free: (ptr: any, size: number) => void;
}

// Algorithm constants
const ML_KEM_768_PUBLIC_KEY_LENGTH = 1184;
const ML_KEM_768_SECRET_KEY_LENGTH = 2400;
const ML_KEM_768_CIPHERTEXT_LENGTH = 1088;
const ML_KEM_768_SHARED_SECRET_LENGTH = 32;

const ML_DSA_65_PUBLIC_KEY_LENGTH = 1952;
const ML_DSA_65_SECRET_KEY_LENGTH = 4000;
const ML_DSA_65_SIGNATURE_MAX_LENGTH = 3293;

export interface PQCKeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
  algorithm: 'ML-KEM-768' | 'ML-DSA-65';
  created: Date;
  keyId: string;
}

export interface PQCEncapsulation {
  ciphertext: Buffer;
  sharedSecret: Buffer;
  timestamp: Date;
}

export interface PQCSignature {
  signature: Buffer;
  message: Buffer;
  publicKey: Buffer;
  algorithm: 'ML-DSA-65';
  timestamp: Date;
}

export interface PQCPerformanceMetrics {
  operation: string;
  algorithm: string;
  duration: number;
  keySize: number;
  dataSize: number;
  timestamp: Date;
}

/**
 * Post-Quantum Cryptography Integration Service
 * Provides real libOQS implementation for Quankey password manager
 */
export class PQCIntegrationService {
  private liboqs: LibOQSInterface | null = null;
  private isInitialized = false;
  private performanceMetrics: PQCPerformanceMetrics[] = [];
  private readonly maxMetrics = 1000;

  constructor() {
    this.initializeLibOQS();
  }

  /**
   * Initialize libOQS FFI bindings
   */
  private initializeLibOQS(): void {
    try {
      // Dynamic library loading based on platform
      const libraryPath = process.platform === 'win32' ? 'liboqs.dll' : 'liboqs.so';
      
      this.liboqs = ffi.Library(libraryPath, {
        // KEM API
        'OQS_KEM_new': [voidPtr, ['string']],
        'OQS_KEM_free': ['void', [voidPtr]],
        'OQS_KEM_keypair': ['int', [voidPtr, uint8Ptr, uint8Ptr]],
        'OQS_KEM_encaps': ['int', [voidPtr, uint8Ptr, uint8Ptr, uint8Ptr]],
        'OQS_KEM_decaps': ['int', [voidPtr, uint8Ptr, uint8Ptr, uint8Ptr]],
        
        // Signature API
        'OQS_SIG_new': [voidPtr, ['string']],
        'OQS_SIG_free': ['void', [voidPtr]],
        'OQS_SIG_keypair': ['int', [voidPtr, uint8Ptr, uint8Ptr]],
        'OQS_SIG_sign': ['int', [voidPtr, uint8Ptr, ref.refType(size_t), uint8Ptr, size_t, uint8Ptr]],
        'OQS_SIG_verify': ['int', [voidPtr, uint8Ptr, size_t, uint8Ptr, size_t, uint8Ptr]],
        
        // Memory management
        'OQS_MEM_secure_free': ['void', [voidPtr, size_t]]
      });

      this.isInitialized = true;
      console.log('✅ libOQS initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize libOQS:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if libOQS is available and initialized
   */
  public isAvailable(): boolean {
    return this.isInitialized && this.liboqs !== null;
  }

  /**
   * Generate ML-KEM-768 key pair for encryption
   */
  public async generateKEMKeyPair(): Promise<PQCKeyPair> {
    if (!this.isAvailable()) {
      throw new Error('libOQS not available - using simulation fallback');
    }

    const startTime = performance.now();
    
    try {
      const kem = this.liboqs!.OQS_KEM_new('ML-KEM-768');
      if (!kem) {
        throw new Error('Failed to create ML-KEM-768 context');
      }

      const publicKey = Buffer.alloc(ML_KEM_768_PUBLIC_KEY_LENGTH);
      const secretKey = Buffer.alloc(ML_KEM_768_SECRET_KEY_LENGTH);

      const result = this.liboqs!.OQS_KEM_keypair(kem, publicKey, secretKey);
      
      if (result !== 0) {
        throw new Error(`ML-KEM-768 key generation failed with code: ${result}`);
      }

      this.liboqs!.OQS_KEM_free(kem);

      const keyPair: PQCKeyPair = {
        publicKey,
        secretKey,
        algorithm: 'ML-KEM-768',
        created: new Date(),
        keyId: crypto.randomBytes(16).toString('hex')
      };

      // Record performance metrics
      const duration = performance.now() - startTime;
      this.recordMetrics('keypair_generation', 'ML-KEM-768', duration, publicKey.length + secretKey.length, 0);

      console.log(`✅ ML-KEM-768 key pair generated in ${duration.toFixed(2)}ms`);
      return keyPair;

    } catch (error) {
      console.error('❌ ML-KEM-768 key generation failed:', error);
      throw error;
    }
  }

  /**
   * Encapsulate shared secret using ML-KEM-768
   */
  public async encapsulateSecret(publicKey: Buffer): Promise<PQCEncapsulation> {
    if (!this.isAvailable()) {
      throw new Error('libOQS not available - using simulation fallback');
    }

    const startTime = performance.now();

    try {
      const kem = this.liboqs!.OQS_KEM_new('ML-KEM-768');
      if (!kem) {
        throw new Error('Failed to create ML-KEM-768 context');
      }

      const ciphertext = Buffer.alloc(ML_KEM_768_CIPHERTEXT_LENGTH);
      const sharedSecret = Buffer.alloc(ML_KEM_768_SHARED_SECRET_LENGTH);

      const result = this.liboqs!.OQS_KEM_encaps(kem, ciphertext, sharedSecret, publicKey);
      
      if (result !== 0) {
        throw new Error(`ML-KEM-768 encapsulation failed with code: ${result}`);
      }

      this.liboqs!.OQS_KEM_free(kem);

      const encapsulation: PQCEncapsulation = {
        ciphertext,
        sharedSecret,
        timestamp: new Date()
      };

      // Record performance metrics
      const duration = performance.now() - startTime;
      this.recordMetrics('encapsulation', 'ML-KEM-768', duration, publicKey.length, ciphertext.length);

      console.log(`✅ ML-KEM-768 encapsulation completed in ${duration.toFixed(2)}ms`);
      return encapsulation;

    } catch (error) {
      console.error('❌ ML-KEM-768 encapsulation failed:', error);
      throw error;
    }
  }

  /**
   * Decapsulate shared secret using ML-KEM-768
   */
  public async decapsulateSecret(ciphertext: Buffer, secretKey: Buffer): Promise<Buffer> {
    if (!this.isAvailable()) {
      throw new Error('libOQS not available - using simulation fallback');
    }

    const startTime = performance.now();

    try {
      const kem = this.liboqs!.OQS_KEM_new('ML-KEM-768');
      if (!kem) {
        throw new Error('Failed to create ML-KEM-768 context');
      }

      const sharedSecret = Buffer.alloc(ML_KEM_768_SHARED_SECRET_LENGTH);

      const result = this.liboqs!.OQS_KEM_decaps(kem, sharedSecret, ciphertext, secretKey);
      
      if (result !== 0) {
        throw new Error(`ML-KEM-768 decapsulation failed with code: ${result}`);
      }

      this.liboqs!.OQS_KEM_free(kem);

      // Record performance metrics
      const duration = performance.now() - startTime;
      this.recordMetrics('decapsulation', 'ML-KEM-768', duration, secretKey.length, ciphertext.length);

      console.log(`✅ ML-KEM-768 decapsulation completed in ${duration.toFixed(2)}ms`);
      return sharedSecret;

    } catch (error) {
      console.error('❌ ML-KEM-768 decapsulation failed:', error);
      throw error;
    }
  }

  /**
   * Generate ML-DSA-65 key pair for digital signatures
   */
  public async generateSignatureKeyPair(): Promise<PQCKeyPair> {
    if (!this.isAvailable()) {
      throw new Error('libOQS not available - using simulation fallback');
    }

    const startTime = performance.now();

    try {
      const sig = this.liboqs!.OQS_SIG_new('ML-DSA-65');
      if (!sig) {
        throw new Error('Failed to create ML-DSA-65 context');
      }

      const publicKey = Buffer.alloc(ML_DSA_65_PUBLIC_KEY_LENGTH);
      const secretKey = Buffer.alloc(ML_DSA_65_SECRET_KEY_LENGTH);

      const result = this.liboqs!.OQS_SIG_keypair(sig, publicKey, secretKey);
      
      if (result !== 0) {
        throw new Error(`ML-DSA-65 key generation failed with code: ${result}`);
      }

      this.liboqs!.OQS_SIG_free(sig);

      const keyPair: PQCKeyPair = {
        publicKey,
        secretKey,
        algorithm: 'ML-DSA-65',
        created: new Date(),
        keyId: crypto.randomBytes(16).toString('hex')
      };

      // Record performance metrics
      const duration = performance.now() - startTime;
      this.recordMetrics('keypair_generation', 'ML-DSA-65', duration, publicKey.length + secretKey.length, 0);

      console.log(`✅ ML-DSA-65 key pair generated in ${duration.toFixed(2)}ms`);
      return keyPair;

    } catch (error) {
      console.error('❌ ML-DSA-65 key generation failed:', error);
      throw error;
    }
  }

  /**
   * Sign message using ML-DSA-65
   */
  public async signMessage(message: Buffer, secretKey: Buffer): Promise<Buffer> {
    if (!this.isAvailable()) {
      throw new Error('libOQS not available - using simulation fallback');
    }

    const startTime = performance.now();

    try {
      const sig = this.liboqs!.OQS_SIG_new('ML-DSA-65');
      if (!sig) {
        throw new Error('Failed to create ML-DSA-65 context');
      }

      const signature = Buffer.alloc(ML_DSA_65_SIGNATURE_MAX_LENGTH);
      const signatureLength = Buffer.alloc(8); // size_t buffer

      const result = this.liboqs!.OQS_SIG_sign(
        sig, 
        signature, 
        signatureLength, 
        message, 
        message.length, 
        secretKey
      );
      
      if (result !== 0) {
        throw new Error(`ML-DSA-65 signing failed with code: ${result}`);
      }

      this.liboqs!.OQS_SIG_free(sig);

      // Extract actual signature length and trim buffer
      const actualLength = signatureLength.readBigUInt64LE(0);
      const finalSignature = signature.slice(0, Number(actualLength));

      // Record performance metrics
      const duration = performance.now() - startTime;
      this.recordMetrics('signing', 'ML-DSA-65', duration, secretKey.length, message.length);

      console.log(`✅ ML-DSA-65 signature created in ${duration.toFixed(2)}ms`);
      return finalSignature;

    } catch (error) {
      console.error('❌ ML-DSA-65 signing failed:', error);
      throw error;
    }
  }

  /**
   * Verify signature using ML-DSA-65
   */
  public async verifySignature(message: Buffer, signature: Buffer, publicKey: Buffer): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('libOQS not available - using simulation fallback');
    }

    const startTime = performance.now();

    try {
      const sig = this.liboqs!.OQS_SIG_new('ML-DSA-65');
      if (!sig) {
        throw new Error('Failed to create ML-DSA-65 context');
      }

      const result = this.liboqs!.OQS_SIG_verify(
        sig,
        message,
        message.length,
        signature,
        signature.length,
        publicKey
      );

      this.liboqs!.OQS_SIG_free(sig);

      // Record performance metrics
      const duration = performance.now() - startTime;
      this.recordMetrics('verification', 'ML-DSA-65', duration, publicKey.length, message.length);

      const isValid = result === 0;
      console.log(`✅ ML-DSA-65 verification ${isValid ? 'PASSED' : 'FAILED'} in ${duration.toFixed(2)}ms`);
      return isValid;

    } catch (error) {
      console.error('❌ ML-DSA-65 verification failed:', error);
      return false;
    }
  }

  /**
   * Record performance metrics for monitoring
   */
  private recordMetrics(operation: string, algorithm: string, duration: number, keySize: number, dataSize: number): void {
    const metric: PQCPerformanceMetrics = {
      operation,
      algorithm,
      duration,
      keySize,
      dataSize,
      timestamp: new Date()
    };

    this.performanceMetrics.push(metric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  public getPerformanceMetrics(): PQCPerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Get average performance by operation and algorithm
   */
  public getAveragePerformance(operation?: string, algorithm?: string): { [key: string]: number } {
    let filteredMetrics = this.performanceMetrics;

    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === operation);
    }

    if (algorithm) {
      filteredMetrics = filteredMetrics.filter(m => m.algorithm === algorithm);
    }

    if (filteredMetrics.length === 0) {
      return {};
    }

    const avgDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / filteredMetrics.length;
    const avgKeySize = filteredMetrics.reduce((sum, m) => sum + m.keySize, 0) / filteredMetrics.length;
    const avgDataSize = filteredMetrics.reduce((sum, m) => sum + m.dataSize, 0) / filteredMetrics.length;

    return {
      averageDuration: Math.round(avgDuration * 100) / 100,
      averageKeySize: Math.round(avgKeySize),
      averageDataSize: Math.round(avgDataSize),
      sampleCount: filteredMetrics.length
    };
  }

  /**
   * Test all PQC operations for validation
   */
  public async runSelfTest(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      console.log('🧪 Running PQC self-test...');

      // Test ML-KEM-768
      const kemKeyPair = await this.generateKEMKeyPair();
      const encapsulation = await this.encapsulateSecret(kemKeyPair.publicKey);
      const decapsulatedSecret = await this.decapsulateSecret(encapsulation.ciphertext, kemKeyPair.secretKey);
      
      if (!encapsulation.sharedSecret.equals(decapsulatedSecret)) {
        errors.push('ML-KEM-768 encapsulation/decapsulation mismatch');
      }

      // Test ML-DSA-65
      const sigKeyPair = await this.generateSignatureKeyPair();
      const testMessage = Buffer.from('Quankey PQC self-test message', 'utf8');
      const signature = await this.signMessage(testMessage, sigKeyPair.secretKey);
      const isValid = await this.verifySignature(testMessage, signature, sigKeyPair.publicKey);
      
      if (!isValid) {
        errors.push('ML-DSA-65 signature verification failed');
      }

      const success = errors.length === 0;
      console.log(success ? '✅ PQC self-test PASSED' : '❌ PQC self-test FAILED');
      
      return { success, errors };

    } catch (error) {
      errors.push(`Self-test exception: ${error.message}`);
      return { success: false, errors };
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.performanceMetrics = [];
    console.log('🧹 PQC Integration Service cleaned up');
  }
}

// Singleton instance
export const pqcIntegrationService = new PQCIntegrationService();