// frontend/src/components/PasskeyAuth.tsx

import React, { useState, useEffect } from 'react';
import PasskeyAuthService, { UserIdentity } from '../services/PasskeyAuthService';
import QuantumVaultService from '../services/QuantumVaultService';
import DevicePairingService, { PairingQRData } from '../services/DevicePairingService';
import { ToastContainer, useToast } from './ToastNotification';
import { 
  ShieldIcon,
  FingerprintIcon,
  UserIcon,
  DevicesIcon,
  WarningIcon
} from './QuankeyIcons';

/**
 * 🔐 PASSKEY AUTHENTICATION - ARQUITECTURA REALISTA
 * 
 * CORRECCIÓN FUNDAMENTAL:
 * - Passkeys estándar con biometría OBLIGATORIA
 * - La huella AUTORIZA (no deriva) la clave del Secure Enclave
 * - Cada dispositivo genera su propio par PQC para el vault
 * - QR pairing para agregar dispositivos sin recovery codes
 * 
 * NO MÁS:
 * - Derivación de claves desde biometría ❌
 * - "Quantum encryption" de claves públicas ❌
 * - Recovery codes obligatorios ❌
 */

interface PasskeyAuthProps {
  onAuthenticated: (identity: UserIdentity) => void;
  onError: (error: string) => void;
}

