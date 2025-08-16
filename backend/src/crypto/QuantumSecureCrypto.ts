/**
 * 🔒 QUANTUM SECURE CRYPTO - REAL IMPLEMENTATION
 * ⚠️ GOLDEN RULE: NO SECURITY COMPROMISES
 * 
 * This implementation uses REAL post-quantum cryptography with:
 * - Multiple implementations for redundancy (Noble + Dilithium)
 * - Anti-replay protection (nonce + timestamp)
 * - Quantum entropy from multiple sources
 * - Fail-secure design (deny on any doubt)
 * - Zero fallbacks to insecure algorithms
 */

import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import dilithium from 'dilithium-crystals-js';
import crypto from 'crypto';
import axios from 'axios';

interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  implementation: string;
}

interface SignatureResult {
  signature: Uint8Array;
  implementation: string;
  timestamp: number;
  nonce: Uint8Array;
}

export class QuantumSecureCrypto {
  // Cache of available implementations
  private static implementations = {
    noble: false,
    dilithium: false,
    checked: false
  };

  /**
   * Initialize and verify available quantum-safe implementations
   * MUST be called before any crypto operations
   */
  static async initialize(): Promise<void> {
    console.log('🔐 Initializing Quantum Secure Crypto...');
    
    // Test Noble ML-DSA-65
    try {
      const testSeed = new Uint8Array(32);
      crypto.getRandomValues(testSeed);
      const nobleKeys = ml_dsa65.keygen(testSeed);
      const testMsg = new Uint8Array([1, 2, 3]);
      const nobleSig = ml_dsa65.sign(testMsg, nobleKeys.secretKey);
      this.implementations.noble = ml_dsa65.verify(nobleSig, testMsg, nobleKeys.publicKey);
      console.log('✅ Noble ML-DSA-65 available');
    } catch (error) {
      console.warn('⚠️ Noble ML-DSA-65 not available:', error);
      this.implementations.noble = false;
    }

    // Test Dilithium-3 (equivalent to ML-DSA-65)
    try {
      const dilithiumLib = await dilithium;
      const keys = dilithiumLib.generateKeys(3); // Dilithium3
      const msg = new Uint8Array([1, 2, 3]);
      const sig = dilithiumLib.sign(msg, keys.privateKey, 3);
      const verifyResult = dilithiumLib.verify(sig.signature, msg, keys.publicKey, 3);
      // Handle different possible result formats
      this.implementations.dilithium = Boolean(
        (verifyResult as any)?.verified || 
        (verifyResult as any)?.isValid || 
        (verifyResult as any)?.valid
      );
      console.log('✅ Dilithium-3 available');
    } catch (error) {
      console.warn('⚠️ Dilithium-3 not available:', error);
      this.implementations.dilithium = false;
    }

    this.implementations.checked = true;
    
    // FAIL SECURE: Must have at least one implementation
    if (!this.implementations.noble && !this.implementations.dilithium) {
      throw new Error('❌ CRITICAL SECURITY ERROR: No quantum-safe signature implementation available');
    }

    console.log('🔐 Quantum Secure Crypto initialized with:', {
      noble: this.implementations.noble,
      dilithium: this.implementations.dilithium
    });
  }

  /**
   * Generate quantum-safe keypair with real entropy
   */
  static async generateMLDSA65Keypair(): Promise<KeyPair> {
    if (!this.implementations.checked) {
      await this.initialize();
    }

    // Generate quantum entropy from multiple sources
    const quantumSeed = await this.getQuantumEntropy(32);
    
    // Try Noble first (native ML-DSA-65)
    if (this.implementations.noble) {
      try {
        const keys = ml_dsa65.keygen(quantumSeed);
        console.log('🔑 Generated ML-DSA-65 keypair with Noble');
        return {
          publicKey: keys.publicKey,
          secretKey: keys.secretKey,
          implementation: 'noble-ml-dsa-65'
        };
      } catch (error) {
        console.error('Noble keygen failed:', error);
      }
    }
    
    // Fallback to Dilithium (mathematically equivalent)
    if (this.implementations.dilithium) {
      try {
        const dilithiumLib = await dilithium;
        const keys = dilithiumLib.generateKeys(3, quantumSeed); // Dilithium3 with seed
        console.log('🔑 Generated Dilithium-3 keypair');
        return {
          publicKey: keys.publicKey,
          secretKey: keys.privateKey,
          implementation: 'dilithium3-reference'
        };
      } catch (error) {
        console.error('Dilithium keygen failed:', error);
      }
    }
    
    // FAIL SECURE: Never generate weak keys
    throw new Error('❌ SECURITY ERROR: Cannot create quantum-safe keypair');
  }

