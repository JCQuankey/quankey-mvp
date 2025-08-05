// frontend/src/components/AddPasswordForm.tsx

import React, { useState, useEffect } from 'react';
import { VaultService } from '../services/vaultService';
import { EncryptedVaultService } from '../services/vaultService';
// Importar los iconos profesionales
import { 
  PlusIcon,
  CloseIcon,
  QuantumIcon,
  SaveIcon
} from './QuankeyIcons';

/**
 * PATENT-CRITICAL: Quantum Password Storage Form
 *
 * @patent-feature Form emphasizing quantum password generation
 * @innovation Integrated quantum generation in password creation flow
 * @advantage Users default to quantum-secure passwords
 * @security Zero-knowledge storage with quantum metadata
 */

interface AddPasswordFormProps {
  userId: string;
  onSaved: () => void;
  onCancel: () => void;
  initialPassword?: string;
  isQuantum?: boolean;
  entropy?: string;
}

/**
 * PATENT-CRITICAL: Password Creation with Quantum Default
 *
 * Technical Innovation:
 * - Quantum password generation prominently featured
 * - Real-time entropy calculation
 * - Quantum status tracking
 * - Zero-knowledge encryption before storage
 */
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

  // 🚀 QUANTUM VAULT: Initialize quantum keys when component mounts
  useEffect(() => {
    const setupQuantumVault = async () => {
      try {
        console.log('🚀 Initializing QUANTUM VAULT for password form...');
        await EncryptedVaultService.getQuantumVaultKey();
        console.log('✅ Quantum vault ML-KEM-768 keys ready');
      } catch (error) {
        console.error('❌ Failed to initialize quantum vault:', error);
      }
    };
    
    setupQuantumVault();
  }, []);

  /**
   * PATENT-CRITICAL: Track Quantum Status
   *
   * @innovation Maintains quantum provenance of passwords
   * @security User awareness of quantum vs classical passwords
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // PATENT-CRITICAL: If user modifies password, it's no longer quantum
    if (field === 'password' && value !== initialPassword) {
      setIsCurrentQuantum(false);
      setCurrentEntropy('');
      console.log('⚠️ Password manually modified - no longer quantum generated');
    }
  };

  /**
   * PATENT-CRITICAL: Generate Quantum Password
   *
   * @patent-feature Real quantum randomness from hardware
   * @innovation One-click quantum password generation
   * @advantage Physically unpredictable passwords
   */
  const generateQuantumPassword = async () => {
    setGenerating(true);
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🔮 [${generationId}] Generating quantum password...`);
      console.log(`📊 [${generationId}] Parameters: length=${passwordLength}, symbols=${includeSymbols}`);
      
      const result = await EncryptedVaultService.generateQuantumPassword(
        passwordLength,
        includeSymbols
      );
      
      if (result.success) {
        setFormData(prev => ({ ...prev, password: result.password }));
        setIsCurrentQuantum(true);
        
        // PATENT-CRITICAL: Store complete quantum metadata
        const quantumMetadata = result.quantumInfo?.note || 'Quantum generated';
        setCurrentEntropy(quantumMetadata);
        
        console.log(`✅ [${generationId}] Quantum password generated successfully`);
        console.log(`🔮 [${generationId}] Quantum info:`, result.quantumInfo);
        console.log(`⚛️ [${generationId}] Source: ${result.quantumInfo?.source || 'Unknown'}`);
        console.log(`📈 [${generationId}] Entropy: ${result.quantumInfo?.theoretical_entropy || 'Unknown'}`);
      } else {
        console.error(`❌ [${generationId}] Generation failed:`, result.error);
        alert('Failed to generate quantum password: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error(`❌ [${generationId}] Generation error:`, error);
      alert('Failed to connect to quantum backend');
    }
    
    setGenerating(false);
  };

  /**
   * PATENT-CRITICAL: Save Password with Quantum Metadata
   *
   * @patent-feature Stores quantum provenance with password
   * @innovation Zero-knowledge encryption with quantum tracking
   * @security Complete audit trail of quantum generation
   */
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.website.trim() || !formData.password.trim()) {
      alert('Please fill in all required fields (Title, Website, Password)');
      return;
    }

    setLoading(true);
    const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`💾 [${saveId}] Saving password for: ${formData.title}`);
      console.log(`⚛️ [${saveId}] Is Quantum: ${isCurrentQuantum}`);
      
      // 🚀 QUANTUM VAULT: ALL passwords are now quantum-encrypted
      console.log(`🚀 [${saveId}] Using QUANTUM VAULT (ALL passwords quantum-encrypted)`);
      console.log(`⚛️ [${saveId}] Is quantum generated: ${isCurrentQuantum}`);
      console.log(`⚛️ [${saveId}] Entropy: ${currentEntropy}`);
      
      await EncryptedVaultService.saveQuantumPassword({
        site: formData.website.trim(),
        username: formData.username.trim(),
        password: formData.password,
        notes: formData.notes.trim(),
        category: isCurrentQuantum ? 'Quantum-Generated' : 'Quantum-Encrypted',
        isQuantum: isCurrentQuantum,
        quantumInfo: {
          source: isCurrentQuantum ? 'ANU Hardware Quantum Generator' : 'Classical + Quantum Encryption',
          theoretical_entropy: currentEntropy || 'N/A',
          generation_method: isCurrentQuantum ? 'Hardware TRNG' : 'Classical Generation',
          timestamp: new Date().toISOString()
        }
      });
      
      console.log(`✅ [${saveId}] PASSWORD QUANTUM-ENCRYPTED AND SAVED TO QUANTUM VAULT`);
      
      onSaved();
    } catch (error) {
      console.error(`❌ [${saveId}] Save error:`, error);
      alert('Failed to save password');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Analyze password strength
   */
  const analyzePassword = () => {
    if (!formData.password) return null;
    return VaultService.analyzePassword(formData.password);
  };

  const passwordAnalysis = analyzePassword();

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ 
          color: 'var(--quankey-gray-light)', 
          fontSize: '20px', 
          fontWeight: '600', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <PlusIcon size={20} color="var(--quankey-gray-light)" />
          Add New Password
        </h3>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--quankey-gray)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CloseIcon size={24} color="currentColor" />
        </button>
      </div>

      {/* Form */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', color: 'var(--quankey-gray-light)', fontSize: '14px', marginBottom: '8px' }}>
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
              border: '1px solid rgba(0, 166, 251, 0.3)',
              background: 'rgba(10, 22, 40, 0.5)',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Website */}
        <div>
          <label style={{ display: 'block', color: 'var(--quankey-gray-light)', fontSize: '14px', marginBottom: '8px' }}>
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
              border: '1px solid rgba(0, 166, 251, 0.3)',
              background: 'rgba(10, 22, 40, 0.5)',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Username */}
        <div>
          <label style={{ display: 'block', color: 'var(--quankey-gray-light)', fontSize: '14px', marginBottom: '8px' }}>
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
              border: '1px solid rgba(0, 166, 251, 0.3)',
              background: 'rgba(10, 22, 40, 0.5)',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>

        {/* PATENT-CRITICAL: Password Section with Quantum Generation */}
        <div>
          <label style={{ display: 'block', color: 'var(--quankey-gray-light)', fontSize: '14px', marginBottom: '8px' }}>
            Password *
          </label>
          
          {/* PATENT-CRITICAL: Quantum Generator Controls */}
          <div style={{
            background: 'rgba(10, 22, 40, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <label style={{ color: 'var(--quankey-gray)', fontSize: '12px', minWidth: '120px' }}>
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
              <label htmlFor="includeSymbols" style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                Include symbols (!@#$%^&*)
              </label>
            </div>

            {/* PATENT-CRITICAL: Quantum Generation Button */}
            <button
              onClick={generateQuantumPassword}
              disabled={generating}
              style={{
                width: '100%',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--quankey-gradient)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <QuantumIcon size={16} color="currentColor" />
              {generating ? 'Generating Quantum Password...' : 'Generate Quantum Password'}
            </button>
          </div>

          {/* Password Input with Quantum Indicator */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter or generate a quantum password"
              style={{
                width: '100%',
                padding: '12px',
                paddingRight: '100px',
                borderRadius: '8px',
                border: '1px solid rgba(0, 166, 251, 0.3)',
                background: 'rgba(10, 22, 40, 0.5)',
                color: 'white',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
            {/* PATENT-CRITICAL: Quantum Status Indicator */}
            {isCurrentQuantum && (
              <span style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 255, 136, 0.2)',
                color: 'var(--quankey-success)',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <QuantumIcon size={12} color="currentColor" />
                QUANTUM
              </span>
            )}
          </div>

          {/* Password Analysis with Quantum Info */}
          {passwordAnalysis && (
            <div style={{
              marginTop: '8px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '6px',
              border: '1px solid rgba(0, 166, 251, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>Strength:</span>
                <span style={{
                  color: passwordAnalysis.strength === 'Weak' ? 'var(--quankey-error)' :
                        passwordAnalysis.strength === 'Medium' ? 'var(--quankey-warning)' : 'var(--quankey-success)',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {passwordAnalysis.strength}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                  {isCurrentQuantum ? 'Quantum Source:' : 'Entropy:'}
                </span>
                <span style={{ color: 'var(--quankey-gray-light)', fontSize: '12px' }}>
                  {currentEntropy || passwordAnalysis.entropy}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', color: 'var(--quankey-gray-light)', fontSize: '14px', marginBottom: '8px' }}>
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
              border: '1px solid rgba(0, 166, 251, 0.3)',
              background: 'rgba(10, 22, 40, 0.5)',
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
              border: '1px solid rgba(0, 166, 251, 0.3)',
              background: 'transparent',
              color: 'var(--quankey-gray)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--quankey-gradient)',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {loading ? 'Saving...' : (
              <>
                <SaveIcon size={16} color="currentColor" />
                Save Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};