export const PasskeyAuth: React.FC<PasskeyAuthProps> = ({ 
  onAuthenticated, 
  onError 
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'check' | 'register' | 'login' | 'pairing' | 'success'>('check');
  const [username, setUsername] = useState<string>('');
  const [pairingQR, setPairingQR] = useState<{ data: PairingQRData; qr: string } | null>(null);
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const { showToast, toasts, removeToast } = useToast();

  useEffect(() => {
    checkPasskeySupport();
  }, []);

  /**
   * 🔍 CHECK PASSKEY SUPPORT
   */
  const checkPasskeySupport = async () => {
    console.log('🔍 Checking passkey support...');
    
    try {
      const supported = await PasskeyAuthService.isPasskeySupported();
      setIsSupported(supported);
      
      if (supported) {
        setStep('register');
        console.log('✅ Passkeys supported - ready for authentication');
      } else {
        console.log('❌ Passkeys not supported on this device');
      }
    } catch (error) {
      console.error('❌ Error checking passkey support:', error);
      setIsSupported(false);
    }
  };

  /**
   * 🔐 REGISTER WITH PASSKEY
   */
  const handlePasskeyRegister = async () => {
    if (!username.trim()) {
      onError('Username is required');
      return;
    }

    setLoading(true);
    console.log(`🔐 Registering passkey for: ${username}`);

    try {
      // 1. Register passkey (biometry authorizes the key)
      const userIdentity = await PasskeyAuthService.registerPasskey(username);
      
      showToast('Passkey registered! Now setting up device encryption...', 'success');

      // 2. Generate device PQC keypair for vault protection
      const device = await QuantumVaultService.registerDevice('Primary Device');
      
      console.log(`✅ Device registered with PQC: ${device.id}`);

      // 3. Complete setup
      setIdentity(userIdentity);
      setStep('success');
      
      setTimeout(() => {
        onAuthenticated(userIdentity);
      }, 2000);

    } catch (error) {
      console.error('❌ Passkey registration failed:', error);
      onError(error instanceof Error ? error.message : 'Passkey registration failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔓 LOGIN WITH PASSKEY
   */
  const handlePasskeyLogin = async () => {
    setLoading(true);
    console.log(`🔓 Logging in with passkey: ${username || 'any user'}`);

    try {
      const userIdentity = await PasskeyAuthService.authenticatePasskey(username);
      
      console.log(`✅ Passkey authentication successful: ${userIdentity.username}`);
      
      setIdentity(userIdentity);
      setStep('success');
      
      setTimeout(() => {
        onAuthenticated(userIdentity);
      }, 1500);

    } catch (error) {
      console.error('❌ Passkey authentication failed:', error);
      onError(error instanceof Error ? error.message : 'Passkey authentication failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 CONDITIONAL AUTHENTICATION (Auto-fill)
   */
  const handleConditionalAuth = async () => {
    setLoading(true);
    
    try {
      const result = await PasskeyAuthService.authenticateConditional();
      
      if (result.success && result.user) {
        console.log(`✅ Conditional authentication successful: ${result.user.username}`);
        onAuthenticated(result.user);
      } else {
        onError(result.error || 'Auto-fill authentication failed');
      }
    } catch (error) {
      console.error('❌ Conditional authentication error:', error);
      onError('Failed to authenticate with auto-fill');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📱 CREATE PAIRING QR
   */
  const handleCreatePairingQR = async () => {
    setLoading(true);
    
    try {
      const qrResult = await DevicePairingService.createPairingQR();
      setPairingQR({ data: qrResult.qrData, qr: qrResult.qrCode });
      setStep('pairing');
      
      showToast('QR code created! Scan with your new device (expires in 90s)', 'info');

      // Monitor pairing progress
      DevicePairingService.monitorPairingProgress(
        qrResult.qrData.token,
        (status, data) => {
          console.log(`Pairing progress: ${status}`, data);
          showToast(`Pairing: ${status}`, 'info');
        },
        (result) => {
          if (result.success) {
            showToast(`Device paired successfully: ${result.deviceName}`, 'success');
            setPairingQR(null);
            setStep('register');
          } else {
            onError(result.error || 'Device pairing failed');
            setPairingQR(null);
            setStep('register');
          }
        }
      );

    } catch (error) {
      console.error('❌ Failed to create pairing QR:', error);
      onError('Failed to create device pairing QR');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🚨 UNSUPPORTED DEVICE UI
   */
  if (!isSupported) {
    return (
      <div className="passkey-auth-container">
        <div className="passkey-auth-card">
          <div className="passkey-auth-header">
            <WarningIcon className="auth-icon auth-icon-warning" />
            <h1>Biometric Authentication Required</h1>
            <p>Quankey requires a device with biometric authentication</p>
          </div>
          
          <div className="unsupported-info">
            <p>Your device needs one of these:</p>
            <ul>
              <li>🔐 Touch ID (Mac, iPhone, iPad)</li>
              <li>👤 Face ID (iPhone, iPad)</li>
              <li>🖥️ Windows Hello (Windows PC)</li>
              <li>📱 Fingerprint sensor (Android)</li>
            </ul>
            <p><strong>No passwords. No exceptions.</strong></p>
          </div>
        </div>

        <style>{`
          .passkey-auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0a1628 0%, #1E3A5F 100%);
            font-family: 'Inter', sans-serif;
            padding: 20px;
          }

          .passkey-auth-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            text-align: center;
          }

          .passkey-auth-header h1 {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 700;
            margin: 15px 0 10px 0;
          }

          .passkey-auth-header p {
            color: #E8E8F0;
            font-size: 16px;
            margin-bottom: 30px;
          }

          .auth-icon {
            width: 48px;
            height: 48px;
            margin-bottom: 20px;
          }

          .auth-icon-warning {
            color: #ed8936;
          }

          .unsupported-info {
            text-align: left;
            background: #f7fafc;
            border-radius: 12px;
            padding: 20px;
          }

          .unsupported-info ul {
            margin: 15px 0;
            padding-left: 20px;
          }

          .unsupported-info li {
            margin: 8px 0;
            color: #E8E8F0;
          }
        `}</style>
      </div>
    );
  }

  /**
   * ✅ SUCCESS STATE
   */
  if (step === 'success' && identity) {
    return (
      <div className="passkey-auth-container">
        <div className="passkey-auth-card">
          <div className="success-content">
            <ShieldIcon className="auth-icon auth-icon-success" />
            <h2>Authentication Successful!</h2>
            <p>Welcome back, {identity.username}</p>
            
            <div className="success-details">
              <div className="success-item">
                <span className="success-label">Method:</span>
                <span className="success-value">Passkey + Biometric</span>
              </div>
              <div className="success-item">
                <span className="success-label">Security:</span>
                <span className="success-value">✅ Quantum Resistant</span>
              </div>
              <div className="success-item">
                <span className="success-label">Device:</span>
                <span className="success-value">{identity.deviceId}</span>
              </div>
            </div>

            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <style>{`
          .success-content {
            text-align: center;
          }

          .success-content h2 {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 700;
            margin: 20px 0 10px 0;
          }

          .success-content p {
            color: #E8E8F0;
            font-size: 16px;
            margin-bottom: 30px;
          }

          .auth-icon-success {
            color: #48bb78;
          }

          .success-details {
            background: #f0fff4;
            border: 1px solid #9ae6b4;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
          }

          .success-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }

          .success-item:last-child {
            margin-bottom: 0;
          }

          .success-label {
            font-weight: 600;
            color: #FFFFFF;
          }

          .success-value {
            color: #38a169;
            font-weight: 500;
          }

          .loading-dots {
            display: flex;
            justify-content: center;
            margin-top: 30px;
          }

          .loading-dots span {
            width: 8px;
            height: 8px;
            background: #48bb78;
            border-radius: 50%;
            margin: 0 4px;
            animation: bounce 1.4s infinite ease-in-out;
          }

          .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
          .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  /**
   * 📱 PAIRING QR STATE
   */
  if (step === 'pairing' && pairingQR) {
    return (
      <div className="passkey-auth-container">
        <div className="passkey-auth-card">
          <div className="pairing-content">
            <DevicesIcon className="auth-icon auth-icon-primary" />
            <h2>Add New Device</h2>
            <p>Scan this QR code with your new device (expires in 90 seconds)</p>
            
            <div className="qr-container">
              <div className="qr-placeholder">
                <p>📱 QR CODE</p>
                <small>{pairingQR.data.token.substring(0, 16)}...</small>
              </div>
            </div>

            <div className="pairing-actions">
              <button 
                onClick={() => { setPairingQR(null); setStep('register'); }}
                className="secondary-button"
              >
                Cancel Pairing
              </button>
            </div>
          </div>
        </div>

        <style>{`
          .pairing-content {
            text-align: center;
          }

          .pairing-content h2 {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 700;
            margin: 20px 0 10px 0;
          }

          .pairing-content p {
            color: #E8E8F0;
            font-size: 16px;
            margin-bottom: 30px;
          }

          .auth-icon-primary {
            color: #00A6FB;
          }

          .qr-container {
            margin: 30px 0;
          }

          .qr-placeholder {
            background: #f7fafc;
            border: 2px dashed #cbd5e0;
            border-radius: 12px;
            padding: 40px;
            color: #E8E8F0;
          }

          .secondary-button {
            background: #f7fafc;
            color: #E8E8F0;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .secondary-button:hover {
            background: #edf2f7;
            border-color: #cbd5e0;
          }
        `}</style>
      </div>
    );
  }

  /**
   * 🔐 MAIN AUTH UI
   */
  return (
    <div className="passkey-auth-container">
      <div className="passkey-auth-card">
        <div className="passkey-auth-header">
          <ShieldIcon className="auth-icon auth-icon-primary" />
          <h1>Quankey - Tu huella es tu acceso</h1>
          <p>Sin passwords. Sin recovery codes. Solo tu biometría.</p>
        </div>

        <div className="auth-form">
          <div className="input-group">
            <UserIcon className="input-icon" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
              onKeyPress={(e) => e.key === 'Enter' && handlePasskeyRegister()}
              autoFocus
            />
          </div>

          <div className="auth-buttons">
            <button 
              onClick={handlePasskeyRegister}
              disabled={loading || !username.trim()}
              className="primary-button"
            >
              {loading ? (
                <div className="loading-content">
                  <div className="spinner"></div>
                  Registering...
                </div>
              ) : (
                <div className="button-content">
                  <FingerprintIcon />
                  Register with Passkey
                </div>
              )}
            </button>

            <button 
              onClick={handlePasskeyLogin}
              disabled={loading}
              className="secondary-button"
            >
              {loading ? 'Authenticating...' : 'Login with Passkey'}
            </button>

            <button 
              onClick={handleConditionalAuth}
              disabled={loading}
              className="tertiary-button"
            >
              🚀 Quick Login (Auto-fill)
            </button>
          </div>

          <div className="pairing-section">
            <button 
              onClick={handleCreatePairingQR}
              disabled={loading}
              className="pairing-button"
            >
              <DevicesIcon />
              Add New Device (QR)
            </button>
          </div>
        </div>

        <div className="auth-info">
          <div className="info-item">
            <span className="info-label">🔐 No Passwords:</span>
            <span className="info-text">Your biometric authorizes the key</span>
          </div>
          <div className="info-item">
            <span className="info-label">🛡️ Quantum Safe:</span>
            <span className="info-text">ML-KEM-768 + ML-DSA-65</span>
          </div>
          <div className="info-item">
            <span className="info-label">📱 Multi-Device:</span>
            <span className="info-text">QR pairing without recovery codes</span>
          </div>
        </div>
      </div>

      <style>{`
        .passkey-auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a1628 0%, #1E3A5F 100%);
          font-family: 'Inter', sans-serif;
          padding: 20px;
        }

        .passkey-auth-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .passkey-auth-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .passkey-auth-header h1 {
          color: #FFFFFF;
          font-size: 24px;
          font-weight: 700;
          margin: 15px 0 10px 0;
        }

        .passkey-auth-header p {
          color: #E8E8F0;
          font-size: 16px;
        }

        .auth-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 20px;
        }

        .auth-icon-primary {
          color: #00A6FB;
        }

        .input-group {
          position: relative;
          margin-bottom: 20px;
        }

        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #a0aec0;
        }

        .auth-input {
          width: 100%;
          padding: 15px 15px 15px 50px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .auth-input:focus {
          border-color: #00A6FB;
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 166, 251, 0.1);
        }

        .auth-buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 30px;
        }

        .primary-button, .secondary-button, .tertiary-button, .pairing-button {
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          padding: 15px 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .primary-button {
          background: linear-gradient(135deg, #00A6FB 0%, #00D4FF 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(0, 166, 251, 0.25);
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 166, 251, 0.35);
          background: linear-gradient(135deg, #0095E8 0%, #00C3ED 100%);
        }

        .secondary-button {
          background: #f7fafc;
          color: #E8E8F0;
          border: 2px solid #e2e8f0;
        }

        .tertiary-button {
          background: linear-gradient(135deg, rgba(0, 166, 251, 0.1), rgba(0, 255, 255, 0.05));
          color: #00a6fb;
          border: 1px solid rgba(0, 166, 251, 0.3);
        }

        .pairing-button {
          background: #f7fafc;
          color: #E8E8F0;
          border: 2px solid #e2e8f0;
          margin-top: 20px;
        }

        .primary-button:disabled, .secondary-button:disabled, .tertiary-button:disabled, .pairing-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .button-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .auth-info {
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          margin-top: 20px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .info-label {
          font-weight: 600;
          color: #FFFFFF;
        }

        .info-text {
          color: #E8E8F0;
        }
      `}</style>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default PasskeyAuth;