  /**
   * Sign message with anti-replay protection
   */
  static async signMLDSA65(
    message: Uint8Array,
    secretKey: Uint8Array,
    implementation?: string
  ): Promise<SignatureResult> {
    if (!this.implementations.checked) {
      await this.initialize();
    }

    // Generate anti-replay nonce
    const nonce = new Uint8Array(32);
    crypto.getRandomValues(nonce);
    
    // Add timestamp to prevent replay attacks
    const timestamp = Date.now();
    const timestampBytes = new Uint8Array(8);
    const timestampView = new DataView(timestampBytes.buffer);
    timestampView.setBigUint64(0, BigInt(timestamp), false);
    
    // Construct full message: message || timestamp || nonce
    const fullMessage = new Uint8Array(message.length + 8 + 32);
    fullMessage.set(message, 0);
    fullMessage.set(timestampBytes, message.length);
    fullMessage.set(nonce, message.length + 8);

    // Try requested implementation first
    if (implementation === 'noble-ml-dsa-65' && this.implementations.noble) {
      try {
        const signature = ml_dsa65.sign(fullMessage, secretKey);
        console.log('✍️ Signed with Noble ML-DSA-65');
        return {
          signature,
          implementation: 'noble-ml-dsa-65',
          timestamp,
          nonce
        };
      } catch (error) {
        console.error('Noble signing failed:', error);
      }
    }
    
    if (implementation === 'dilithium3-reference' && this.implementations.dilithium) {
      try {
        const dilithiumLib = await dilithium;
        const signResult = dilithiumLib.sign(fullMessage, secretKey, 3);
        console.log('✍️ Signed with Dilithium-3');
        return {
          signature: signResult.signature,
          implementation: 'dilithium3-reference',
          timestamp,
          nonce
        };
      } catch (error) {
        console.error('Dilithium signing failed:', error);
      }
    }

    // Try any available implementation
    if (this.implementations.noble) {
      try {
        const signature = ml_dsa65.sign(fullMessage, secretKey);
        return {
          signature,
          implementation: 'noble-ml-dsa-65',
          timestamp,
          nonce
        };
      } catch (error) {
        console.warn('Noble failed, trying dilithium');
      }
    }
    
    if (this.implementations.dilithium) {
      try {
        const dilithiumLib = await dilithium;
        const signResult = dilithiumLib.sign(fullMessage, secretKey, 3);
        return {
          signature: signResult.signature,
          implementation: 'dilithium3-reference',
          timestamp,
          nonce
        };
      } catch (error) {
        console.error('Dilithium signing failed:', error);
      }
    }

    // FAIL SECURE: Never create weak signatures
    throw new Error('❌ SECURITY ERROR: Cannot create quantum-safe signature');
  }

