import React, { useState, useEffect } from 'react';
import '../styles/RecoveryManager.css';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'https://api.quankey.xyz';

// Import icons from QuankeyIcons - using the correct export names
interface IconProps {
  className?: string;
  size?: number;
}

// Simple icon components as fallback if QuankeyIcons don't work
const ShieldIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const KeyIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const UserGroupIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DownloadIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const AlertIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

interface RecoveryManagerProps {
  userId?: string;
}

interface RecoveryKit {
  recoveryId: string;
  shares: Array<{
    shareId: string;
    index: number;
    qrCode: string;
    checksum: string;
  }>;
  expiresIn: string;
  metadata: any;
  instructions: any;
}

interface RecoveryStatus {
  hasActiveRecovery: boolean;
  kits: Array<{
    id: string;
    type: string;
    created: string;
    expires: string;
    isExpired: boolean;
    shares: {
      total: number;
      required: number;
      distributed: number;
    };
  }>;
}

/**
 * PATENT-CRITICAL: Recovery Manager Component
 * This component manages the world's first quantum recovery system
 * that enables account recovery without ANY password
 */
const RecoveryManager: React.FC<RecoveryManagerProps> = ({ userId = 'demo-user' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'generate' | 'social'>('overview');
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedKit, setGeneratedKit] = useState<RecoveryKit | null>(null);

  // Load recovery status on mount
  useEffect(() => {
    loadRecoveryStatus();
  }, []);

  const loadRecoveryStatus = async () => {
    try {
      const authData = localStorage.getItem('quankey_auth');
      if (!authData) return;
      
      const { token } = JSON.parse(authData);
      const response = await fetch(`${API_URL}/api/recovery/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecoveryStatus(data);
      }
    } catch (error) {
      console.error('Failed to load recovery status:', error);
    }
  };

  const generateRecoveryKit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const authData = localStorage.getItem('quankey_auth');
      if (!authData) throw new Error('Not authenticated');
      
      const { token } = JSON.parse(authData);
      const response = await fetch(`${API_URL}/api/recovery/generate-kit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGeneratedKit(data.kit);
        setSuccess('Quantum recovery kit generated successfully!');
        loadRecoveryStatus(); // Reload status
      } else {
        setError(data.error || 'Failed to generate recovery kit');
      }
    } catch (error) {
      setError('Failed to generate recovery kit');
    } finally {
      setLoading(false);
    }
  };

  const downloadShare = async (shareId: string, index: number) => {
    try {
      const authData = localStorage.getItem('quankey_auth');
      if (!authData) return;
      
      const { token } = JSON.parse(authData);
      const response = await fetch(`${API_URL}/api/recovery/share/${shareId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quankey-recovery-share-${index}.qrs`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      setError('Failed to download share');
    }
  };

  return (
    <div className="recovery-manager">
      <div className="recovery-header">
        <h2 className="section-title">
          <ShieldIcon />
          Quantum Recovery System
        </h2>
        <p className="section-subtitle">
          Protect your account with quantum-secure recovery - no master password needed
        </p>
      </div>
      
      {/* Tabs */}
      <div className="recovery-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <ShieldIcon />
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <KeyIcon />
          Generate Kit
        </button>
        <button
          className={`tab ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          <UserGroupIcon />
          Social Recovery
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="recovery-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {recoveryStatus?.hasActiveRecovery ? (
              <div className="active-recovery">
                <div className="status-card success">
                  <ShieldIcon />
                  <div>
                    <h3>Recovery Protection Active</h3>
                    <p>Your account has quantum recovery enabled</p>
                  </div>
                </div>
                
                {recoveryStatus.kits.map(kit => (
                  <div key={kit.id} className="kit-info">
                    <h4>Recovery Kit Details</h4>
                    <div className="kit-stats">
                      <div className="stat">
                        <span className="label">Type:</span>
                        <span className="value">{kit.type}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Shares:</span>
                        <span className="value">{kit.shares.required} of {kit.shares.total} needed</span>
                      </div>
                      <div className="stat">
                        <span className="label">Expires:</span>
                        <span className="value">{new Date(kit.expires).toLocaleDateString()}</span>
                      </div>
                      {kit.isExpired && (
                        <div className="warning">
                          <AlertIcon />
                          This kit has expired. Generate a new one.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-recovery">
                <div className="status-card warning">
                  <AlertIcon />
                  <div>
                    <h3>No Recovery Method Set</h3>
                    <p>Generate a recovery kit to protect your account</p>
                  </div>
                </div>
                
                <div className="info-section">
                  <h3>What is Quantum Recovery?</h3>
                  <p>
                    Unlike traditional password managers that require a master password for recovery,
                    Quankey uses quantum-generated recovery shares. This means:
                  </p>
                  <ul>
                    <li>No master password to remember or reset</li>
                    <li>Quantum-secure recovery codes</li>
                    <li>Split secret technology (need 3 of 5 shares)</li>
                    <li>Optional social recovery with trusted contacts</li>
                  </ul>
                  
                  <button
                    className="btn-primary"
                    onClick={() => setActiveTab('generate')}
                  >
                    Generate Recovery Kit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Generate Kit Tab */}
        {activeTab === 'generate' && (
          <div className="generate-tab">
            {!generatedKit ? (
              <div className="generate-form">
                <h3>Generate Quantum Recovery Kit</h3>
                <p>
                  This will create 5 quantum-encrypted recovery shares.
                  You'll need any 3 of them to recover your account.
                </p>
                
                <div className="warning-box">
                  <AlertIcon />
                  <div>
                    <strong>Important:</strong>
                    <ul>
                      <li>Save each share in a different secure location</li>
                      <li>Never store all shares together</li>
                      <li>Consider giving shares to trusted contacts</li>
                      <li>Each share is quantum-encrypted and unique</li>
                    </ul>
                  </div>
                </div>
                
                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="success-message">
                    {success}
                  </div>
                )}
                
                <button
                  className="btn-primary"
                  onClick={generateRecoveryKit}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Quantum Recovery Kit'}
                </button>
              </div>
            ) : (
              <div className="generated-kit">
                <div className="success-message">
                  <h3>Recovery Kit Generated Successfully!</h3>
                  <p>Download and save each share in a different secure location.</p>
                </div>
                
                <div className="shares-list">
                  {generatedKit.shares.map(share => (
                    <div key={share.shareId} className="share-item">
                      <div className="share-header">
                        <div className="share-info">
                          <KeyIcon />
                          <span>Recovery Share {share.index} of 5</span>
                        </div>
                        <button
                          className="btn-secondary"
                          onClick={() => downloadShare(share.shareId, share.index)}
                        >
                          <DownloadIcon />
                          Download
                        </button>
                      </div>
                      
                      {/* QR Code Display */}
                      <div className="qr-container">
                        <div className="qr-code">
                          <img 
                            src={share.qrCode} 
                            alt={`QR Code for share ${share.index}`}
                            className="qr-image"
                          />
                        </div>
                        <div className="qr-info">
                          <p className="qr-description">
                            Scan with Quankey mobile app or save the QR code image
                          </p>
                          <p className="share-checksum">
                            <small>Checksum: {share.checksum}</small>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="kit-metadata">
                  <h4>Kit Information</h4>
                  <div className="metadata-item">
                    <span className="label">Recovery ID:</span>
                    <span className="value">{generatedKit.recoveryId}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Expires:</span>
                    <span className="value">{generatedKit.expiresIn}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Quantum Source:</span>
                    <span className="value">{generatedKit.metadata.quantumSource}</span>
                  </div>
                </div>
                
                <button
                  className="btn-secondary"
                  onClick={() => setGeneratedKit(null)}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Social Recovery Tab */}
        {activeTab === 'social' && (
          <div className="social-tab">
            <h3>Social Recovery Setup</h3>
            <p>
              Distribute recovery shares to trusted contacts. They cannot access
              your account individually - you'll need 3 of 5 to recover.
            </p>
            
            <div className="coming-soon">
              <UserGroupIcon />
              <h4>Coming Soon</h4>
              <p>Social recovery feature will be available in the next update.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoveryManager;