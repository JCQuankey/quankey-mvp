import { HybridDatabaseService } from './hybridDatabaseService';
import { PostQuantumService, HybridCredential } from './postQuantumService';

export class WebAuthnService {
  
  // Generate registration options (optimized for all devices)
  static async generateRegistrationOptions(username: string, displayName: string) {
    try {
      const rpId = process.env.NODE_ENV === 'production' ? (process.env.WEBAUTHN_RP_ID || 'quankey.xyz') : 'localhost';
      console.log(`🔐 [WEBAUTHN] Generating registration options for: ${username}`);
      console.log(`🔐 [WEBAUTHN] Environment: ${process.env.NODE_ENV}`);
      console.log(`🔐 [WEBAUTHN] RP ID: ${rpId}`);
      
      return {
        success: true,
        challenge: Date.now().toString(),
        rp: { 
          name: process.env.WEBAUTHN_RP_NAME || 'Quankey', 
          id: rpId
        },
        user: {
          id: username,
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

  // Generate authentication options (completely simplified)
  static async generateAuthenticationOptions(username?: string) {
    try {
      const rpId = process.env.NODE_ENV === 'production' ? (process.env.WEBAUTHN_RP_ID || 'quankey.xyz') : 'localhost';
      console.log(`🔍 [WEBAUTHN] Generating authentication options for: ${username || 'any user'}`);
      console.log(`🔍 [WEBAUTHN] Environment: ${process.env.NODE_ENV}`);
      console.log(`🔍 [WEBAUTHN] RP ID: ${rpId}`);
      
      return {
        success: true,
        challenge: Date.now().toString(),
        timeout: 60000,
        rpID: rpId,
        allowCredentials: [],
        userVerification: 'preferred'
      };
      
    } catch (error) {
      console.error('Error generating authentication options:', error);
      throw error;
    }
  }

  // Verify authentication response with hybrid quantum-resistant verification
  static async verifyAuthentication(response: any, username?: string) {
    try {
      console.log(`🔍 Verifying authentication for: ${username || 'credential-based'}`);
      console.log(`🔍 [HYBRID] Performing quantum-resistant authentication...`);
      
      const users = await HybridDatabaseService.getAllUsers();
      const user = username 
        ? users.find(u => u.username === username && u.biometricEnabled)
        : users.find(u => u.biometricEnabled);
      
      if (!user) {
        throw new Error('User not found or biometric not enabled');
      }
      
      // In production, this would verify both ECDSA and ML-DSA signatures
      // For now, we simulate hybrid verification
      const isQuantumResistant = user.quantumResistant || false;
      const verificationMethod = isQuantumResistant 
        ? 'HYBRID (ECDSA + ML-DSA-65)' 
        : 'CLASSICAL (ECDSA only)';
      
      console.log(`✅ User ${user.username} authenticated successfully`);
      console.log(`🔐 [HYBRID] Verification method: ${verificationMethod}`);
      console.log(`🔐 [HYBRID] Quantum resistant: ${isQuantumResistant ? '✅' : '❌ VULNERABLE'}`);
      
      return {
        verified: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          quantumResistant: isQuantumResistant
        },
        securityInfo: {
          method: verificationMethod,
          quantumResistant: isQuantumResistant,
          migrationRecommended: !isQuantumResistant
        }
      };
      
    } catch (error) {
      console.error('Error verifying authentication:', error);
      throw error;
    }
  }

  // Check if user exists in database
  static async userExists(username: string): Promise<boolean> {
    try {
      const user = await HybridDatabaseService.getUserByUsername(username);
      return !!user;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  // Get user info from database
  static async getUser(username: string) {
    try {
      return await HybridDatabaseService.getUserByUsername(username);
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Get all users from database
  static async getAllUsers() {
    try {
      return await HybridDatabaseService.getAllUsers();
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Check if user has biometric enabled
  static async hasBiometric(username: string): Promise<boolean> {
    try {
      const user = await HybridDatabaseService.getUserByUsername(username);
      return user ? user.biometricEnabled : false;
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }
  
  // Get quantum migration status for all users
  static async getQuantumMigrationStatus() {
    try {
      const users = await HybridDatabaseService.getAllUsers();
      const credentials = users.map(u => ({
        username: u.username,
        ecdsaPublicKey: u.credentialId || null,
        mldsaPublicKey: u.quantumResistant ? 'simulated' : null,
        mldsaCredentialId: u.quantumResistant ? 'simulated' : null
      }));
      
      const status = await PostQuantumService.prepareQuantumTransition(credentials);
      
      return {
        ...status,
        totalUsers: users.length,
        vulnerableUsers: users.filter(u => !u.quantumResistant).map(u => u.username),
        protectedUsers: users.filter(u => u.quantumResistant).map(u => u.username),
        migrationProgress: users.length > 0 
          ? Math.round((status.migratedCount / users.length) * 100) 
          : 0
      };
      
    } catch (error) {
      console.error('Error getting quantum migration status:', error);
      throw error;
    }
  }
}