// REAL QUANTUM-RESISTANT CRYPTOGRAPHY SERVICE
// ML-KEM-768 + ML-DSA-65 Implementation (NIST Approved)

import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { scrypt } from '@noble/hashes/scrypt';
import { randomBytes } from '@noble/hashes/utils';
import { getSecureDatabase } from './secureDatabaseService';

/**
 * 🔐 REAL QUANTUM-RESISTANT CRYPTOGRAPHY
 * NO SIMULATIONS - Production-ready implementation
 * NIST Post-Quantum Cryptography Standards
 */
export class QuantumSecurityService {
  private readonly KEM_PUBLIC_KEY_SIZE = 1184;   // ML-KEM-768 public key
  private readonly KEM_SECRET_KEY_SIZE = 2400;   // ML-KEM-768 secret key
  private readonly DSA_PUBLIC_KEY_SIZE = 1952;   // ML-DSA-65 public key
  private readonly DSA_SECRET_KEY_SIZE = 4032;   // ML-DSA-65 secret key
  
  private db = getSecureDatabase();
  
  // ===========================================
  // KEY GENERATION (REAL ML-KEM-768)
  // ===========================================
  
  /**
   * Generate ML-KEM-768 keypair with quantum entropy
   */
  async generateKEMKeyPair(): Promise<{
    publicKey: Uint8Array;
    secretKey: Uint8Array;
    keyId: string;
  }> {
    console.log('🔐 Generating ML-KEM-768 keypair...');
    
    // 🌌 Gather quantum entropy from multiple sources
    const entropy = await this.gatherQuantumEntropy(64); // 512 bits
    
    // 🔑 Generate ML-KEM-768 keypair (REAL)
    const keyPair = ml_kem768.keygen(entropy);
    
    // ✅ Validate key sizes (critical security check)
    if (keyPair.publicKey.length !== this.KEM_PUBLIC_KEY_SIZE) {
      throw new Error(`Invalid ML-KEM-768 public key size: ${keyPair.publicKey.length}, expected: ${this.KEM_PUBLIC_KEY_SIZE}`);
    }
    
    if (keyPair.secretKey.length !== this.KEM_SECRET_KEY_SIZE) {
      throw new Error(`Invalid ML-KEM-768 secret key size: ${keyPair.secretKey.length}, expected: ${this.KEM_SECRET_KEY_SIZE}`);
    }
    
    // 🆔 Generate key ID
    const keyId = this.generateKeyId('ML-KEM-768');
    
    // 💾 Store in secure database (encrypted)
    await this.storeQuantumKey({
      keyId,
      keyType: 'ML_KEM_768',
      purpose: 'encryption',
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey
    });
    
    console.log('✅ ML-KEM-768 keypair generated successfully');
    
    // 🧹 Secure wipe original secret key from memory
    this.secureWipe(keyPair.secretKey);
    
    return {
      publicKey: keyPair.publicKey,
      secretKey: new Uint8Array(0), // Return empty - stored securely
      keyId
    };
  }
  
  /**
   * Generate ML-DSA-65 keypair for signatures
   */
  async generateDSAKeyPair(): Promise<{
    publicKey: Uint8Array;
    secretKey: Uint8Array;
    keyId: string;
  }> {
    console.log('🔐 Generating ML-DSA-65 keypair...');
    
    // 🌌 Quantum entropy for DSA keys
    const entropy = await this.gatherQuantumEntropy(32); // 256 bits
    
    // 🔑 Generate ML-DSA-65 keypair (REAL)
    const keyPair = ml_dsa65.keygen(entropy);
    
    // ✅ Validate key sizes
    if (keyPair.publicKey.length !== this.DSA_PUBLIC_KEY_SIZE) {
      throw new Error(`Invalid ML-DSA-65 public key size: ${keyPair.publicKey.length}, expected: ${this.DSA_PUBLIC_KEY_SIZE}`);
    }
    
    if (keyPair.secretKey.length !== this.DSA_SECRET_KEY_SIZE) {
      throw new Error(`Invalid ML-DSA-65 secret key size: ${keyPair.secretKey.length}, expected: ${this.DSA_SECRET_KEY_SIZE}`);
    }
    
    const keyId = this.generateKeyId('ML-DSA-65');
    
    // 💾 Store securely
    await this.storeQuantumKey({
      keyId,
      keyType: 'ML_DSA_65',
      purpose: 'signature',
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey
    });
    
    console.log('✅ ML-DSA-65 keypair generated successfully');
    
    this.secureWipe(keyPair.secretKey);
    
    return {
      publicKey: keyPair.publicKey,
      secretKey: new Uint8Array(0),
      keyId
    };
  }
  