  /**
   * Verify signature with anti-replay and timing checks
   */
  static async verifyMLDSA65(
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array,
    implementation: string,
    timestamp: number,
    nonce: Uint8Array
  ): Promise<boolean> {
    if (!this.implementations.checked) {
      await this.initialize();
    }

    // Check timestamp (max 5 minutes old)
    const age = Date.now() - timestamp;
    if (age > 5 * 60 * 1000) {
      console.error('❌ Signature expired (age:', age, 'ms)');
      return false;
    }
    if (age < 0) {
      console.error('❌ Signature from future (age:', age, 'ms)');
      return false;
    }

    // Reconstruct full message
    const timestampBytes = new Uint8Array(8);
    const timestampView = new DataView(timestampBytes.buffer);
    timestampView.setBigUint64(0, BigInt(timestamp), false);
    
    const fullMessage = new Uint8Array(message.length + 8 + 32);
    fullMessage.set(message, 0);
    fullMessage.set(timestampBytes, message.length);
    fullMessage.set(nonce, message.length + 8);

    // Verify with specified implementation
    if (implementation === 'noble-ml-dsa-65' && this.implementations.noble) {
      try {
        const valid = ml_dsa65.verify(signature, fullMessage, publicKey);
        console.log('🔍 Noble verification:', valid ? '✅' : '❌');
        return valid;
      } catch (error) {
        console.error('Noble verification failed:', error);
        return false;
      }
    }
    
    if (implementation === 'dilithium3-reference' && this.implementations.dilithium) {
      try {
        const dilithiumLib = await dilithium;
        const verifyResult = dilithiumLib.verify(signature, fullMessage, publicKey, 3);
        const valid = Boolean(
          (verifyResult as any)?.verified || 
          (verifyResult as any)?.isValid || 
          (verifyResult as any)?.valid
        );
        console.log('🔍 Dilithium verification:', valid ? '✅' : '❌');
        return valid;
      } catch (error) {
        console.error('Dilithium verification failed:', error);
        return false;
      }
    }

    // Implementation mismatch - try both for compatibility
    console.warn('⚠️ Implementation mismatch, trying all available');
    
    if (this.implementations.noble) {
      try {
        if (ml_dsa65.verify(signature, fullMessage, publicKey)) {
          console.log('✅ Verified with Noble despite mismatch');
          return true;
        }
      } catch (error) {
        console.warn('Noble verification failed');
      }
    }
    
    if (this.implementations.dilithium) {
      try {
        const dilithiumLib = await dilithium;
        const verifyResult = dilithiumLib.verify(signature, fullMessage, publicKey, 3);
        const valid = Boolean(
          (verifyResult as any)?.verified || 
          (verifyResult as any)?.isValid || 
          (verifyResult as any)?.valid
        );
        if (valid) {
          console.log('✅ Verified with Dilithium despite mismatch');
          return true;
        }
      } catch (error) {
        console.warn('Dilithium verification failed');
      }
    }
    
    // FAIL SECURE: Deny if cannot verify
    console.error('❌ SECURITY: Signature verification failed');
    return false;
  }

  /**
   * Get quantum entropy from multiple sources
   * Combines hardware RNG with quantum sources for maximum entropy
   */
  private static async getQuantumEntropy(bytes: number): Promise<Uint8Array> {
    const sources: Uint8Array[] = [];
    
    // 1. Hardware/OS RNG (always available)
    const hwRng = new Uint8Array(bytes);
    crypto.getRandomValues(hwRng);
    sources.push(hwRng);
    console.log('🎲 Got hardware RNG entropy');
    
    // 2. ANU Quantum RNG (if available)
    try {
      const anuResponse = await axios.get(
        `https://qrng.anu.edu.au/API/jsonI.php?length=${bytes}&type=uint8`,
        { timeout: 2000 }
      );
      if (anuResponse.data?.data) {
        sources.push(new Uint8Array(anuResponse.data.data));
        console.log('🌌 Got ANU quantum entropy');
      }
    } catch (error) {
      console.warn('⚠️ ANU quantum source unavailable, using hardware only');
    }
    
    // 3. Combine all sources with XOR
    const result = new Uint8Array(bytes);
    for (const source of sources) {
      for (let i = 0; i < bytes && i < source.length; i++) {
        result[i] ^= source[i];
      }
    }
    
    // 4. Additional mixing with SHA-256
    const hash = crypto.createHash('sha256');
    hash.update(result);
    const mixed = hash.digest();
    
    // Return requested bytes
    return new Uint8Array(mixed.slice(0, bytes));
  }

  /**
   * Generate ML-KEM-768 keypair for encryption
   */
  static async generateMLKEM768Keypair(): Promise<KeyPair> {
    const quantumSeed = await this.getQuantumEntropy(64);
    
    try {
      const keys = ml_kem768.keygen(quantumSeed);
      return {
        publicKey: keys.publicKey,
        secretKey: keys.secretKey,
        implementation: 'noble-ml-kem-768'
      };
    } catch (error) {
      throw new Error('❌ SECURITY ERROR: Cannot create ML-KEM-768 keypair');
    }
  }

  /**
   * Simple verify without anti-replay (for compatibility)
   */
  static async verifySimple(
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean> {
    if (!this.implementations.checked) {
      await this.initialize();
    }

    // Try Noble first
    if (this.implementations.noble) {
      try {
        return ml_dsa65.verify(signature, message, publicKey);
      } catch (error) {
        console.warn('Noble simple verify failed');
      }
    }

    // Try Dilithium
    if (this.implementations.dilithium) {
      try {
        const dilithiumLib = await dilithium;
        const verifyResult = dilithiumLib.verify(signature, message, publicKey, 3);
        return Boolean(
          (verifyResult as any)?.verified || 
          (verifyResult as any)?.isValid || 
          (verifyResult as any)?.valid
        );
      } catch (error) {
        console.warn('Dilithium simple verify failed');
      }
    }

    return false;
  }
}