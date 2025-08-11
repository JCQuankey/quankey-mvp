// frontend/src/components/QuantumBiometricAuth.tsx

import React, { useState, useEffect } from 'react';
import { QuantumBiometricService, QuantumIdentity } from '../services/quantumBiometricService';
import { FingerprintIcon, ShieldIcon, UserIcon, WarningIcon } from './QuankeyIcons';

/**
 * 🔐 QUANTUM BIOMETRIC IDENTITY AUTHENTICATION
 * 
 * REVOLUTIONARY CHANGE: Your body IS your quantum identity
 * - NO passwords, NO recovery codes, NO simulations
 * - ML-KEM-768 keys derived from biometric data
 * - WebAuthn platform authenticator REQUIRED
 * - Zero-knowledge biometric verification
 */

interface QuantumBiometricAuthProps {
  onAuthenticated: (identity: QuantumIdentity) => void;
  onError: (error: string) => void;
}

export const QuantumBiometricAuth: React.FC<QuantumBiometricAuthProps> = ({ 
  onAuthenticated, 
  onError 
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<'register' | 'login'>('login');
  const [username, setUsername] = useState<string>('');
  const [step, setStep] = useState<'username' | 'biometric' | 'success'>('username');
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    checkQuantumBiometricSupport();
  }, []);

  /**
   * 🔍 VERIFY QUANTUM BIOMETRIC CAPABILITY
   * Platform authenticator is MANDATORY - no fallbacks
   */
  const checkQuantumBiometricSupport = async () => {
    console.log('🔍 Checking quantum biometric support...');
    
    try {
      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported');
      }

      // Check platform authenticator availability
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error('Platform authenticator not available');
      }

      setIsSupported(true);
      console.log('✅ Quantum biometric authentication supported');
    } catch (error) {
      console.error('❌ Quantum biometric not supported:', error);
      setIsSupported(false);
      onError('This device does not support biometric authentication. A fingerprint sensor, Face ID, or similar biometric authenticator is required.');
    }
  };

  /**
   * 🔐 REGISTER NEW QUANTUM IDENTITY
   * Creates ML-KEM-768 keys derived from biometric
   */
  const handleRegister = async () => {
    if (!username.trim()) {
      onError('Username is required');
      return;
    }

    setLoading(true);
    setStep('biometric');

    try {
      console.log(`🔐 Registering quantum biometric identity for: ${username}`);
      
      // Generate quantum biometric identity
      const identity = await QuantumBiometricService.registerIdentity(username);
      
      setBiometricType(identity.biometricType);
      setStep('success');
      
      console.log(`✅ Quantum identity created: ${identity.id}`);
      
      setTimeout(() => {
        onAuthenticated(identity);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      setStep('username');
      onError(error instanceof Error ? error.message : 'Biometric registration failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔓 LOGIN WITH QUANTUM BIOMETRIC
   * Verifies identity through zero-knowledge proof
   */
  const handleLogin = async () => {
    if (!username.trim()) {
      onError('Username is required');
      return;
    }

    setLoading(true);
    setStep('biometric');

    try {
      console.log(`🔓 Quantum biometric login for: ${username}`);
      
      // Authenticate with quantum biometric
      const identity = await QuantumBiometricService.authenticateIdentity(username);
      
      setBiometricType(identity.biometricType);
      setStep('success');
      
      console.log(`✅ Quantum authentication successful: ${identity.id}`);
      
      setTimeout(() => {
        onAuthenticated(identity);
      }, 1500);
      
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      setStep('username');
      onError(error instanceof Error ? error.message : 'Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 SWITCH TO MULTI-DEVICE MODE
   * Shows QR code for adding new device
   */
  const handleMultiDevice = () => {
    // TODO: Implement QR bridge in Phase 3
    onError('Multi-device setup coming soon. Use the QR bridge from your registered device.');
  };

  /**
   * 🚨 UNSUPPORTED DEVICE UI
   */
  if (!isSupported) {
    return (
      <div className="quantum-auth-container">
        <div className="quantum-auth-card">
          <div className="quantum-auth-header">
            <WarningIcon className="quantum-icon quantum-icon-warning" />
            <h1>Biometric Required</h1>
            <p>Quankey requires a biometric authenticator (fingerprint, Face ID, etc.)</p>
          </div>
          <div className="quantum-auth-unsupported">
            <p>Your device needs one of these:</p>
            <ul>
              <li>🔐 Fingerprint sensor</li>
              <li>📱 Face ID / Face recognition</li>
              <li>👁️ Windows Hello</li>
              <li>🔒 Hardware security key with biometric</li>
            </ul>
            <p><strong>No passwords. No exceptions.</strong></p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ✅ SUCCESS STATE UI
   */
  if (step === 'success') {
    return (
      <div className="quantum-auth-container">
        <div className="quantum-auth-card">
          <div className="quantum-auth-success">
            <ShieldIcon className="quantum-icon quantum-icon-success" />
            <h2>Quantum Identity {mode === 'register' ? 'Created' : 'Verified'}!</h2>
            <p>Your {biometricType} IS your quantum-encrypted identity.</p>
            <div className="quantum-success-details">
              <div className="quantum-success-item">
                <span className="quantum-success-label">Algorithm:</span>
                <span className="quantum-success-value">ML-KEM-768 + ML-DSA-65</span>
              </div>
              <div className="quantum-success-item">
                <span className="quantum-success-label">Quantum Resistant:</span>
                <span className="quantum-success-value">✅ NIST Approved</span>
              </div>
              <div className="quantum-success-item">
                <span className="quantum-success-label">Recovery:</span>
                <span className="quantum-success-value">Your biometric only</span>
              </div>
            </div>
            <div className="quantum-loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 🔐 BIOMETRIC CAPTURE STATE
   */
  if (step === 'biometric') {
    return (
      <div className="quantum-auth-container">
        <div className="quantum-auth-card">
          <div className="quantum-auth-biometric">
            <FingerprintIcon className="quantum-icon quantum-icon-pulse" />
            <h2>{mode === 'register' ? 'Creating' : 'Verifying'} Quantum Identity</h2>
            <p>Use your biometric authenticator now</p>
            <div className="quantum-biometric-instructions">
              <p>🔐 Place your finger on the sensor</p>
              <p>📱 Look at your camera for Face ID</p>
              <p>🔒 Follow your device's biometric prompt</p>
            </div>
            {loading && (
              <div className="quantum-loading-spinner">
                <div className="quantum-spinner"></div>
                <p>Generating quantum keys from biometric...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /**
   * 👤 USERNAME INPUT STATE
   */
  return (
    <div className="quantum-auth-container">
      <div className="quantum-auth-card">
        <div className="quantum-auth-header">
          <ShieldIcon className="quantum-icon quantum-icon-main" />
          <h1>Quantum Biometric Identity</h1>
          <p>Your body is your password. No passwords to remember or lose.</p>
        </div>

        <div className="quantum-auth-form">
          <div className="quantum-input-group">
            <UserIcon className="quantum-input-icon" />
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="quantum-input"
              onKeyPress={(e) => e.key === 'Enter' && (mode === 'register' ? handleRegister() : handleLogin())}
              autoFocus
            />
          </div>

          <div className="quantum-auth-buttons">
            {mode === 'login' ? (
              <button 
                onClick={handleLogin}
                disabled={loading || !username.trim()}
                className="quantum-button quantum-button-primary"
              >
                {loading ? 'Verifying...' : '🔓 Login with Biometric'}
              </button>
            ) : (
              <button 
                onClick={handleRegister}
                disabled={loading || !username.trim()}
                className="quantum-button quantum-button-primary"
              >
                {loading ? 'Creating...' : '🔐 Create Quantum Identity'}
              </button>
            )}
          </div>

          <div className="quantum-auth-toggle">
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="quantum-button quantum-button-link"
            >
              {mode === 'login' 
                ? "New user? Create quantum identity"
                : "Existing user? Login with biometric"
              }
            </button>
          </div>

          <div className="quantum-auth-multi-device">
            <button 
              onClick={handleMultiDevice}
              className="quantum-button quantum-button-secondary"
            >
              📱 Add New Device (QR Bridge)
            </button>
          </div>
        </div>

        <div className="quantum-auth-info">
          <div className="quantum-info-item">
            <span className="quantum-info-label">🔐 No Passwords:</span>
            <span className="quantum-info-text">Your biometric IS your identity</span>
          </div>
          <div className="quantum-info-item">
            <span className="quantum-info-label">🛡️ Quantum Safe:</span>
            <span className="quantum-info-text">Resistant to quantum computers</span>
          </div>
          <div className="quantum-info-item">
            <span className="quantum-info-label">🔒 Zero Recovery:</span>
            <span className="quantum-info-text">No recovery codes to lose</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .quantum-auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .quantum-auth-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 40px;
          min-width: 400px;
          max-width: 500px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .quantum-auth-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .quantum-auth-header h1 {
          color: #2d3748;
          font-size: 24px;
          font-weight: 700;
          margin: 15px 0 10px 0;
        }

        .quantum-auth-header p {
          color: #4a5568;
          font-size: 16px;
          line-height: 1.5;
        }

        .quantum-icon {
          width: 48px;
          height: 48px;
          color: #667eea;
        }

        .quantum-icon-pulse {
          animation: quantum-pulse 2s infinite;
        }

        .quantum-icon-success {
          color: #48bb78;
        }

        .quantum-icon-warning {
          color: #ed8936;
        }

        @keyframes quantum-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .quantum-input-group {
          position: relative;
          margin-bottom: 20px;
        }

        .quantum-input {
          width: 100%;
          padding: 15px 15px 15px 50px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .quantum-input:focus {
          border-color: #667eea;
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .quantum-input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #a0aec0;
        }

        .quantum-button {
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          padding: 15px 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .quantum-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .quantum-button-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin-bottom: 15px;
        }

        .quantum-button-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .quantum-button-secondary {
          background: #f7fafc;
          color: #4a5568;
          border: 2px solid #e2e8f0;
          margin-top: 15px;
        }

        .quantum-button-link {
          background: none;
          color: #667eea;
          text-decoration: underline;
          padding: 10px;
        }

        .quantum-auth-info {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .quantum-info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .quantum-info-label {
          font-weight: 600;
          color: #2d3748;
        }

        .quantum-info-text {
          color: #4a5568;
        }

        .quantum-success-details {
          background: #f0fff4;
          border: 1px solid #9ae6b4;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }

        .quantum-success-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .quantum-success-label {
          font-weight: 600;
          color: #2d3748;
        }

        .quantum-success-value {
          color: #38a169;
          font-weight: 500;
        }

        .quantum-loading-dots {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .quantum-loading-dots span {
          width: 8px;
          height: 8px;
          background: #667eea;
          border-radius: 50%;
          margin: 0 4px;
          animation: quantum-bounce 1.4s infinite ease-in-out;
        }

        .quantum-loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .quantum-loading-dots span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes quantum-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .quantum-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: quantum-spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes quantum-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .quantum-auth-unsupported ul {
          text-align: left;
          margin: 20px 0;
        }

        .quantum-auth-unsupported li {
          margin: 8px 0;
          color: #4a5568;
        }
      `}</style>
    </div>
  );
};

export default QuantumBiometricAuth;