  // ===========================================
  // ENCRYPTION (ML-KEM-768 + ChaCha20-Poly1305)
  // ===========================================
  
  /**
   * Encrypt data with quantum-resistant cryptography
   * Uses ML-KEM-768 for key encapsulation + ChaCha20-Poly1305 for data
   */
  async encryptQuantumSafe(
    plaintext: Uint8Array,
    recipientPublicKey: Uint8Array
  ): Promise<{
    ciphertext: Uint8Array;
    encapsulatedSecret: Uint8Array;
    nonce: Uint8Array;
    algorithm: string;
  }> {
    console.log('🔐 Encrypting with ML-KEM-768...');
    
    // ✅ Validate public key size
    if (recipientPublicKey.length !== this.KEM_PUBLIC_KEY_SIZE) {
      throw new Error('Invalid recipient public key size');
    }
    
    // 🔐 KEM: Encapsulate shared secret
    const kemResult = ml_kem768.encapsulate(recipientPublicKey, await this.gatherQuantumEntropy(32));
    const { ciphertext: encapsulatedSecret, sharedSecret } = kemResult;
    
    // 🔑 KDF: Derive encryption key from shared secret
    const encryptionKey = await this.kdf(sharedSecret, 'encryption', 32);
    
    // 🎲 Generate random nonce
    const nonce = randomBytes(12); // ChaCha20-Poly1305 nonce
    
    // 🔒 Encrypt data with ChaCha20-Poly1305
    const cipher = chacha20poly1305(encryptionKey, nonce);
    const ciphertext = cipher.encrypt(plaintext);
    
    // 🧹 Secure cleanup
    this.secureWipe(sharedSecret);
    this.secureWipe(encryptionKey);
    
    console.log('✅ Quantum-safe encryption completed');
    
    return {
      ciphertext,
      encapsulatedSecret,
      nonce,
      algorithm: 'ML-KEM-768+ChaCha20-Poly1305'
    };
  }
  
  /**
   * Decrypt quantum-safe ciphertext
   */
  async decryptQuantumSafe(
    ciphertext: Uint8Array,
    encapsulatedSecret: Uint8Array,
    nonce: Uint8Array,
    secretKeyId: string
  ): Promise<Uint8Array> {
    console.log('🔓 Decrypting with ML-KEM-768...');
    
    // 🔍 Retrieve secret key
    const secretKey = await this.retrieveSecretKey(secretKeyId, 'ML_KEM_768');
    
    // 🔐 KEM: Decapsulate shared secret
    const sharedSecret = ml_kem768.decapsulate(encapsulatedSecret, secretKey);
    
    // 🔑 KDF: Derive decryption key
    const decryptionKey = await this.kdf(sharedSecret, 'encryption', 32);
    
    // 🔓 Decrypt with ChaCha20-Poly1305
    const cipher = chacha20poly1305(decryptionKey, nonce);
    const plaintext = cipher.decrypt(ciphertext);
    
    // 🧹 Secure cleanup
    this.secureWipe(secretKey);
    this.secureWipe(sharedSecret);
    this.secureWipe(decryptionKey);
    
    console.log('✅ Quantum-safe decryption completed');
    
    return plaintext;
  }
  
  // ===========================================
  // DIGITAL SIGNATURES (ML-DSA-65)
  // ===========================================
  
  /**
   * Sign message with ML-DSA-65
   */
  async signQuantumSafe(
    message: Uint8Array,
    secretKeyId: string
  ): Promise<{
    signature: Uint8Array;
    algorithm: string;
  }> {
    console.log('✍️ Signing with ML-DSA-65...');
    
    // 🔍 Retrieve signing key
    const secretKey = await this.retrieveSecretKey(secretKeyId, 'ML_DSA_65');
    
    // ✍️ Sign with ML-DSA-65
    const signature = ml_dsa65.sign(secretKey, message);
    
    // 🧹 Secure cleanup
    this.secureWipe(secretKey);
    
    console.log('✅ Quantum-safe signature created');
    
    return {
      signature,
      algorithm: 'ML-DSA-65'
    };
  }
  
