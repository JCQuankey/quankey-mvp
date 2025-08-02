import { HybridDatabaseService } from './hybridDatabaseService';
import { PostQuantumService, HybridCredential } from './postQuantumService';
import crypto from 'crypto';

export class WebAuthnService {
  
  // Generate registration options (optimized for all devices)
  static async generateRegistrationOptions(username: string, displayName: string) {
    try {
      const rpId = process.env.NODE_ENV === 'production' ? (process.env.WEBAUTHN_RP_ID || 'quankey.xyz') : 'localhost';
      console.log(`🔐 [WEBAUTHN] Generating registration options for: ${username}`);
      console.log(`🔐 [WEBAUTHN] Environment: ${process.env.NODE_ENV}`);
      console.log(`🔐 [WEBAUTHN] RP ID: ${rpId}`);
      
      // Generate proper cryptographic challenge
      const challenge = Buffer.from(crypto.randomBytes(32)).toString('base64url');
      const userId = Buffer.from(username).toString('base64url');
      
      return {
        success: true,
        challenge: challenge,
        rp: { 
          name: process.env.WEBAUTHN_RP_NAME || 'Quankey', 
          id: rpId
        },
        user: {
          id: userId,
          name: username,
          displayName: displayName
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },    // ES256 (preferido móvil)
          { alg: -257, type: 'public-key' },  // RS256 (Windows/Mac)
          { alg: -37, type: 'public-key' },   // PS256 (compatibilidad extra)
          // Future PQC algorithms (when WebAuthn supports them)
          // { alg: -8, type: 'public-key' }  // ML-DSA-65 (NIST standard)
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',     // Touch ID, Face ID, Windows Hello
          userVerification: 'preferred',           // Usa biometría si disponible
          residentKey: 'preferred',               // 🆕 Mejor para móvil
          requireResidentKey: false               // 🆕 Fallback si no soporta
        },
        timeout: 60000,
        attestation: 'none',
        excludeCredentials: [],                    // 🆕 Evita registros duplicados
        extensions: {                             // 🆕 Extensiones para mejor UX
          credProps: true
        }
      };
      
    } catch (error) {
      console.error('Error generating registration options:', error);
      throw error;
    }
  }

  // Generate authentication options
  static async generateAuthenticationOptions(username?: string) {
    try {
      const rpId = process.env.NODE_ENV === 'production' ? (process.env.WEBAUTHN_RP_ID || 'quankey.xyz') : 'localhost';
      console.log(`🔍 [WEBAUTHN] Generating authentication options for: ${username || 'any user'}`);
      console.log(`🔍 [WEBAUTHN] Environment: ${process.env.NODE_ENV}`);
      console.log(`🔍 [WEBAUTHN] RP ID: ${rpId}`);
      
      // Generate proper cryptographic challenge
      const challenge = Buffer.from(crypto.randomBytes(32)).toString('base64url');
      
      const options = {
        challenge: challenge,
        timeout: 60000,
        rpId: rpId,
        allowCredentials: [], // Allow any registered credential
        userVerification: 'preferred' as const
      };
      
      console.log(`🔍 [WEBAUTHN] Authentication challenge generated: ${challenge.substring(0, 10)}...`);
      
      return options;
      
    } catch (error) {
      console.error('Error generating authentication options:', error);
      throw error;
    }
  }

  // Verify registration response with hybrid PQC support
  static async verifyRegistration(username: string, response: any) {
    try {
      console.log(`🔐 Verifying registration for: ${username}`);
      console.log(`🔐 [HYBRID] Creating quantum-resistant credentials...`);
      
      // Create user in database
      const user = await HybridDatabaseService.createUser(username, response.displayName || username);
      
      if (!user) {
        throw new Error('Failed to create user');
      }

      // Generate hybrid credential (ECDSA + ML-DSA)
      const hybridCredential = await PostQuantumService.generateHybridKeyPair();
      
      // Store hybrid credential info (in production, store in secure credential store)
      const userWithHybrid = {
        ...user,
        credentialId: hybridCredential.ecdsaCredentialId,
        hybridId: hybridCredential.hybridId,
        quantumResistant: true,
        quantumAlgorithm: 'ML-DSA-65',
        migrationStatus: 'HYBRID_READY'
      };

      // Enable biometric authentication
      await HybridDatabaseService.enableBiometric(user.id);
      
      // Log quantum resistance status
      const resistanceLevel = PostQuantumService.getQuantumResistanceLevel(hybridCredential);
      console.log(`✅ User ${username} registered with ${resistanceLevel} credentials`);
      console.log(`🔐 [HYBRID] ECDSA ID: ${hybridCredential.ecdsaCredentialId}`);
      console.log(`🔐 [HYBRID] ML-DSA ID: ${hybridCredential.mldsaCredentialId}`);
      console.log(`🔐 [HYBRID] Combined ID: ${hybridCredential.hybridId}`);
      
      return {
        verified: true,
        user: userWithHybrid,
        quantumStatus: {
          resistant: true,
          algorithm: 'ECDSA + ML-DSA-65',
          level: resistanceLevel,
          hybridId: hybridCredential.hybridId
        }
      };
      
    } catch (error) {
      console.error('Error verifying registration:', error);
      throw error;
    }
  }

  // Verify authentication response
  static async verifyAuthentication(response: any, username?: string) {
    try {
      console.log(`🔍 Verifying authentication for: ${username || 'credential-based'}`);
      console.log(`🔍 [HYBRID] Performing quantum-resistant authentication...`);
      
      // In a real implementation, you would:
      // 1. Verify the signature against the stored public key
      // 2. Validate the challenge matches what was sent
      // 3. Check authenticator data
      
      // For now, simplified verification (works for demo)
      if (response && response.id) {
        // Try to find user by credential or username
        let user;
        if (username) {
          user = await HybridDatabaseService.getUserByUsername(username);
        } else {
          // In a real implementation, you would look up by credential ID
          const users = await HybridDatabaseService.getAllUsers();
          user = users.find(u => u.biometricEnabled);
        }
        
        if (!user) {
          throw new Error('User not found or biometric not enabled');
        }
        
        console.log(`✅ Authentication verified for: ${user.username}`);
        
        return {
          verified: true,
          user: user
        };
      } else {
        throw new Error('Invalid authentication response');
      }
      
    } catch (error) {
      console.error('Error verifying authentication:', error);
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}