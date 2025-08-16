import React, { useState } from 'react';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Simple icon components
const UploadIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const KeyIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const CheckIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface RecoveryShare {
  shareId: string;
  data: string;
  checksum?: string;
  filename?: string;
}

interface RecoveryProcessProps {
  onRecoveryComplete?: (_success: boolean, _message: string) => void;
}

/**
 * PATENT-CRITICAL: Recovery Process Component
 * Handles the quantum share-based recovery process without passwords
 */
const RecoveryProcess: React.FC<RecoveryProcessProps> = ({ onRecoveryComplete }) => {
  const [uploadedShares, setUploadedShares] = useState<RecoveryShare[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    const newShares: RecoveryShare[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.name.endsWith('.qrs')) {
        setError(`File ${file.name} is not a valid Quankey Recovery Share (.qrs)`);
        continue;
      }

      try {
        const content = await file.text();
        const shareData = JSON.parse(content);
        
        if (!shareData.quankeyRecoveryShare) {
          setError(`File ${file.name} is not a valid Quankey Recovery Share`);
          continue;
        }

        const share = shareData.quankeyRecoveryShare;
        newShares.push({
          shareId: share.shareId,
          data: share.data,
          checksum: share.checksum,
          filename: file.name
        });

      } catch (err) {
        setError(`Error reading file ${file.name}: Invalid format`);
      }
    }

    setUploadedShares(prev => [...prev, ...newShares]);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const removeShare = (shareId: string) => {
    setUploadedShares(prev => prev.filter(share => share.shareId !== shareId));
  };

  const attemptRecovery = async () => {
    if (uploadedShares.length < 3) {
      setError('You need at least 3 recovery shares to recover your account');
      return;
    }

    if (!userId.trim()) {
      setError('Please enter your user ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/recovery/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId.trim(),
          shares: uploadedShares.map(share => ({
            shareId: share.shareId,
            data: share.data
          }))
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store the recovered session
        localStorage.setItem('quankey_recovered_session', JSON.stringify({
          token: result.session.token,
          expiresAt: result.session.expiresAt,
          recoveredAt: new Date().toISOString()
        }));

        onRecoveryComplete?.(true, 'Account recovered successfully! You can now access your vault.');
      } else {
        setError(result.message || 'Recovery failed. Please check your shares and try again.');
        onRecoveryComplete?.(false, result.message || 'Recovery failed');
      }

    } catch (err) {
      setError('Failed to connect to recovery service. Please try again.');
      onRecoveryComplete?.(false, 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recovery-process">
      <div className="recovery-header">
        <h2>Account Recovery</h2>
        <p>Upload your quantum recovery shares to regain access to your account</p>
      </div>

      {/* User ID Input */}
      <div className="user-id-section">
        <label htmlFor="userId">User ID or Username:</label>
        <input
          id="userId"
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter your user ID or username"
          className="user-id-input"
        />
      </div>

      {/* File Upload Area */}
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <UploadIcon size={48} color="#667eea" />
        <h3>Upload Recovery Shares</h3>
        <p>
          Drag and drop your .qrs files here or click to browse<br />
          <small>You need at least 3 of your 5 recovery shares</small>
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".qrs"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Uploaded Shares */}
      {uploadedShares.length > 0 && (
        <div className="uploaded-shares">
          <h3>Uploaded Shares ({uploadedShares.length}/5)</h3>
          <div className="shares-grid">
            {uploadedShares.map((share, index) => (
              <div key={share.shareId} className="share-card">
                <div className="share-header">
                  <KeyIcon size={20} color="#667eea" />
                  <span>Share {index + 1}</span>
                  <button
                    onClick={() => removeShare(share.shareId)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
                <div className="share-info">
                  <p className="filename">{share.filename}</p>
                  <p className="share-id">ID: {share.shareId}</p>
                  {share.checksum && (
                    <p className="checksum">Checksum: {share.checksum.substring(0, 8)}...</p>
                  )}
                </div>
                <div className="share-status">
                  <CheckIcon size={16} color="#48bb78" />
                  <span>Valid</span>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="progress-indicator">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (uploadedShares.length / 3) * 100)}%`,
                  backgroundColor: uploadedShares.length >= 3 ? '#48bb78' : '#667eea'
                }}
              />
            </div>
            <p className="progress-text">
              {uploadedShares.length >= 3 
                ? `Ready to recover! (${uploadedShares.length} shares uploaded)`
                : `Need ${3 - uploadedShares.length} more shares`
              }
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Recovery Button */}
      <div className="recovery-actions">
        <button
          onClick={attemptRecovery}
          disabled={loading || uploadedShares.length < 3 || !userId.trim()}
          className="btn-recovery"
        >
          {loading ? (
            <>
              <div className="loading-spinner" /> 
              Recovering Account...
            </>
          ) : (
            <>
              <KeyIcon size={20} />
              Recover Account
            </>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="recovery-instructions">
        <h4>Recovery Instructions:</h4>
        <ol>
          <li>Enter your user ID or username</li>
          <li>Upload at least 3 of your 5 quantum recovery shares (.qrs files)</li>
          <li>Click "Recover Account" to regain access</li>
          <li>Once recovered, consider generating a new recovery kit</li>
        </ol>
      </div>
    </div>
  );
};

export default RecoveryProcess;