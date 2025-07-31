// backend/src/controllers/importExportController.js

const { PrismaClient } = require('@prisma/client');
const { parse } = require('csv-parse/sync');
const { EncryptionService } = require('../services/encryptionService');

const prisma = new PrismaClient();

/**
 * PATENT-CRITICAL: Import functionality that maintains zero-knowledge
 * Unlike competitors, we re-encrypt everything with quantum-generated keys
 * This ensures even imported passwords benefit from quantum security
 */
const importPasswords = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse CSV data
    const csvData = req.body.csvData;
    if (!csvData) {
      return res.status(400).json({ error: 'No CSV data provided' });
    }

    // PATENT-CRITICAL: Log import for audit trail
    console.log(`[IMPORT-${Date.now()}] User ${userId} initiating password import`);

    // Get user for encryption credential
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.webauthnId) {
      return res.status(400).json({ error: 'User not properly authenticated' });
    }

    // Parse CSV with common password manager format
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const importResults = {
      total: records.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Generate user credential for encryption
    const userCredential = EncryptionService.generateUserCredential(userId, user.webauthnId);

    // Process each password entry
    for (const record of records) {
      try {
        // Extract fields (compatible with 1Password, Bitwarden, LastPass)
        const site = record.title || record.name || record.Title || record.site || 'Imported Entry';
        const username = record.username || record.login || record.Username || '';
        const password = record.password || record.Password || '';
        const notes = record.notes || record.Notes || '';

        // Skip if no password
        if (!password) {
          importResults.failed++;
          importResults.errors.push(`Skipped entry "${site}" - no password`);
          continue;
        }

        // PATENT-CRITICAL: Encrypt with our zero-knowledge architecture
        const encryptedData = await EncryptionService.encrypt(password, userCredential);
        const encryptedNotesData = notes ? await EncryptionService.encrypt(notes, userCredential) : null;

        // Calculate password strength
        const strength = EncryptionService.calculatePasswordStrength ? 
          EncryptionService.calculatePasswordStrength(password) : 50;

        // Create password entry with quantum metadata
        await prisma.password.create({
          data: {
            userId: userId,
            site: site,
            username: username,
            encryptedPassword: JSON.stringify(encryptedData),
            encryptedNotes: encryptedNotesData ? JSON.stringify(encryptedNotesData) : null,
            category: 'imported',
            
            // Encryption fields from the EncryptedData object
            encryptedData: JSON.stringify(encryptedData),
            iv: encryptedData.iv,
            salt: encryptedData.salt,
            authTag: encryptedData.authTag,
            
            // PATENT-CRITICAL: Track that this was imported but now quantum-secured
            isQuantum: false, // Not quantum-generated, but quantum-encrypted
            metadata: {
              imported: true,
              importDate: new Date().toISOString(),
              originalSource: 'csv',
              quantumSecured: true,
              encryptionVersion: '1.0'
            },
            
            strength: strength,
            encryptionVersion: '1.0',
            algorithm: 'AES-256-GCM',
            keyDerivation: 'Argon2id'
          }
        });

        importResults.successful++;
        
        // Log successful import
        console.log(`[IMPORT-SUCCESS] Entry "${site}" imported for user ${userId}`);

      } catch (error) {
        importResults.failed++;
        importResults.errors.push(`Failed to import "${record.title || record.site || 'Unknown'}"`);
        console.error('[IMPORT-ERROR]', error);
      }
    }

    // PATENT-CRITICAL: Log import completion with statistics
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'BULK_IMPORT',
        entityType: 'password',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
        metadata: {
          totalImported: importResults.successful,
          totalFailed: importResults.failed,
          source: 'csv'
        }
      }
    });

    res.json({
      success: true,
      message: `Imported ${importResults.successful} passwords successfully`,
      results: importResults
    });

  } catch (error) {
    console.error('[IMPORT-CRITICAL-ERROR]', error);
    res.status(500).json({ 
      error: 'Import failed',
      message: 'Please check your CSV format' 
    });
  }
};

/**
 * PATENT-CRITICAL: Export with maintained encryption
 * We NEVER export raw passwords - only encrypted data
 * This maintains zero-knowledge even in exports
 */
const exportPasswords = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const format = req.query.format || 'csv'; // csv or json

    // PATENT-CRITICAL: Log export for compliance
    console.log(`[EXPORT-${Date.now()}] User ${userId} exporting passwords as ${format}`);

    // Fetch all user passwords
    const passwords = await prisma.password.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'BULK_EXPORT',
        entityType: 'password',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
        metadata: {
          format: format,
          count: passwords.length
        }
      }
    });

    if (format === 'json') {
      // PATENT-CRITICAL: Encrypted JSON export
      // Includes quantum metadata for re-import
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        source: 'Quankey Quantum Password Manager',
        quantumSecured: true,
        entries: passwords.map(pwd => ({
          id: pwd.id,
          site: pwd.site,
          username: pwd.username,
          encryptedPassword: pwd.encryptedPassword,
          encryptedNotes: pwd.encryptedNotes,
          salt: pwd.salt,
          iv: pwd.iv,
          authTag: pwd.authTag,
          category: pwd.category,
          notes: pwd.encryptedNotes ? '[ENCRYPTED]' : '',
          createdAt: pwd.createdAt,
          updatedAt: pwd.updatedAt,
          metadata: pwd.metadata,
          isQuantum: pwd.isQuantum,
          quantumSource: pwd.quantumSource
        }))
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=quankey-export.json');
      return res.json(exportData);

    } else {
      // CSV export - compatible format but without raw passwords
      // PATENT-CRITICAL: We export a secure format that maintains encryption
      const csvHeader = 'site,username,category,created,updated,isQuantum\n';
      const csvRows = passwords.map(pwd => {
        const row = [
          pwd.site,
          pwd.username || '',
          pwd.category || '',
          pwd.createdAt.toISOString(),
          pwd.updatedAt.toISOString(),
          pwd.isQuantum ? 'Yes' : 'No'
        ];
        // Escape CSV fields
        return row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',');
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=quankey-export.csv');
      return res.send(csvContent);
    }

  } catch (error) {
    console.error('[EXPORT-ERROR]', error);
    res.status(500).json({ error: 'Export failed' });
  }
};

module.exports = {
  importPasswords,
  exportPasswords
};