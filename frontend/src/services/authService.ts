import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

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

export class AuthService {
  
  // Check if user exists
  static async checkUserExists(username: string): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE}/auth/user/${username}/exists`);
      return response.data.exists;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  // Register new user with biometric authentication (hybrid approach)
  static async registerBiometric(username: string, displayName: string): Promise<AuthResponse> {
    try {
      console.log(`🔐 Starting biometric registration for: ${username}`);
      
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        console.log('⚠️ WebAuthn not supported, falling back to simulation');
        return this.simulateBiometricPrompt('register', username, displayName);
      }

      // Try to check if platform authenticator is available
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!available) {
          console.log('⚠️ Platform authenticator not available, falling back to simulation');
          return this.simulateBiometricPrompt('register', username, displayName);
        }
      } catch (error) {
        console.log('⚠️ Could not check authenticator availability, falling back to simulation');
        return this.simulateBiometricPrompt('register', username, displayName);
      }

      // Step 1: Get registration options from server
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

      console.log('📱 Prompting for biometric registration...');

      // Step 2: Try real WebAuthn registration
      try {
        console.log('🔮 Attempting REAL WebAuthn registration...');
        
        // Create credential using real WebAuthn
        const credential = await navigator.credentials.create({
          publicKey: optionsResponse.data.options
        }) as PublicKeyCredential;

        if (!credential) {
          console.log('⚠️ No credential created, falling back to simulation');
          return this.simulateBiometricPrompt('register', username, displayName);
        }

        console.log('✅ Real WebAuthn credential created!');

        // Step 3: Send credential to server for verification
        const verificationResponse = await axios.post(`${API_BASE}/auth/register/complete`, {
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
          console.log('🎉 Real WebAuthn registration successful!');
          return {
            success: true,
            user: verificationResponse.data.user,
            message: 'Real biometric authentication registered successfully'
          };
        } else {
          console.log('⚠️ Server verification failed, falling back to simulation');
          return this.simulateBiometricPrompt('register', username, displayName);
        }
        
      } catch (error: any) {
        console.error('WebAuthn registration error:', error);
        console.log('⚠️ WebAuthn failed, falling back to simulation');
        return this.simulateBiometricPrompt('register', username, displayName);
      }

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Failed to register biometric authentication'
      };
    }
  }

  // Authenticate user with biometric
  static async authenticateBiometric(username?: string): Promise<AuthResponse> {
    try {
      console.log(`🔍 Starting biometric authentication for: ${username || 'any user'}`);
      
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        console.log('⚠️ WebAuthn not supported, falling back to simulation');
        return this.simulateBiometricPrompt('authenticate', username);
      }

      // For now, always use simulation while we test
      return this.simulateBiometricPrompt('authenticate', username);

    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Failed to authenticate with biometrics'
      };
    }
  }

  // Check if biometric authentication is supported
  static async isBiometricSupported(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) {
        console.log('⚠️ WebAuthn not supported');
        return true; // Return true for simulation mode
      }

      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        console.log(`🔍 Platform authenticator available: ${available}`);
        return true; // Always return true since we have simulation fallback
      } catch (error) {
        console.log('⚠️ Error checking biometric support:', error);
        return true; // Return true for simulation mode
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return true; // Return true for simulation mode
    }
  }

  // Get list of registered users (for development)
  static async getUsers(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE}/auth/users`);
      return response.data.users || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Simulate biometric prompt (fallback method)
  private static async simulateBiometricPrompt(
    action: 'register' | 'authenticate', 
    username?: string, 
    displayName?: string
  ): Promise<AuthResponse> {
    const message = action === 'register' 
      ? 'Touch your fingerprint sensor or look at your camera to register'
      : 'Touch your fingerprint sensor or look at your camera to authenticate';
    
    const confirmed = window.confirm(
      `🔐 Biometric ${action}\n\n${message}\n\nNote: Using simulation mode for development.`
    );
    
    if (!confirmed) {
      return {
        success: false,
        error: 'Biometric authentication cancelled'
      };
    }

    try {
      if (action === 'register') {
        // Call the backend to actually register the user
        const response = await axios.post(`${API_BASE}/auth/register/complete`, {
          username,
          displayName,
          response: { 
            id: 'simulated-credential',
            type: 'public-key',
            rawId: 'simulated-raw-id',
            response: {
              clientDataJSON: 'simulated-client-data',
              attestationObject: 'simulated-attestation'
            }
          }
        });

        if (response.data.success) {
          return {
            success: true,
            user: response.data.user,
            message: 'Biometric registration successful (simulated)'
          };
        } else {
          return {
            success: false,
            error: response.data.error || 'Registration failed'
          };
        }

      } else {
        // Authentication
        const response = await axios.post(`${API_BASE}/auth/authenticate/complete`, {
          username,
          response: {
            id: 'simulated-credential',
            type: 'public-key',
            rawId: 'simulated-raw-id',
            response: {
              clientDataJSON: 'simulated-client-data',
              authenticatorData: 'simulated-auth-data',
              signature: 'simulated-signature'
            }
          }
        });

        if (response.data.success) {
          return {
            success: true,
            user: response.data.user,
            message: 'Authentication successful (simulated)'
          };
        } else {
          return {
            success: false,
            error: response.data.error || 'Authentication failed'
          };
        }
      }
    } catch (error) {
      console.error('Simulation error:', error);
      return {
        success: false,
        error: 'Simulated biometric operation failed'
      };
    }
  }
}