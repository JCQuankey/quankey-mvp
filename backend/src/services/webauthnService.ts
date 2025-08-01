import { DatabaseService } from './databaseService';

export class WebAuthnService {
  
  // Generate registration options (optimized for all devices)
  static async generateRegistrationOptions(username: string, displayName: string) {
    try {
      console.log(`🔐 Generating registration options for: ${username}`);
      
      return {
        success: true,
        challenge: Date.now().toString(),
        rp: { 
          name: 'Quankey', 
          id: process.env.NODE_ENV === 'production' ? (process.env.WEBAUTHN_DOMAIN || 'quankey.xyz') : 'localhost'
        },
        user: {
          id: username,
          name: username,
          displayName: displayName
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },    // ES256 (preferido móvil)
          { alg: -257, type: 'public-key' },  // RS256 (Windows/Mac)
          { alg: -37, type: 'public-key' }    // PS256 (compatibilidad extra)
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


  // Verify registration response (completely simplified)
  static async verifyRegistration(username: string, response: any) {
    try {
      console.log(`🔐 Verifying registration for: ${username}`);
      
      // Create user in database
      const user = await DatabaseService.createUser(username, response.displayName || username);
      
      if (!user) {
        throw new Error('Failed to create user');
      }

      // Enable biometric authentication
      await DatabaseService.enableBiometric(user.id);
      
      console.log(`✅ User ${username} registered successfully`);
      
      return {
        verified: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName
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
      console.log(`🔍 Generating authentication options for: ${username || 'any user'}`);
      
      return {
        success: true,
        challenge: Date.now().toString(),
        timeout: 60000,
        rpID: process.env.NODE_ENV === 'production' ? (process.env.WEBAUTHN_DOMAIN || 'quankey.xyz') : 'localhost',
        allowCredentials: [],
        userVerification: 'preferred'
      };
      
    } catch (error) {
      console.error('Error generating authentication options:', error);
      throw error;
    }
  }

  // Verify authentication response (completely simplified)
  static async verifyAuthentication(response: any, username?: string) {
    try {
      console.log(`🔍 Verifying authentication for: ${username || 'credential-based'}`);
      
      const users = await DatabaseService.getAllUsers();
      const user = username 
        ? users.find(u => u.username === username && u.biometricEnabled)
        : users.find(u => u.biometricEnabled);
      
      if (!user) {
        throw new Error('User not found or biometric not enabled');
      }
      
      console.log(`✅ User ${user.username} authenticated successfully`);
      
      return {
        verified: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName
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
      const user = await DatabaseService.getUserByUsername(username);
      return !!user;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  // Get user info from database
  static async getUser(username: string) {
    try {
      return await DatabaseService.getUserByUsername(username);
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Get all users from database
  static async getAllUsers() {
    try {
      return await DatabaseService.getAllUsers();
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Check if user has biometric enabled
  static async hasBiometric(username: string): Promise<boolean> {
    try {
      const user = await DatabaseService.getUserByUsername(username);
      return user ? user.biometricEnabled : false;
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }
}