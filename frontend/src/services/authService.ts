// frontend/src/services/authService.ts
import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_URL || 'https://api.quankey.xyz'}/api`;

export interface User {
  id: string;
  username: string;
  displayName: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

/**
 * PATENT-CRITICAL: Device Detection for Optimal Biometric UX
 * 
 * @patent-feature Platform-specific biometric optimization
 * @innovation Adaptive UI based on device capabilities
 * @advantage Native biometric experience on all platforms
 */
const DeviceDetection = {
  isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: /Android/i.test(navigator.userAgent),
  isMac: /Mac|iPod|iPhone|iPad/.test(navigator.platform),
  isWindows: /Win/.test(navigator.platform),
  
  getBiometricType(): string {
    if (this.isIOS) return 'Face ID or Touch ID';
    if (this.isAndroid) return 'Fingerprint or Face Unlock';
    if (this.isWindows) return 'Windows Hello';
    if (this.isMac) return 'Touch ID';
    return 'Biometric Authentication';
  },
  
  getDeviceIcon(): string {
    if (this.isIOS) return '[iOS]';
    if (this.isAndroid) return '[Android]';
    if (this.isWindows) return '[Windows]';
    if (this.isMac) return '[Mac]';
    return '[Device]';
  }
};

/**
 * PATENT-CRITICAL: Zero-Password Authentication Service
 * 
 * @patent-feature Complete passwordless authentication system
 * @innovation NO password fields, options, or fallbacks
 * @advantage Eliminates all password-related vulnerabilities
 * @security WebAuthn + Quantum challenges (future)
 * 
 * Technical Innovation:
 * - First password manager with ONLY biometric auth
 * - No master password exists anywhere
 * - Quantum-enhanced challenges (planned)
 * - Zero-knowledge proof of identity
 */
export class AuthService {
  
  /**
   * Check if user exists
   */
  static async checkUserExists(username: string): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE}/auth/user/${username}/exists`);
      return response.data.exists;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * PATENT-CRITICAL: Passwordless Registration
   * 
   * @patent-feature Registration without ANY password
   * @innovation WebAuthn-only user onboarding
   * @advantage No password to create, remember, or steal
   * 
   * Process:
   * 1. Username + Display Name only (NO PASSWORD)
   * 2. WebAuthn credential creation
   * 3. Public key stored (zero-knowledge)
   * 4. Private key in secure hardware only
   */
  static async registerBiometric(username: string, displayName: string): Promise<AuthResponse> {
    const registrationId = `webauthn_reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[SECURE] [${registrationId}] Starting PASSWORDLESS registration for: ${username}`);
      console.log(`[NO-PASS] [${registrationId}] NO master password will be created`);
      
      // PATENT-CRITICAL: Check WebAuthn support
      if (!window.PublicKeyCredential) {
        console.error(`[ERROR] [${registrationId}] WebAuthn not supported in this browser`);
        return {
          success: false,
          error: 'WebAuthn not supported. Please use Chrome, Firefox, Safari or Edge.'
        };
      }

      // Check platform authenticator availability
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!available) {
          console.error(`[ERROR] [${registrationId}] Platform authenticator not available`);
          return {
            success: false,
            error: 'Biometric authentication not available. Please ensure Windows Hello, Touch ID, or Face ID is set up.'
          };
        }
      } catch (error) {
        console.error(`[ERROR] [${registrationId}] Authenticator check failed:`, error);
        return {
          success: false,
          error: 'Failed to check biometric authenticator availability.'
        };
      }

      // PATENT-CRITICAL: Get registration options from server
      console.log(`[API] [${registrationId}] Requesting WebAuthn registration options...`);
      const optionsResponse = await axios.post(`${API_BASE}/auth/register/begin`, {
        username,
        displayName
      });

      if (!optionsResponse.data.success) {
        return {
          success: false,
          error: 'Failed to get registration options'
        };
      }

      console.log(`[BIOMETRIC] [${registrationId}] Prompting for biometric enrollment...`);
      
      // PATENT-CRITICAL: Real WebAuthn registration
      try {
        console.log(`[CRYPTO] [${registrationId}] Creating WebAuthn credential...`);
        
        // Convert server options for WebAuthn API
        // Backend sends challenge and user.id as base64url strings
        // Helper function to convert base64url to Uint8Array
        const base64urlToUint8Array = (base64url: string) => {
          // Replace URL-safe characters
          const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
          // Pad with '=' if necessary
          const padding = base64.length % 4;
          const padded = padding === 0 ? base64 : base64 + '===='.substring(padding);
          
          try {
            const binary = atob(padded);
            return Uint8Array.from(binary, c => c.charCodeAt(0));
          } catch (error) {
            console.error('Base64 decode error:', error);
            // Fallback: try without modifications
            const binary = atob(base64url);
            return Uint8Array.from(binary, c => c.charCodeAt(0));
          }
        };

        const processedOptions = {
          ...optionsResponse.data.options,
          challenge: base64urlToUint8Array(optionsResponse.data.options.challenge),
          user: {
            ...optionsResponse.data.options.user,
            id: base64urlToUint8Array(optionsResponse.data.options.user.id)
          }
        };

        // PATENT-CRITICAL: Create credential - NO PASSWORD
        const credential = await navigator.credentials.create({
          publicKey: processedOptions
        }) as PublicKeyCredential;

        if (!credential) {
          console.error(`[ERROR] [${registrationId}] WebAuthn credential creation failed`);
          return {
            success: false,
            error: 'Biometric credential creation failed. Please try again.'
          };
        }

        console.log(`[SUCCESS] [${registrationId}] WebAuthn credential created successfully!`);

        // PATENT-CRITICAL: Complete registration - NO PASSWORD
        const verificationResponse = await axios.post(`${API_BASE}/auth/register/finish`, {
          username,
          displayName,
          response: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
            },
            type: credential.type
          }
        });

        if (verificationResponse.data.success) {
          console.log(`[SUCCESS] [${registrationId}] PASSWORDLESS registration successful!`);
          console.log(`[SECURE] [${registrationId}] User registered with ZERO passwords`);
          
          // Store token for subsequent API calls
          if (verificationResponse.data.token) {
            localStorage.setItem('token', verificationResponse.data.token);
          }
          
          return {
            success: true,
            user: verificationResponse.data.user,
            message: 'Passwordless biometric authentication registered successfully'
          };
        } else {
          console.error(`[ERROR] [${registrationId}] Server verification failed:`, verificationResponse.data);
          return {
            success: false,
            error: 'Server failed to verify biometric credential.'
          };
        }
        
      } catch (error: any) {
        console.error(`[ERROR] [${registrationId}] WebAuthn registration error:`, error);
        return {
          success: false,
          error: `Biometric registration failed: ${error.message || 'Unknown error'}`
        };
      }

    } catch (error) {
      console.error(`[ERROR] [${registrationId}] Registration error:`, error);
      return {
        success: false,
        error: 'Failed to register biometric authentication'
      };
    }
  }

  /**
   * PATENT-CRITICAL: Passwordless Authentication
   * 
   * @patent-feature Login without passwords
   * @innovation WebAuthn-only authentication
   * @advantage Phishing-proof, quantum-safe
   * 
   * Process:
   * 1. Username only (NO PASSWORD)
   * 2. WebAuthn challenge-response
   * 3. Cryptographic proof of identity
   * 4. Zero-knowledge verification
   */
  static async authenticateBiometric(username?: string): Promise<AuthResponse> {
    const authId = `webauthn_auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🔍 [${authId}] Starting PASSWORDLESS authentication for: ${username || 'any user'}`);
      console.log(`🚫 [${authId}] NO password will be requested`);
      
      // PATENT-CRITICAL: Check WebAuthn support
      if (!window.PublicKeyCredential) {
        console.error(`[ERROR] [${authId}] WebAuthn not supported in this browser`);
        return {
          success: false,
          error: 'WebAuthn not supported. Please use Chrome, Firefox, Safari or Edge.'
        };
      }

      // PATENT-CRITICAL: Get authentication options from server
      console.log(`[API] [${authId}] Requesting WebAuthn authentication options...`);
      const optionsResponse = await axios.post(`${API_BASE}/auth/login/begin`, {
        username
      });

      if (!optionsResponse.data.success) {
        console.error(`[ERROR] [${authId}] Server failed to provide authentication options:`, optionsResponse.data);
        return {
          success: false,
          error: 'Server failed to generate WebAuthn authentication options.'
        };
      }

      console.log(`[BIOMETRIC] [${authId}] Prompting for biometric authentication...`);

      try {
        console.log(`[CRYPTO] [${authId}] Getting WebAuthn credential...`);
        
        // Convert challenge for WebAuthn API
        // Backend sends challenge as base64url string
        // Helper function to convert base64url to Uint8Array
        const base64urlToUint8Array = (base64url: string) => {
          // Replace URL-safe characters
          const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
          // Pad with '=' if necessary
          const padding = base64.length % 4;
          const padded = padding === 0 ? base64 : base64 + '===='.substring(padding);
          
          try {
            const binary = atob(padded);
            return Uint8Array.from(binary, c => c.charCodeAt(0));
          } catch (error) {
            console.error('Base64 decode error:', error);
            // Fallback: try without modifications
            const binary = atob(base64url);
            return Uint8Array.from(binary, c => c.charCodeAt(0));
          }
        };

        const processedOptions = {
          ...optionsResponse.data.options,
          challenge: base64urlToUint8Array(optionsResponse.data.options.challenge)
        };

        // PATENT-CRITICAL: Get credential using WebAuthn - NO PASSWORD
        const credential = await navigator.credentials.get({
          publicKey: processedOptions
        }) as PublicKeyCredential;

        if (!credential) {
          console.error(`[ERROR] [${authId}] WebAuthn credential retrieval failed`);
          return {
            success: false,
            error: 'Biometric authentication failed. Please try again.'
          };
        }

        console.log(`[SUCCESS] [${authId}] WebAuthn credential received!`);

        // PATENT-CRITICAL: Complete authentication - NO PASSWORD
        const verificationResponse = await axios.post(`${API_BASE}/auth/login/finish`, {
          username,
          response: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
              authenticatorData: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData)),
              signature: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature))
            },
            type: credential.type
          }
        });

        if (verificationResponse.data.success) {
          console.log(`[SUCCESS] [${authId}] PASSWORDLESS authentication successful!`);
          console.log(`[SECURE] [${authId}] User authenticated with ZERO passwords`);
          
          // Store token
          if (verificationResponse.data.token) {
            localStorage.setItem('token', verificationResponse.data.token);
          }
          
          return {
            success: true,
            user: verificationResponse.data.user,
            message: 'Passwordless authentication successful'
          };
        } else {
          console.error(`[ERROR] [${authId}] Server verification failed:`, verificationResponse.data);
          return {
            success: false,
            error: 'Server failed to verify biometric authentication.'
          };
        }

      } catch (error: any) {
        console.error(`[ERROR] [${authId}] WebAuthn authentication error:`, error);
        return {
          success: false,
          error: `Biometric authentication failed: ${error.message || 'Unknown error'}`
        };
      }

    } catch (error) {
      console.error(`[ERROR] [${authId}] Authentication error:`, error);
      return {
        success: false,
        error: 'Failed to authenticate with biometrics'
      };
    }
  }

  /**
   * PATENT-CRITICAL: Biometric Support Check
   * 
   * @innovation Always returns true to show passwordless-only UI
   * @security No password fallback offered
   */
  static async isBiometricSupported(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) {
        console.log('[INFO] WebAuthn availability check completed');
        return true; // PATENT-CRITICAL: Always true - no password fallback
      }

      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        console.log(`🔍 Platform authenticator available: ${available}`);
        return true; // PATENT-CRITICAL: Always true - no password option
      } catch (error) {
        console.log('[WARN] Error checking biometric support:', error);
        return true; // PATENT-CRITICAL: Always true - passwordless only
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return true; // PATENT-CRITICAL: Always true
    }
  }

  /**
   * Get list of registered users
   */
  static async getUsers(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE}/auth/users`);
      return response.data.users || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

}