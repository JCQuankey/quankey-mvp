import { SmartHybridQuantumCrypto } from './SmartHybridQuantumCrypto';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface BiometricData {
  credentialId: string;
  publicKey: ArrayBuffer;
  signature: ArrayBuffer;
}

interface BiometricProof {
  proof: string;
  challenge: string;
  algorithm: 'ML-DSA-65';
  devicePublicKey: string;
}

export class QuantumBiometricIdentity {
  constructor() {
    // SmartHybridQuantumCrypto uses static methods
  }

  // Helper method for browser-compatible base64 encoding
  private uint8ArrayToBase64(arr: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < arr.length; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
  }

  async generateZeroKnowledgeBiometricProof(biometricData: BiometricData): Promise<BiometricProof> {
    console.log('🧬 Generating zero-knowledge biometric proof...');
    
    // Generate ML-DSA-65 keys with random seed
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);
    
    const mldsaKeys = await SmartHybridQuantumCrypto.generateMLDSA65Keypair(seed);
    
    console.log('🔑 MLDSA Keys generated:');
    console.log('  - Public key length:', mldsaKeys.publicKey?.length || 0);
    console.log('  - Secret key length:', mldsaKeys.secretKey?.length || 0);
    console.log('  - Public key present:', !!mldsaKeys.publicKey);
    
    // Convert public key to base64 for transmission (browser compatible)
    const devicePublicKeyB64 = this.uint8ArrayToBase64(mldsaKeys.publicKey);
    
    console.log('📦 DevicePublicKey base64 length:', devicePublicKeyB64.length);
    console.log('📦 DevicePublicKey preview:', devicePublicKeyB64.substring(0, 50) + '...');
    
    // Create challenge from biometric data
    const challengeBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', biometricData.publicKey));
    const challenge = this.uint8ArrayToBase64(challengeBytes);
    
    // Sign the challenge with ML-DSA
    const signature = await SmartHybridQuantumCrypto.signMLDSA65(
      challengeBytes,
      mldsaKeys.secretKey
    );
    
    const proof: BiometricProof = {
      proof: this.uint8ArrayToBase64(signature),
      challenge: challenge,
      algorithm: 'ML-DSA-65' as const,
      devicePublicKey: devicePublicKeyB64  // CRITICAL: Include the public key
    };
    
    console.log('✅ Biometric proof generated with keys:');
    console.log('  - Keys in proof:', Object.keys(proof));
    console.log('  - devicePublicKey in proof:', !!proof.devicePublicKey);
    console.log('  - devicePublicKey length in proof:', proof.devicePublicKey?.length || 0);
    
    return proof;
  }

  async registerWithQuantumBiometric(
    username: string,
    displayName: string,
    biometricData: BiometricData
  ): Promise<any> {
    try {
      console.log('🚀 Starting quantum biometric registration for:', username);
      
      // Generate the biometric proof with device public key
      const biometricProof = await this.generateZeroKnowledgeBiometricProof(biometricData);
      
      console.log('📤 Sending registration request with:');
      console.log('  - username:', username);
      console.log('  - devicePublicKey present:', !!biometricProof.devicePublicKey);
      console.log('  - devicePublicKey length:', biometricProof.devicePublicKey?.length || 0);
      
      // Send registration request with BOTH devicePublicKey at root AND in biometricProof
      const response = await fetch(`${API_BASE}/identity/quantum-biometric/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          displayName,
          devicePublicKey: biometricProof.devicePublicKey, // Include at root level
          biometricProof: biometricProof // Also include complete proof object
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Registration failed:', error);
        throw new Error(`Registration failed: ${error}`);
      }

      const result = await response.json();
      console.log('✅ Quantum biometric registration successful!');
      return result;
      
    } catch (error) {
      console.error('❌ Quantum biometric registration error:', error);
      throw error;
    }
  }
}

export default QuantumBiometricIdentity;