import React, { useState } from 'react';
import { VaultService } from '../services/vaultService';
import axios from 'axios';

interface AddPasswordFormProps {
  userId: string;
  onSaved: () => void;
  onCancel: () => void;
  initialPassword?: string;
  isQuantum?: boolean;
  entropy?: string;
}

interface PasswordResponse {
  success: boolean;
  password: string;
  length: number;
  timestamp: string;
  quantum: boolean;
  entropy: string;
  error?: string;
}

export const AddPasswordForm: React.FC<AddPasswordFormProps> = ({
  userId,
  onSaved,
  onCancel,
  initialPassword = '',
  isQuantum = false,
  entropy = ''
}) => {
  const [formData, setFormData] = useState({
    title: '',
    website: '',
    username: '',
    password: initialPassword,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [currentEntropy, setCurrentEntropy] = useState(entropy);
  const [isCurrentQuantum, setIsCurrentQuantum] = useState(isQuantum);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If user modifies the password manually, it's no longer quantum
    if (field === 'password' && value !== initialPassword) {
      setIsCurrentQuantum(false);
      setCurrentEntropy('');
    }
  };

  const generateQuantumPassword = async () => {
    setGenerating(true);
    
    try {
      const response = await axios.post<PasswordResponse>('http://localhost:5000/api/quantum/generate-password', {
        length: passwordLength,
        includeSymbols
      });

      if (response.data.success) {
        setFormData(prev => ({ ...prev, password: response.data.password }));
        setCurrentEntropy(response.data.entropy);
        setIsCurrentQuantum(true);
      } else {
        alert('Error generating password: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to connect to quantum backend');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.website.trim() || !formData.password.trim()) {
      alert('Please fill in all required fields (Title, Website, Password)');
      return;
    }

    setLoading(true);

    try {
      VaultService.addEntry(userId, {
        title: formData.title.trim(),
        website: formData.website.trim(),
        username: formData.username.trim(),
        password: formData.password,
        notes: formData.notes.trim(),
        isQuantum: isCurrentQuantum,
        entropy: currentEntropy
      });

      console.log(`✅ Saved password for: ${formData.title}`);
      onSaved();
    } catch (error) {
      console.error('Error saving password:', error);
      alert('Failed to save password');
    } finally {
      setLoading(false);
    }
  };

  const analyzePassword = () => {
    if (!formData.password) return null;
    return VaultService.analyzePassword(formData.password);
  };

  const passwordAnalysis = analyzePassword();

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: '600', margin: 0 }}>
          ➕ Add New Password
        </h3>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '8px' }}>
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Gmail, Facebook, Work Email"
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

        {/* Website */}
        <div>
          <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '8px' }}>
            Website *
          </label>
          <input
            type="text"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="e.g., gmail.com, facebook.com"
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

        {/* Username */}
        <div>
          <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '8px' }}>
            Username / Email
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="your@email.com or username"
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

        {/* Password Section */}
        <div>
          <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '8px' }}>
            Password *
          </label>
          
          {/* Password Generator Controls */}
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.3)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <label style={{ color: '#94a3b8', fontSize: '12px', minWidth: '120px' }}>
                Length: {passwordLength}
              </label>
              <input
                type="range"
                min="8"
                max="64"
                value={passwordLength}
                onChange={(e) => setPasswordLength(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="includeSymbols"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
              />
              <label htmlFor="includeSymbols" style={{ color: '#94a3b8', fontSize: '12px' }}>
                Include symbols
              </label>
            </div>

            <button
              onClick={generateQuantumPassword}
              disabled={generating}
              style={{
                width: '100%',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {generating ? '⚛️ Generating...' : '⚛️ Generate Quantum Password'}
            </button>
          </div>

          {/* Password Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter or generate a password"
              style={{
                width: '100%',
                padding: '12px',
                paddingRight: '100px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: 'white',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
            {isCurrentQuantum && (
              <span style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '600'
              }}>
                ⚛️ QUANTUM
              </span>
            )}
          </div>

          {/* Password Analysis */}
          {passwordAnalysis && (
            <div style={{ 
              marginTop: '8px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '6px',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Strength:</span>
                <span style={{ 
                  color: passwordAnalysis.strength === 'Weak' ? '#ef4444' : 
                        passwordAnalysis.strength === 'Medium' ? '#f59e0b' : '#10b981',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {passwordAnalysis.strength}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Entropy:</span>
                <span style={{ color: '#e2e8f0', fontSize: '12px' }}>
                  {currentEntropy || passwordAnalysis.entropy}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '8px' }}>
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any additional notes..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: 'white',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-quantum"
            style={{ padding: '12px 24px', fontSize: '14px' }}
          >
            {loading ? 'Saving...' : '💾 Save Password'}
          </button>
        </div>
      </div>
    </div>
  );
};