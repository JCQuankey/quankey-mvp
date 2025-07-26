import React, { useState } from 'react';
import axios from 'axios';
import { BiometricAuth } from './components/BiometricAuth';
import { PasswordList } from './components/PasswordList';
import { AddPasswordForm } from './components/AddPasswordForm';
import { User } from './services/authService';
import { VaultService } from './services/vaultService';
import './App.css';

interface PasswordResponse {
  success: boolean;
  password: string;
  strength: {
    score: number;
    level: string;
    feedback: string[];
    quantumAdvantage: string;
  };
  quantumSource: string;
  generatedAt: string;
  message: string;
  error?: string;
}

type ViewMode = 'vault' | 'generator' | 'add-password';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string>('');

  // View state
  const [currentView, setCurrentView] = useState<ViewMode>('vault');

  // Password generation state
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordLength, setPasswordLength] = useState<number>(16);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [entropy, setEntropy] = useState<string>('');

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAuthError('');
    console.log(`🎉 Welcome ${user.displayName}!`);
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
    setTimeout(() => setAuthError(''), 5000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPassword('');
    setAuthError('');
    setCurrentView('vault');
    console.log('👋 Logged out successfully');
  };

  const generatePassword = async () => {
    setLoading(true);
    setCopied(false);
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await axios.post<PasswordResponse>(`${API_URL}/api/quantum/password`, {
        length: passwordLength,
        includeSymbols
      });

      if (response.data.success) {
  setPassword(response.data.password);
  setEntropy(response.data.quantumSource); // Cambiar de entropy a quantumSource
  console.log('Password generated:', response.data);
} else {
  alert('Error generating password: ' + response.data.error);
}
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to connect to quantum backend');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveGeneratedPassword = () => {
    if (!password) {
      alert('Please generate a password first');
      return;
    }
    setCurrentView('add-password');
  };

  const handlePasswordSaved = () => {
    setCurrentView('vault');
    setPassword(''); // Clear generated password
  };

  const getVaultStats = () => {
    if (!currentUser) return null;
    return VaultService.getVaultStats(currentUser.id);
  };

  const vaultStats = getVaultStats();

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="quantum-bg">
        <div className="card-quantum">
          <div className="header">
            <div className="logo-container">
              <img 
                src={`${process.env.PUBLIC_URL}/quankey-logo-dark.png`} 
                alt="Quankey Logo" 
                className="logo-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className="main-title">Quankey</h1>
            </div>
            <p className="subtitle">
              World's First Quantum-Proof Password Manager
            </p>
            <div className="status-indicator">
              <div className="green-dot animate-pulse"></div>
              <span style={{color: '#4ade80', fontSize: '14px', fontWeight: '600'}}>
                Biometric Security Active
              </span>
            </div>
          </div>

          {authError && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171'
            }}>
              ⚠️ {authError}
            </div>
          )}

          <BiometricAuth 
            onAuthenticated={handleAuthenticated}
            onError={handleAuthError}
          />

          <div className="footer">
            <p>Secure access with biometric authentication</p>
            <p style={{marginTop: '8px'}}>No master password required</p>
          </div>
        </div>
      </div>
    );
  }

  // Show main application if authenticated
  return (
    <div className="quantum-bg">
      <div className="card-quantum">
        {/* Header with navigation */}
        <div className="header">
          <div className="logo-container">
            <img 
              src={`${process.env.PUBLIC_URL}/quankey-logo-dark.png`} 
              alt="Quankey Logo" 
              className="logo-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="main-title">Quankey</h1>
          </div>
          
          {/* User Info & Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: '4px'}}>
                <div className="green-dot animate-pulse"></div>
                <span style={{color: '#4ade80', fontSize: '14px', fontWeight: '600'}}>
                  Welcome, {currentUser?.displayName}
                </span>
              </div>
              {vaultStats && (
                <div style={{color: '#64748b', fontSize: '12px'}}>
                  {vaultStats.totalEntries} passwords • {vaultStats.quantumPasswords} quantum-secured
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              🚪 Logout
            </button>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '12px',
            padding: '4px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => setCurrentView('vault')}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentView === 'vault' ? '#3b82f6' : 'transparent',
                color: currentView === 'vault' ? 'white' : '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '600'
              }}
            >
              🗂️ Vault
            </button>
            <button
              onClick={() => setCurrentView('generator')}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentView === 'generator' ? '#3b82f6' : 'transparent',
                color: currentView === 'generator' ? 'white' : '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '600'
              }}
            >
              ⚛️ Generator
            </button>
          </div>
        </div>

        {/* Main Content */}
        {currentView === 'vault' && (
          <PasswordList
            userId={currentUser!.id}
            onAddNew={() => setCurrentView('add-password')}
          />
        )}

        {currentView === 'generator' && (
          <div>
            {/* Generator Controls */}
            <div className="controls-section">
              <div className="control-group">
                <label className="control-label">
                  Password Length: {passwordLength} characters
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={passwordLength}
                    onChange={(e) => setPasswordLength(Number(e.target.value))}
                    className="slider"
                  />
                </div>
                <div className="slider-labels">
                  <span>8</span>
                  <span>64</span>
                </div>
              </div>

              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="symbols"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="checkbox"
                />
                <label htmlFor="symbols" className="checkbox-label">
                  Include special symbols (!@#$%^&*)
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <div className="generate-section">
              <button
                onClick={generatePassword}
                disabled={loading}
                className="btn-quantum"
              >
                {loading ? (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div className="loading-spinner"></div>
                    Generating Quantum Password...
                  </div>
                ) : (
                  '⚛️ Generate Quantum Password'
                )}
              </button>
            </div>

            {/* Generated Password Display */}
            {password && (
              <div>
                <div className="password-display">
                  <div className="password-header">
                    <span className="password-label">Generated Password:</span>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button onClick={copyToClipboard} className="copy-button">
                        {copied ? '✅ Copied!' : '📋 Copy'}
                      </button>
                      <button onClick={saveGeneratedPassword} className="copy-button">
                        💾 Save
                      </button>
                    </div>
                  </div>
                  <div className="password-text">{password}</div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Length</div>
                    <div className="stat-value">{password.length}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Entropy</div>
                    <div className="stat-value">{entropy}</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="quantum-indicator">
                    <span className="quantum-text">
                      ⚛️ Generated using true quantum randomness
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'add-password' && (
          <AddPasswordForm
            userId={currentUser!.id}
            onSaved={handlePasswordSaved}
            onCancel={() => setCurrentView('vault')}
            initialPassword={password}
            isQuantum={!!password}
            entropy={entropy}
          />
        )}

        {/* Footer */}
        <div className="footer" style={{marginTop: '32px'}}>
          <p>Powered by quantum random number generation</p>
          <p style={{marginTop: '8px'}}>Protected by biometric authentication</p>
        </div>
      </div>
    </div>
  );
}

export default App;