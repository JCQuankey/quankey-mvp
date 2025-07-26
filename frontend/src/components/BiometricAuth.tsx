import React, { useState, useEffect } from 'react';
import { AuthService, User } from '../services/authService';

interface BiometricAuthProps {
  onAuthenticated: (user: User) => void;
  onError: (error: string) => void;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({ onAuthenticated, onError }) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [existingUsers, setExistingUsers] = useState<any[]>([]);

  useEffect(() => {
    checkBiometricSupport();
    loadExistingUsers();
  }, []);

  const checkBiometricSupport = async () => {
    const supported = await AuthService.isBiometricSupported();
    setIsSupported(supported);
  };

  const loadExistingUsers = async () => {
    const users = await AuthService.getUsers();
    setExistingUsers(users);
  };

  const handleBiometricRegister = async () => {
    if (!username.trim() || !displayName.trim()) {
      onError('Please enter both username and display name');
      return;
    }

    setLoading(true);
    
    try {
      // Check if user already exists
      const exists = await AuthService.checkUserExists(username);
      if (exists) {
        onError('Username already exists. Please choose a different username or login instead.');
        setLoading(false);
        return;
      }

      // Show biometric prompt - now handled internally by AuthService
      const result = await AuthService.registerBiometric(username, displayName);
      
      if (result.success && result.user) {
        onAuthenticated(result.user);
        await loadExistingUsers(); // Refresh user list
      } else {
        onError(result.error || 'Registration failed');
      }
    } catch (error) {
      onError('Failed to register biometric authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async (selectedUsername?: string) => {
    setLoading(true);
    
    try {
      // Show biometric prompt - now handled internally by AuthService
      const result = await AuthService.authenticateBiometric(selectedUsername);
      
      if (result.success && result.user) {
        onAuthenticated(result.user);
      } else {
        onError(result.error || 'Authentication failed');
      }
    } catch (error) {
      onError('Failed to authenticate with biometrics');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center">
        <div className="quantum-indicator" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)'}}>
          <span style={{color: '#ef4444', fontSize: '14px'}}>
            ⚠️ Biometric authentication not supported on this device
          </span>
        </div>
        <p style={{color: '#64748b', fontSize: '14px', marginTop: '16px'}}>
          This is a demo - in production, biometric auth would work on supported devices
        </p>
      </div>
    );
  }

  return (
    <div style={{marginBottom: '32px'}}>
      <div className="text-center" style={{marginBottom: '24px'}}>
        <h3 style={{color: '#f1f5f9', fontSize: '20px', fontWeight: '600', marginBottom: '8px'}}>
          🔐 Biometric Authentication
        </h3>
        <p style={{color: '#94a3b8', fontSize: '14px'}}>
          Secure access with your fingerprint or face
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="text-center" style={{marginBottom: '24px'}}>
        <div style={{display: 'inline-flex', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
          <button
            onClick={() => setMode('login')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: mode === 'login' ? '#3b82f6' : 'transparent',
              color: mode === 'login' ? 'white' : '#94a3b8',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: mode === 'register' ? '#3b82f6' : 'transparent',
              color: mode === 'register' ? 'white' : '#94a3b8',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Register
          </button>
        </div>
      </div>

      {mode === 'register' ? (
        /* Registration Form */
        <div>
          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '8px'}}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '8px'}}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your full name"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>
          <button
            onClick={handleBiometricRegister}
            disabled={loading}
            className="btn-quantum"
            style={{width: '100%'}}
          >
            {loading ? (
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div className="loading-spinner"></div>
                Registering Biometric...
              </div>
            ) : (
              '👆 Register with Biometric'
            )}
          </button>
        </div>
      ) : (
        /* Login Options */
        <div>
          {existingUsers.length > 0 && (
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '12px'}}>
                Select existing user:
              </label>
              {existingUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleBiometricLogin(user.username)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.5)'}
                >
                  👤 {user.displayName} ({user.username})
                  {user.biometricEnabled && <span style={{color: '#4ade80', marginLeft: '8px'}}>🔐</span>}
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => handleBiometricLogin()}
            disabled={loading}
            className="btn-quantum"
            style={{width: '100%'}}
          >
            {loading ? (
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div className="loading-spinner"></div>
                Authenticating...
              </div>
            ) : (
              '🔓 Authenticate with Biometric'
            )}
          </button>
        </div>
      )}
    </div>
  );
};