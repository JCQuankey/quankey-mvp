import React, { useState } from 'react';
import { VaultService, VaultEntry } from '../services/vaultService';
import { useToast } from './ToastNotification';
import { LoadingSpinner, InlineSpinner } from './LoadingSpinner';
import {
  DownloadIcon,
  UploadIcon,
  FileIcon,
  CheckIcon,
  WarningIcon,
  QuantumIcon
} from './QuankeyIcons';

interface CSVManagerProps {
  userId: string;
  entries: VaultEntry[];
  onImportComplete: () => void;
}

interface ImportPreview {
  valid: ImportRow[];
  invalid: ImportRow[];
  total: number;
}

interface ImportRow {
  title: string;
  website: string;
  username: string;
  password: string;
  notes?: string;
  category?: string;
  error?: string;
}

export const CSVManager: React.FC<CSVManagerProps> = ({ userId, entries, onImportComplete }) => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { success, error, warning, info } = useToast();

  // Export passwords to CSV
  const exportToCSV = async () => {
    if (entries.length === 0) {
      warning('No passwords to export');
      return;
    }

    setExporting(true);
    
    try {
      // CSV headers
      const headers = [
        'Title',
        'Website',
        'Username',
        'Password',
        'Notes',
        'Category',
        'Is Quantum',
        'Entropy Source',
        'Created Date',
        'Updated Date'
      ];

      // Convert entries to CSV format
      const csvRows = entries.map(entry => [
        entry.title,
        entry.website,
        entry.username,
        entry.password,
        entry.notes || '',
        entry.category || 'Uncategorized',
        entry.isQuantum ? 'Yes' : 'No',
        entry.entropy || 'Unknown',
        entry.createdAt.toISOString().split('T')[0],
        entry.updatedAt.toISOString().split('T')[0]
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => 
          row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `quankey-passwords-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success(`Exported ${entries.length} passwords to CSV file`);
    } catch (err) {
      console.error('Export error:', err);
      error('Failed to export passwords');
    } finally {
      setExporting(false);
    }
  };

  // Parse CSV file
  const parseCSV = (csvText: string): ImportRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: ImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      // Support multiple CSV formats
      let row: ImportRow;
      
      // Quankey format
      if (headers.includes('Title') && headers.includes('Website')) {
        row = {
          title: values[headers.indexOf('Title')] || `Import ${i}`,
          website: values[headers.indexOf('Website')] || '',
          username: values[headers.indexOf('Username')] || '',
          password: values[headers.indexOf('Password')] || '',
          notes: values[headers.indexOf('Notes')] || '',
          category: values[headers.indexOf('Category')] || 'Imported'
        };
      }
      // LastPass format
      else if (headers.includes('name') && headers.includes('url')) {
        row = {
          title: values[headers.indexOf('name')] || `Import ${i}`,
          website: values[headers.indexOf('url')] || '',
          username: values[headers.indexOf('username')] || '',
          password: values[headers.indexOf('password')] || '',
          notes: values[headers.indexOf('extra')] || '',
          category: values[headers.indexOf('grouping')] || 'Imported'
        };
      }
      // 1Password format
      else if (headers.includes('Title') && headers.includes('URL')) {
        row = {
          title: values[headers.indexOf('Title')] || `Import ${i}`,
          website: values[headers.indexOf('URL')] || '',
          username: values[headers.indexOf('Username')] || '',
          password: values[headers.indexOf('Password')] || '',
          notes: values[headers.indexOf('Notes')] || '',
          category: values[headers.indexOf('Type')] || 'Imported'
        };
      }
      // Generic format (first 4 columns)
      else {
        row = {
          title: values[0] || `Import ${i}`,
          website: values[1] || '',
          username: values[2] || '',
          password: values[3] || '',
          notes: values[4] || '',
          category: values[5] || 'Imported'
        };
      }

      // Validate row
      if (!row.password || !row.title) {
        row.error = 'Missing required fields (title or password)';
      }

      rows.push(row);
    }

    return rows;
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      error('Please select a CSV file');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsed = parseCSV(csvText);
        
        const valid = parsed.filter(row => !row.error);
        const invalid = parsed.filter(row => row.error);
        
        setImportPreview({
          valid,
          invalid,
          total: parsed.length
        });

        if (valid.length === 0) {
          warning('No valid passwords found in CSV file');
        } else {
          info(`Found ${valid.length} valid passwords ready to import${invalid.length > 0 ? ` (${invalid.length} invalid)` : ''}`);
        }
      } catch (err) {
        console.error('CSV parse error:', err);
        error('Failed to parse CSV file');
      }
    };

    reader.readAsText(file);
  };

  // Import validated passwords
  const importPasswords = async () => {
    if (!importPreview || importPreview.valid.length === 0) {
      warning('No valid passwords to import');
      return;
    }

    setImporting(true);

    try {
      let imported = 0;
      let failed = 0;

      for (const row of importPreview.valid) {
        try {
          const entry: Partial<VaultEntry> = {
            id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: row.title,
            website: row.website,
            username: row.username,
            password: row.password,
            notes: row.notes,
            category: row.category || 'Imported',
            isQuantum: false, // Imported passwords are not quantum-generated
            entropy: 'Imported from CSV',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          VaultService.saveEntry(userId, entry as VaultEntry);
          imported++;
        } catch (err) {
          console.error('Import entry error:', err);
          failed++;
        }
      }

      success(`Successfully imported ${imported} passwords${failed > 0 ? ` (${failed} failed)` : ''}`);
      
      // Clear preview and file
      setImportPreview(null);
      setSelectedFile(null);
      
      // Refresh parent component
      onImportComplete();
    } catch (err) {
      console.error('Import error:', err);
      error('Failed to import passwords');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(30, 58, 95, 0.9))',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(0, 166, 251, 0.3)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <FileIcon size={24} color="var(--quankey-primary)" />
        <h3 style={{
          color: 'var(--quankey-gray-light)',
          fontSize: '18px',
          margin: 0
        }}>
          Import & Export
        </h3>
      </div>

      {/* Export Section */}
      <div style={{
        marginBottom: '32px',
        padding: '20px',
        background: 'rgba(0, 166, 251, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 166, 251, 0.2)'
      }}>
        <h4 style={{
          color: 'var(--quankey-gray-light)',
          fontSize: '16px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <DownloadIcon size={18} color="var(--quankey-primary)" />
          Export Passwords
        </h4>
        <p style={{
          color: 'var(--quankey-gray)',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          Download your passwords as a CSV file compatible with other password managers.
        </p>
        <button
          onClick={exportToCSV}
          disabled={exporting || entries.length === 0}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: entries.length === 0 ? 'rgba(0, 0, 0, 0.3)' : 'var(--quankey-gradient)',
            color: entries.length === 0 ? 'var(--quankey-gray)' : 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: entries.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          {exporting ? (
            <>
              <InlineSpinner size={16} color="currentColor" />
              Exporting...
            </>
          ) : (
            <>
              <DownloadIcon size={16} color="currentColor" />
              Export CSV ({entries.length} passwords)
            </>
          )}
        </button>
      </div>

      {/* Import Section */}
      <div style={{
        padding: '20px',
        background: 'rgba(147, 51, 234, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(147, 51, 234, 0.2)'
      }}>
        <h4 style={{
          color: 'var(--quankey-gray-light)',
          fontSize: '16px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <UploadIcon size={18} color="var(--quankey-quantum)" />
          Import Passwords
        </h4>
        <p style={{
          color: 'var(--quankey-gray)',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          Import from LastPass, 1Password, or other password managers. Supports CSV format.
        </p>

        {/* File Selection */}
        <div style={{
          marginBottom: '20px'
        }}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="csv-file-input"
          />
          <label
            htmlFor="csv-file-input"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(147, 51, 234, 0.3)',
              background: 'rgba(147, 51, 234, 0.1)',
              color: 'var(--quankey-quantum)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
            }}
          >
            <UploadIcon size={16} color="currentColor" />
            {selectedFile ? selectedFile.name : 'Choose CSV File'}
          </label>
        </div>

        {/* Import Preview */}
        {importPreview && (
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 166, 251, 0.2)'
          }}>
            <h5 style={{
              color: 'var(--quankey-gray-light)',
              fontSize: '14px',
              marginBottom: '12px'
            }}>
              Import Preview
            </h5>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckIcon size={16} color="var(--quankey-success)" />
                <span style={{ color: 'var(--quankey-success)', fontSize: '14px' }}>
                  {importPreview.valid.length} valid
                </span>
              </div>
              
              {importPreview.invalid.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <WarningIcon size={16} color="var(--quankey-error)" />
                  <span style={{ color: 'var(--quankey-error)', fontSize: '14px' }}>
                    {importPreview.invalid.length} invalid
                  </span>
                </div>
              )}
            </div>

            {/* Sample Valid Entries */}
            {importPreview.valid.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  color: 'var(--quankey-gray)',
                  fontSize: '12px',
                  marginBottom: '8px'
                }}>
                  Preview (first 3 entries):
                </div>
                {importPreview.valid.slice(0, 3).map((entry, index) => (
                  <div key={index} style={{
                    padding: '8px',
                    background: 'rgba(0, 255, 136, 0.1)',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: 'var(--quankey-gray-light)'
                  }}>
                    <strong>{entry.title}</strong> - {entry.website} ({entry.username})
                  </div>
                ))}
              </div>
            )}

            {/* Invalid Entries */}
            {importPreview.invalid.length > 0 && (
              <div>
                <div style={{
                  color: 'var(--quankey-error)',
                  fontSize: '12px',
                  marginBottom: '8px'
                }}>
                  Invalid entries:
                </div>
                {importPreview.invalid.slice(0, 3).map((entry, index) => (
                  <div key={index} style={{
                    padding: '8px',
                    background: 'rgba(255, 59, 48, 0.1)',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: 'var(--quankey-error)'
                  }}>
                    <strong>{entry.title || 'Unnamed'}</strong> - {entry.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import Button */}
        {importPreview && importPreview.valid.length > 0 && (
          <button
            onClick={importPasswords}
            disabled={importing}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--quankey-gradient)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: importing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {importing ? (
              <>
                <InlineSpinner size={16} color="currentColor" />
                Importing...
              </>
            ) : (
              <>
                <QuantumIcon size={16} color="currentColor" />
                Import {importPreview.valid.length} passwords
              </>
            )}
          </button>
        )}

        {/* Compatibility Note */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(0, 166, 251, 0.1)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--quankey-gray)'
        }}>
          <strong>Supported formats:</strong> LastPass, 1Password, Chrome, Firefox, and generic CSV files.
          Imported passwords will be quantum-encrypted but not quantum-generated.
        </div>
      </div>
    </div>
  );
};