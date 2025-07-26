import React, { useState, useEffect } from 'react';
import { VaultService, VaultEntry } from '../services/vaultService';

interface PasswordListProps {
  userId: string;
  onAddNew: () => void;
}

export const PasswordList: React.FC<PasswordListProps> = ({ userId, onAddNew }) => {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'website'>('updated');

  useEffect(() => {
    loadEntries();
  }, [userId, sortBy]);

  const loadEntries = () => {
    let allEntries = VaultService.getAllEntries(userId);
    
    // Apply sorting
    switch (sortBy) {
      case 'title':
        allEntries.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'website':
        allEntries.sort((a, b) => a.website.localeCompare(b.website));
        break;
      default: // 'updated'
        allEntries.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    
    setEntries(allEntries);
  };

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePasswordVisibility = (entryId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log(`📋 Copied ${label} to clipboard`);
  };

  const deleteEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this password?')) {
      VaultService.deleteEntry(userId, entryId);
      loadEntries();
      setSelectedEntry(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPasswordStrength = (password: string) => {
    const analysis = VaultService.analyzePassword(password);
    const colors = {
      'Weak': '#ef4444',
      'Medium': '#f59e0b',
      'Strong': '#10b981',
      'Very Strong': '#059669'
    };
    return {
      strength: analysis.strength,
      color: colors[analysis.strength as keyof typeof colors] || '#64748b'
    };
  };

  if (entries.length === 0) {
    return (
      <div className="text-center" style={{ padding: '48px 24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h3 style={{ color: '#f1f5f9', fontSize: '20px', marginBottom: '8px' }}>
          Your vault is empty
        </h3>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
          Generate your first quantum-secured password to get started
        </p>
        <button onClick={onAddNew} className="btn-quantum">
          🎯 Generate First Password
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: '600', margin: 0 }}>
          🗂️ Your Password Vault ({entries.length})
        </h3>
        <button onClick={onAddNew} className="btn-quantum" style={{ padding: '8px 16px', fontSize: '14px' }}>
          ➕ Add New
        </button>
      </div>

      {/* Search and Sort */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search passwords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: 'white',
              fontSize: '14px'
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: 'white',
              fontSize: '14px'
            }}
          >
            <option value="updated">Recently Updated</option>
            <option value="title">Title A-Z</option>
            <option value="website">Website A-Z</option>
          </select>
        </div>
      </div>

      {/* Password List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredEntries.map((entry) => {
          const strength = getPasswordStrength(entry.password);
          const isPasswordVisible = showPassword[entry.id];
          
          return (
            <div
              key={entry.id}
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'}
            >
              {/* Entry Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                    {entry.title}
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 4px 0' }}>
                    🌐 {entry.website}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                    👤 {entry.username}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {entry.isQuantum && (
                    <span style={{
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
                  <span style={{
                    background: `${strength.color}20`,
                    color: strength.color,
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: '600'
                  }}>
                    {strength.strength.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedEntry?.id === entry.id && (
                <div style={{ borderTop: '1px solid rgba(59, 130, 246, 0.2)', paddingTop: '16px' }}>
                  {/* Password Field */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                      Password:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        color: '#f1f5f9',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        wordBreak: 'break-all'
                      }}>
                        {isPasswordVisible ? entry.password : '••••••••••••••••'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePasswordVisibility(entry.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '4px'
                        }}
                      >
                        {isPasswordVisible ? '🙈' : '👁️'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(entry.password, 'password');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '4px'
                        }}
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>Created:</span>
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>{formatDate(entry.createdAt)}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>Updated:</span>
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>{formatDate(entry.updatedAt)}</div>
                    </div>
                  </div>

                  {/* Notes */}
                  {entry.notes && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                        Notes:
                      </label>
                      <div style={{ color: '#e2e8f0', fontSize: '14px' }}>
                        {entry.notes}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(entry.username, 'username');
                      }}
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#3b82f6',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Copy Username
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntry(entry.id);
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredEntries.length === 0 && searchQuery && (
        <div className="text-center" style={{ padding: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</div>
          <p style={{ color: '#94a3b8' }}>
            No passwords found for "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
};