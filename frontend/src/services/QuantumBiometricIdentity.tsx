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
  private smartHybrid: SmartHybridQuantumCrypto;

  constructor() {
    this.smartHybrid = new SmartHybridQuantumCrypto();
  }

  async generateZeroKnowledgeBiometricProof(biometricData: BiometricData): Promise<BiometricProof> {
    console.log('🧬 Generating zero-knowledge biometric proof...');
    
    // Generate ML-DSA-65 keys
    const mldsaKeys = await this.smartHybrid.generateMLDSAKeys();
    
    console.log('🔑 MLDSA Keys generated:');
    console.log('  - Public key length:', mldsaKeys.publicKey?.length || 0);
    console.log('  - Secret key length:', mldsaKeys.secretKey?.length || 0);
    console.log('  - Public key present:', !!mldsaKeys.publicKey);
    
    // Convert public key to base64 for transmission
    const devicePublicKeyB64 = Buffer.from(mldsaKeys.publicKey).toString('base64');
    
    console.log('📦 DevicePublicKey base64 length:', devicePublicKeyB64.length);
    console.log('📦 DevicePublicKey preview:', devicePublicKeyB64.substring(0, 50) + '...');
    
    // Create challenge from biometric data
    const challenge = Buffer.from(
      await crypto.subtle.digest('SHA-256', biometricData.publicKey)
    ).toString('base64');
    
    // Sign the challenge with ML-DSA
    const signature = await this.smartHybrid.signWithMLDSA(
      Buffer.from(challenge),
      mldsaKeys.secretKey
    );
    
    const proof: BiometricProof = {
      proof: Buffer.from(signature).toString('base64'),
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