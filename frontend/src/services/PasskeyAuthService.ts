/**
 * 🔐 PASSKEY AUTHENTICATION SERVICE - ARQUITECTURA REALISTA
 * 
 * CORRECCIÓN CRÍTICA:
 * - La biometría AUTORIZA el uso de la clave (NO la deriva)
 * - Cada dispositivo genera su PROPIO par de claves
 * - WebAuthn/Passkeys estándar con biometría obligatoria
 * - NO derivamos nada de datos biométricos crudos
 * 
 * GOLDEN RULE: La huella desbloquea la clave del Secure Enclave
 */

import { 
  startRegistration, 
  startAuthentication,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON 
} from '@simplewebauthn/browser';

export interface PasskeyCredential {
  id: string;
  rawId: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
  type: 'public-key';
}

export interface PasskeyAssertion {
  id: string;
  rawId: string;
  response: {
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    userHandle?: string;
  };
  type: 'public-key';
}

export interface UserIdentity {
  id: string;
  username: string;
  deviceId: string;
  createdAt: Date;
  lastAuth?: Date;
}

export class PasskeyAuthService {
  private static readonly API_BASE = 'https://quankey.xyz/api';
  private static readonly RP_ID = 'quankey.xyz';
  private static readonly RP_NAME = 'Quankey';

  /**
   * 🔐 REGISTER PASSKEY - Biometría obligatoria
   * La clave vive en el Secure Enclave, NO la derivamos
   */
  static async registerPasskey(username: string): Promise<UserIdentity> {
    console.log(`🔐 Registering passkey for: ${username}`);

    try {
      // 1. Check passkey support
      if (!window.PublicKeyCredential) {
        throw new Error('Passkeys not supported on this device');
      }

      // 2. Check platform authenticator (biometric)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error('Platform authenticator (biometric) not available');
      }

      // 3. Get registration options from server
      const optionsResponse = await fetch(`${this.API_BASE}/auth/passkey/register/begin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!optionsResponse.ok) {
        throw new Error(`Registration failed: ${optionsResponse.statusText}`);
      }

      const options: PublicKeyCredentialCreationOptionsJSON = await optionsResponse.json();

      // 4. Create passkey with REQUIRED biometric verification
      const credential = await startRegistration({ optionsJSON: options });

      if (!credential) {
        throw new Error('Passkey registration cancelled or failed');
      }

      // 5. Send credential to server for verification
      const verifyResponse = await fetch(`${this.API_BASE}/auth/passkey/register/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          credential
        })
      });

      if (!verifyResponse.ok) {
        throw new Error(`Passkey verification failed: ${verifyResponse.statusText}`);
      }

      const result = await verifyResponse.json();

      if (!result.success) {
        throw new Error(result.error || 'Passkey registration failed');
      }

      console.log('✅ Passkey registered successfully');

      return {
        id: result.user.id,
        username: result.user.username,
        deviceId: result.user.deviceId,
        createdAt: new Date(result.user.createdAt),
        lastAuth: result.user.lastAuth ? new Date(result.user.lastAuth) : undefined
      };

    } catch (error) {
      console.error('❌ Passkey registration failed:', error);
      throw new Error(`Passkey registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 🔓 AUTHENTICATE WITH PASSKEY - Biometría desbloquea la clave
   */
  static async authenticatePasskey(username?: string): Promise<UserIdentity> {
    console.log(`🔓 Authenticating with passkey: ${username || 'any user'}`);

    try {
      // 1. Get authentication options from server
      const optionsResponse = await fetch(`${this.API_BASE}/auth/passkey/login/begin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!optionsResponse.ok) {
        throw new Error(`Authentication failed: ${optionsResponse.statusText}`);
      }

      const options: PublicKeyCredentialRequestOptionsJSON = await optionsResponse.json();

      // 2. Get assertion with biometric verification
      const assertion = await startAuthentication({ optionsJSON: options });

      if (!assertion) {
        throw new Error('Passkey authentication cancelled or failed');
      }

      // 3. Send assertion to server for verification
      const verifyResponse = await fetch(`${this.API_BASE}/auth/passkey/login/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          assertion
        })
      });

      if (!verifyResponse.ok) {
        throw new Error(`Authentication verification failed: ${verifyResponse.statusText}`);
      }

      const result = await verifyResponse.json();

      if (!result.success) {
        throw new Error(result.error || 'Passkey authentication failed');
      }

      // Store JWT token
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

      console.log('✅ Passkey authentication successful');

      return {
        id: result.user.id,
        username: result.user.username,
        deviceId: result.user.deviceId,
        createdAt: new Date(result.user.createdAt),
        lastAuth: new Date()
      };

    } catch (error) {
      console.error('❌ Passkey authentication failed:', error);
      throw new Error(`Passkey authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 🔍 CHECK PASSKEY CAPABILITY
   */
  static async isPasskeySupported(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) {
        return false;
      }

      // Check platform authenticator (biometric)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        return false;
      }

      // Check conditional UI support (optional)
      const conditionalSupported = false; // Not available in current WebAuthn API

      console.log(`🔍 Passkey support: ${available}, conditional UI: ${conditionalSupported}`);
      
      return available;
    } catch (error) {
      console.error('❌ Error checking passkey support:', error);
      return false;
    }
  }

  /**
   * 🔄 CONDITIONAL AUTHENTICATION (Auto-fill)
   */
  static async authenticateConditional(): Promise<{ success: boolean; user?: UserIdentity; error?: string }> {
    try {
      // Check conditional mediation support
      const supported = await false; // Not available in current WebAuthn API
      if (!supported) {
        throw new Error('Conditional mediation not supported');
      }

      // Get authentication options for conditional UI
      const optionsResponse = await fetch(`${this.API_BASE}/auth/passkey/conditional/begin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get conditional options');
      }

      const options: PublicKeyCredentialRequestOptionsJSON = await optionsResponse.json();

      // Start conditional authentication
      const assertion = await startAuthentication({ optionsJSON: options, useBrowserAutofill: true });

      if (!assertion) {
        throw new Error('Conditional authentication cancelled');
      }

      // Verify assertion
      const verifyResponse = await fetch(`${this.API_BASE}/auth/passkey/conditional/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assertion })
      });

      const result = await verifyResponse.json();

      if (result.success && result.token) {
        localStorage.setItem('auth_token', result.token);
        
        return {
          success: true,
          user: {
            id: result.user.id,
            username: result.user.username,
            deviceId: result.user.deviceId,
            createdAt: new Date(result.user.createdAt),
            lastAuth: new Date()
          }
        };
      }

      return { success: false, error: result.error || 'Conditional authentication failed' };

    } catch (error) {
      console.error('❌ Conditional authentication failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Conditional authentication failed' 
      };
    }
  }

  /**
   * 🚪 LOGOUT
   */
  static async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    console.log('🚪 Logged out successfully');
  }

  /**
   * 🔍 GET CURRENT TOKEN
   */
  static getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * ✅ IS AUTHENTICATED
   */
  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export default PasskeyAuthService;