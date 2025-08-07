/**
 * ===============================================================================
 * 🛡️ SECURITY DASHBOARD COMPONENT - PASSWORD HEALTH & METRICS
 * ===============================================================================
 * 
 * PATENT-CRITICAL: Quantum security analytics dashboard
 * 
 * @patent-feature Security metrics for quantum password vault
 * @innovation Real-time password health analysis
 * @advantage Comprehensive security visibility
 */

import React, { useMemo } from 'react';
import { VaultEntry } from '../services/vaultService';
import { 
  ShieldIcon, 
  TargetIcon,
  QuantumIcon,
  EyeIcon,
  AlertIcon,
  CheckIcon,
  ClockIcon,
  KeyIcon
} from './QuankeyIcons';

interface SecurityDashboardProps {
  entries: VaultEntry[];
}

interface SecurityMetrics {
  totalPasswords: number;
  quantumPasswords: number;
  strongPasswords: number;
  weakPasswords: number;
  duplicatePasswords: number;
  oldPasswords: number;
  averageStrength: number;
  securityScore: number;
  categoriesCount: number;
  recentlyUpdated: number;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ entries }) => {
  const metrics: SecurityMetrics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Analyze password strength
    const getPasswordStrength = (password: string) => {
      let score = 0;
      if (password.length >= 12) score += 25;
      if (password.length >= 16) score += 15;
      if (/[a-z]/.test(password)) score += 10;
      if (/[A-Z]/.test(password)) score += 10;
      if (/[0-9]/.test(password)) score += 10;
      if (/[^A-Za-z0-9]/.test(password)) score += 15;
      if (password.length >= 20) score += 15;
      return Math.min(score, 100);
    };

    // Calculate metrics
    const totalPasswords = entries.length;
    const quantumPasswords = entries.filter(e => e.isQuantum).length;
    const passwordStrengths = entries.map(e => getPasswordStrength(e.password));
    
    const strongPasswords = passwordStrengths.filter(s => s >= 80).length;
    const weakPasswords = passwordStrengths.filter(s => s < 60).length;
    
    // Find duplicates
    const passwordCounts = entries.reduce((acc, entry) => {
      acc[entry.password] = (acc[entry.password] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const duplicatePasswords = Object.values(passwordCounts).filter(count => count > 1).length;

    // Old passwords (not updated in 6 months)
    const oldPasswords = entries.filter(e => e.updatedAt < sixMonthsAgo).length;
    
    // Recently updated (last 30 days)
    const recentlyUpdated = entries.filter(e => e.updatedAt >= thirtyDaysAgo).length;

    // Average strength
    const averageStrength = passwordStrengths.length > 0 
      ? passwordStrengths.reduce((sum, s) => sum + s, 0) / passwordStrengths.length 
      : 0;

    // Categories count
    const categories = new Set(entries.map(e => e.category || 'Uncategorized'));
    const categoriesCount = categories.size;

    // Calculate overall security score
    let securityScore = 0;
    if (totalPasswords > 0) {
      securityScore += (quantumPasswords / totalPasswords) * 30; // Quantum passwords weight
      securityScore += (strongPasswords / totalPasswords) * 25; // Strong passwords weight
      securityScore += Math.max(0, 20 - (duplicatePasswords * 5)); // Duplicate penalty
      securityScore += Math.max(0, 15 - (oldPasswords / totalPasswords) * 15); // Old passwords penalty
      securityScore += Math.min(10, categoriesCount * 2); // Organization bonus
    }

    return {
      totalPasswords,
      quantumPasswords,
      strongPasswords,
      weakPasswords,
      duplicatePasswords,
      oldPasswords,
      averageStrength,
      securityScore: Math.min(100, Math.max(0, securityScore)),
      categoriesCount,
      recentlyUpdated
    };
  }, [entries]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--quankey-success)';
    if (score >= 60) return 'var(--quankey-warning)';
    return 'var(--quankey-error)';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  if (entries.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '48px 24px',
        background: 'rgba(10, 22, 40, 0.5)',
        borderRadius: '16px',
        border: '1px solid rgba(0, 166, 251, 0.3)'
      }}>
        <ShieldIcon size={48} color="var(--quankey-gray)" />
        <h3 style={{ color: 'var(--quankey-gray-light)', fontSize: '20px', marginBottom: '8px' }}>
          No Security Data Available
        </h3>
        <p style={{ color: 'var(--quankey-gray)', marginBottom: '24px' }}>
          Add some passwords to your vault to see security insights
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Security Score Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(30, 58, 95, 0.9))',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(0, 166, 251, 0.3)',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          color: 'var(--quankey-gray-light)', 
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <ShieldIcon size={24} color="var(--quankey-primary)" />
          Security Dashboard
        </h2>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: getScoreColor(metrics.securityScore)
          }}>
            {Math.round(metrics.securityScore)}
          </div>
          <div>
            <div style={{ 
              color: getScoreColor(metrics.securityScore), 
              fontSize: '18px', 
              fontWeight: '600' 
            }}>
              {getScoreLabel(metrics.securityScore)}
            </div>
            <div style={{ color: 'var(--quankey-gray)', fontSize: '14px' }}>
              Security Score
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          height: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: getScoreColor(metrics.securityScore),
            height: '100%',
            width: `${metrics.securityScore}%`,
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Quantum Security */}
        <div style={{
          background: 'rgba(10, 22, 40, 0.5)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(0, 166, 251, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <QuantumIcon size={20} color="var(--quankey-success)" />
            <h3 style={{ color: 'var(--quankey-gray-light)', margin: 0, fontSize: '16px' }}>
              Quantum Security
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--quankey-success)', marginBottom: '8px' }}>
            {metrics.quantumPasswords}
          </div>
          <div style={{ color: 'var(--quankey-gray)', fontSize: '14px', marginBottom: '8px' }}>
            of {metrics.totalPasswords} passwords
          </div>
          <div style={{ color: 'var(--quankey-success)', fontSize: '12px' }}>
            {Math.round((metrics.quantumPasswords / metrics.totalPasswords) * 100)}% quantum-protected
          </div>
        </div>

        {/* Password Strength */}
        <div style={{
          background: 'rgba(10, 22, 40, 0.5)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(0, 166, 251, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <KeyIcon size={20} color="var(--quankey-primary)" />
            <h3 style={{ color: 'var(--quankey-gray-light)', margin: 0, fontSize: '16px' }}>
              Password Strength
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--quankey-primary)', marginBottom: '8px' }}>
            {Math.round(metrics.averageStrength)}
          </div>
          <div style={{ color: 'var(--quankey-gray)', fontSize: '14px', marginBottom: '8px' }}>
            Average strength score
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <div style={{ color: 'var(--quankey-success)' }}>
              {metrics.strongPasswords} strong
            </div>
            <div style={{ color: 'var(--quankey-error)' }}>
              {metrics.weakPasswords} weak
            </div>
          </div>
        </div>

        {/* Security Issues */}
        <div style={{
          background: 'rgba(10, 22, 40, 0.5)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(0, 166, 251, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <AlertIcon size={20} color="var(--quankey-error)" />
            <h3 style={{ color: 'var(--quankey-gray-light)', margin: 0, fontSize: '16px' }}>
              Security Issues
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--quankey-error)', marginBottom: '8px' }}>
            {metrics.duplicatePasswords + metrics.oldPasswords}
          </div>
          <div style={{ color: 'var(--quankey-gray)', fontSize: '14px', marginBottom: '8px' }}>
            Issues found
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <div style={{ color: 'var(--quankey-error)' }}>
              {metrics.duplicatePasswords} duplicates
            </div>
            <div style={{ color: 'var(--quankey-warning)' }}>
              {metrics.oldPasswords} outdated
            </div>
          </div>
        </div>

        {/* Organization */}
        <div style={{
          background: 'rgba(10, 22, 40, 0.5)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(0, 166, 251, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <TargetIcon size={20} color="var(--quankey-primary)" />
            <h3 style={{ color: 'var(--quankey-gray-light)', margin: 0, fontSize: '16px' }}>
              Organization
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--quankey-primary)', marginBottom: '8px' }}>
            {metrics.categoriesCount}
          </div>
          <div style={{ color: 'var(--quankey-gray)', fontSize: '14px', marginBottom: '8px' }}>
            Categories used
          </div>
          <div style={{ color: 'var(--quankey-success)', fontSize: '12px' }}>
            {metrics.recentlyUpdated} updated recently
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div style={{
        background: 'rgba(10, 22, 40, 0.5)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(0, 166, 251, 0.3)'
      }}>
        <h3 style={{ 
          color: 'var(--quankey-gray-light)', 
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckIcon size={20} color="var(--quankey-primary)" />
          Security Recommendations
        </h3>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          {metrics.quantumPasswords < metrics.totalPasswords && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '12px',
              background: 'rgba(0, 166, 251, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 166, 251, 0.2)'
            }}>
              <QuantumIcon size={16} color="var(--quankey-primary)" />
              <div>
                <div style={{ color: 'var(--quankey-gray-light)', fontSize: '14px', fontWeight: '500' }}>
                  Upgrade to Quantum Protection
                </div>
                <div style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                  {metrics.totalPasswords - metrics.quantumPasswords} passwords could be quantum-encrypted
                </div>
              </div>
            </div>
          )}

          {metrics.weakPasswords > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '12px',
              background: 'rgba(255, 193, 7, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 193, 7, 0.2)'
            }}>
              <KeyIcon size={16} color="var(--quankey-warning)" />
              <div>
                <div style={{ color: 'var(--quankey-gray-light)', fontSize: '14px', fontWeight: '500' }}>
                  Strengthen Weak Passwords
                </div>
                <div style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                  {metrics.weakPasswords} passwords need to be stronger
                </div>
              </div>
            </div>
          )}

          {metrics.duplicatePasswords > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '12px',
              background: 'rgba(255, 59, 48, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 59, 48, 0.2)'
            }}>
              <AlertIcon size={16} color="var(--quankey-error)" />
              <div>
                <div style={{ color: 'var(--quankey-gray-light)', fontSize: '14px', fontWeight: '500' }}>
                  Remove Duplicate Passwords
                </div>
                <div style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                  {metrics.duplicatePasswords} passwords are being reused
                </div>
              </div>
            </div>
          )}

          {metrics.oldPasswords > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '12px',
              background: 'rgba(108, 117, 125, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(108, 117, 125, 0.2)'
            }}>
              <ClockIcon size={16} color="var(--quankey-gray)" />
              <div>
                <div style={{ color: 'var(--quankey-gray-light)', fontSize: '14px', fontWeight: '500' }}>
                  Update Old Passwords
                </div>
                <div style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                  {metrics.oldPasswords} passwords haven't been updated in 6+ months
                </div>
              </div>
            </div>
          )}

          {metrics.securityScore >= 80 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '12px',
              background: 'rgba(0, 255, 136, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 136, 0.2)'
            }}>
              <CheckIcon size={16} color="var(--quankey-success)" />
              <div>
                <div style={{ color: 'var(--quankey-gray-light)', fontSize: '14px', fontWeight: '500' }}>
                  Excellent Security Posture!
                </div>
                <div style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                  Your vault is well-secured with quantum protection
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};