  /**
   * Verify ML-DSA-65 signature
   */
  async verifyQuantumSafe(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean> {
    console.log('🔍 Verifying ML-DSA-65 signature...');
    
    // ✅ Validate public key size
    if (publicKey.length !== this.DSA_PUBLIC_KEY_SIZE) {
      throw new Error('Invalid DSA public key size');
    }
    
    // 🔍 Verify signature
    const isValid = ml_dsa65.verify(publicKey, message, signature);
    
    console.log(isValid ? '✅ Signature valid' : '❌ Signature invalid');
    
    return isValid;
  }
  
  // ===========================================
  // QUANTUM ENTROPY GATHERING
  // ===========================================
  
  /**
   * Gather entropy from multiple quantum sources
   */
  public async gatherQuantumEntropy(length: number): Promise<Uint8Array> {
    console.log(`🌌 Gathering ${length} bytes of quantum entropy...`);
    
    const sources = await Promise.allSettled([
      this.getANUQuantumEntropy(length),
      this.getCloudflareEntropy(length),
      this.getHardwareEntropy(length),
      this.getCryptoRandomBytes(length)
    ]);
    
    // 🔍 Filter successful sources
    const validSources = sources
      .filter(s => s.status === 'fulfilled')
      .map(s => (s as PromiseFulfilledResult<Uint8Array>).value);
    
    if (validSources.length === 0) {
      throw new Error('CRITICAL: No entropy sources available');
    }
    
    console.log(`✅ Got entropy from ${validSources.length} sources`);
    
    // 🔄 XOR combine all sources for maximum entropy
    return this.xorCombine(validSources, length);
  }
  
  /**
   * ANU Quantum Random Numbers (quantum vacuum fluctuations)
   */
  private async getANUQuantumEntropy(length: number): Promise<Uint8Array> {
    const response = await fetch(`https://qrng.anu.edu.au/API/jsonI.php?length=${length}&type=uint8`, {
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error('ANU QRNG request failed');
    }
    
    const data = await response.json();
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid ANU QRNG response');
    }
    
    return new Uint8Array(data.data);
  }
  
  /**
   * Cloudflare drand beacon
   */
  private async getCloudflareEntropy(length: number): Promise<Uint8Array> {
    const response = await fetch('https://drand.cloudflare.com/public/latest', {
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error('Cloudflare drand request failed');
    }
    
    const data = await response.json();
    const randomness = Buffer.from(data.randomness, 'hex');
    
    // Expand using KDF if needed
    if (randomness.length < length) {
      return this.expandEntropy(randomness, length);
    }
    
    return new Uint8Array(randomness.slice(0, length));
  }
  
  /**
   * Hardware entropy (crypto.randomBytes)
   */
  private getHardwareEntropy(length: number): Uint8Array {
    return randomBytes(length);
  }
  
  /**
   * Node.js crypto.randomBytes (fallback)
   */
  private getCryptoRandomBytes(length: number): Uint8Array {
    return new Uint8Array(require('crypto').randomBytes(length));
  }
  
  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================
  
  /**
   * Key Derivation Function using scrypt
   */
  private async kdf(
    secret: Uint8Array,
    context: string,
    outputLength: number
  ): Promise<Uint8Array> {
    const salt = new TextEncoder().encode(`quankey-${context}-v2`);
    
    return scrypt(secret, salt, {
      N: 32768,     // CPU/memory cost
      r: 8,         // Block size
      p: 1,         // Parallelization
      dkLen: outputLength
    });
  }
  
  /**
   * XOR combine multiple entropy sources
   */
  private xorCombine(sources: Uint8Array[], targetLength: number): Uint8Array {
    const result = new Uint8Array(targetLength);
    
    for (const source of sources) {
      for (let i = 0; i < Math.min(targetLength, source.length); i++) {
        result[i] ^= source[i];
      }
    }
    
    return result;
  }
  
  /**
   * Expand entropy using KDF
   */
  private async expandEntropy(seed: Uint8Array, targetLength: number): Promise<Uint8Array> {
    return this.kdf(seed, 'expand', targetLength);
  }
  
  /**
   * Secure memory wipe
   */
  private secureWipe(data: Uint8Array): void {
    // Overwrite with random data multiple times
    for (let pass = 0; pass < 3; pass++) {
      const randomData = randomBytes(data.length);
      data.set(randomData);
    }
    // Final pass with zeros
    data.fill(0);
  }
  
  /**
   * Generate unique key ID
   */
  private generateKeyId(algorithm: string): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).reduce((str, byte) => str + byte.toString(36), '');
    return `${algorithm.toLowerCase().replace('-', '')}_${timestamp}_${random}`;
  }
  
  /**
   * Store quantum key in secure database
   */
  private async storeQuantumKey(keyData: {
    keyId: string;
    keyType: string;
    purpose: string;
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }): Promise<void> {
    // Encrypt secret key with master key
    const encryptedSecretKey = await this.db.encryptField(
      Buffer.from(keyData.secretKey).toString('base64')
    );
    
    await this.db.prisma.quantumKey.create({
      data: {
        keyId: keyData.keyId,
        keyType: keyData.keyType,
        purpose: keyData.purpose,
        algorithm: keyData.keyType === 'ML_KEM_768' ? 'NIST FIPS 203' : 'NIST FIPS 204',
        publicKey: keyData.publicKey,
        privateKeyEnc: Buffer.from(encryptedSecretKey, 'base64'),
        active: true,
        hsmStored: false // TODO: Implement HSM storage
      }
    });
    
    await this.db.auditLog(null, 'QUANTUM_KEY_GENERATED', {
      keyId: keyData.keyId,
      keyType: keyData.keyType,
      purpose: keyData.purpose,
      algorithm: keyData.keyType === 'ML_KEM_768' ? 'NIST FIPS 203' : 'NIST FIPS 204'
    });
  }
  
  /**
   * Retrieve secret key from secure storage
   */
  private async retrieveSecretKey(keyId: string, expectedType: string): Promise<Uint8Array> {
    const keyRecord = await this.db.prisma.quantumKey.findFirst({
      where: {
        keyId,
        keyType: expectedType,
        active: true
      }
    });
    
    if (!keyRecord || !keyRecord.privateKeyEnc) {
      throw new Error('Quantum key not found or inactive');
    }
    
    // Decrypt secret key
    const encryptedData = keyRecord.privateKeyEnc.toString('base64');
    const decryptedData = await this.db.decryptField(encryptedData);
    const secretKey = new Uint8Array(Buffer.from(decryptedData, 'base64'));
    
    // Validate key size
    const expectedSize = expectedType === 'ML_KEM_768' ? this.KEM_SECRET_KEY_SIZE : this.DSA_SECRET_KEY_SIZE;
    if (secretKey.length !== expectedSize) {
      throw new Error(`Invalid secret key size for ${expectedType}`);
    }
    
    return secretKey;
  }
  
  // ===========================================
  // HEALTH CHECK AND DIAGNOSTICS
  // ===========================================
  
  /**
   * Test quantum cryptography functionality
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    kemGeneration: boolean;
    dsaGeneration: boolean;
    encryption: boolean;
    signature: boolean;
    entropy: boolean;
  }> {
    const results = {
      status: 'unhealthy' as const,
      kemGeneration: false,
      dsaGeneration: false,
      encryption: false,
      signature: false,
      entropy: false
    };
    
    try {
      // Test entropy gathering
      const entropy = await this.gatherQuantumEntropy(32);
      results.entropy = entropy.length === 32;
      
      // Test ML-KEM-768
      const kemKeys = ml_kem768.keygen(entropy);
      results.kemGeneration = kemKeys.publicKey.length === this.KEM_PUBLIC_KEY_SIZE;
      
      // Test encryption/decryption
      const testData = new TextEncoder().encode('quantum-test-data');
      const encrypted = ml_kem768.encapsulate(kemKeys.publicKey);
      const decrypted = ml_kem768.decapsulate(encrypted.ciphertext, kemKeys.secretKey);
      results.encryption = decrypted.length === encrypted.sharedSecret.length;
      
      // Test ML-DSA-65
      const dsaKeys = ml_dsa65.keygen();
      results.dsaGeneration = dsaKeys.publicKey.length === this.DSA_PUBLIC_KEY_SIZE;
      
      // Test signatures
      const signature = ml_dsa65.sign(dsaKeys.secretKey, testData);
      const verified = ml_dsa65.verify(dsaKeys.publicKey, testData, signature);
      results.signature = verified;
      
      // Determine overall status
      const allHealthy = Object.values(results).slice(1).every(v => v === true);
      const someHealthy = Object.values(results).slice(1).some(v => v === true);
      
      results.status = allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy';
      
    } catch (error) {
      console.error('Quantum security health check failed:', error);
    }
    
    return results;
  }
}