// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'https://api.quankey.xyz';

export interface VaultEntry {
  id: string;
  title: string;
  website: string;
  username: string;
  password: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isQuantum: boolean;
  entropy?: string;
}

export interface VaultData {
  entries: VaultEntry[];
  userId: string;
  encryptionVersion: string;
  lastSync: Date;
}

export class VaultService {
  private static readonly STORAGE_KEY = 'quankey_vault_';
  
  // Get vault for specific user
  static getVault(userId: string): VaultData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY + userId);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.entries = parsed.entries.map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }));
        parsed.lastSync = new Date(parsed.lastSync);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading vault:', error);
    }
    
    // Return empty vault if none exists
    return {
      entries: [],
      userId,
      encryptionVersion: '1.0',
      lastSync: new Date()
    };
  }

  // Save vault for specific user
  static saveVault(vault: VaultData): boolean {
    try {
      vault.lastSync = new Date();
      const serialized = JSON.stringify(vault);
      localStorage.setItem(this.STORAGE_KEY + vault.userId, serialized);
      console.log(`💾 Vault saved for user: ${vault.userId}`);
      return true;
    } catch (error) {
      console.error('Error saving vault:', error);
      return false;
    }
  }

  // Add new entry to vault
  static addEntry(userId: string, entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>): VaultEntry {
    const vault = this.getVault(userId);
    
    const newEntry: VaultEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vault.entries.push(newEntry);
    this.saveVault(vault);
    
    console.log(`✅ Added new entry: ${newEntry.title}`);
    return newEntry;
  }

  // Update existing entry
  static updateEntry(userId: string, entryId: string, updates: Partial<VaultEntry>): boolean {
    const vault = this.getVault(userId);
    const entryIndex = vault.entries.findIndex(e => e.id === entryId);
    
    if (entryIndex === -1) {
      console.error('Entry not found for update');
      return false;
    }
    
    vault.entries[entryIndex] = {
      ...vault.entries[entryIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveVault(vault);
    console.log(`📝 Updated entry: ${vault.entries[entryIndex].title}`);
    return true;
  }

  // Delete entry
  static deleteEntry(userId: string, entryId: string): boolean {
    const vault = this.getVault(userId);
    const entryIndex = vault.entries.findIndex(e => e.id === entryId);
    
    if (entryIndex === -1) {
      console.error('Entry not found for deletion');
      return false;
    }
    
    const deletedEntry = vault.entries[entryIndex];
    vault.entries.splice(entryIndex, 1);
    this.saveVault(vault);
    
    console.log(`🗑️ Deleted entry: ${deletedEntry.title}`);
    return true;
  }

  // Search entries
  static searchEntries(userId: string, query: string): VaultEntry[] {
    const vault = this.getVault(userId);
    const lowercaseQuery = query.toLowerCase();
    
    return vault.entries.filter(entry =>
      entry.title.toLowerCase().includes(lowercaseQuery) ||
      entry.website.toLowerCase().includes(lowercaseQuery) ||
      entry.username.toLowerCase().includes(lowercaseQuery) ||
      (entry.notes && entry.notes.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Get entries by website
  static getEntriesByWebsite(userId: string, website: string): VaultEntry[] {
    const vault = this.getVault(userId);
    const normalizedWebsite = this.normalizeWebsite(website);
    
    return vault.entries.filter(entry =>
      this.normalizeWebsite(entry.website) === normalizedWebsite
    );
  }

  // Get all entries sorted by last updated
  static getAllEntries(userId: string): VaultEntry[] {
    const vault = this.getVault(userId);
    return vault.entries.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Get vault statistics
  static getVaultStats(userId: string) {
    const vault = this.getVault(userId);
    const quantumCount = vault.entries.filter(e => e.isQuantum).length;
    const classicCount = vault.entries.length - quantumCount;
    
    return {
      totalEntries: vault.entries.length,
      quantumPasswords: quantumCount,
      classicPasswords: classicCount,
      lastSync: vault.lastSync,
      encryptionVersion: vault.encryptionVersion
    };
  }

  // Export vault (for backup)
  static exportVault(userId: string): string {
    const vault = this.getVault(userId);
    return JSON.stringify(vault, null, 2);
  }

  // Import vault (from backup)
  static importVault(userId: string, vaultData: string): boolean {
    try {
      const parsed = JSON.parse(vaultData);
      
      // Validate structure
      if (!parsed.entries || !Array.isArray(parsed.entries)) {
        throw new Error('Invalid vault format');
      }
      
      // Update user ID and save
      parsed.userId = userId;
      parsed.lastSync = new Date();
      
      // Convert date strings back to Date objects
      parsed.entries = parsed.entries.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));
      
      this.saveVault(parsed);
      console.log(`📥 Imported vault with ${parsed.entries.length} entries`);
      return true;
    } catch (error) {
      console.error('Error importing vault:', error);
      return false;
    }
  }

  // Clear all vault data for user (for logout)
  static clearVault(userId: string): void {
    localStorage.removeItem(this.STORAGE_KEY + userId);
    console.log(`🧹 Cleared vault for user: ${userId}`);
  }

  // Private helper methods
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static normalizeWebsite(website: string): string {
    return website.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  // Password strength analysis
  static analyzePassword(password: string) {
    const length = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    let score = 0;
    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    if (hasLower) score += 1;
    if (hasUpper) score += 1;
    if (hasNumbers) score += 1;
    if (hasSymbols) score += 1;
    
    const strength = score <= 2 ? 'Weak' : score <= 4 ? 'Medium' : score <= 6 ? 'Strong' : 'Very Strong';
    const entropy = Math.log2(Math.pow(94, length)).toFixed(1);
    
    return {
      score,
      strength,
      entropy: entropy + ' bits',
      recommendations: this.getPasswordRecommendations(password, hasLower, hasUpper, hasNumbers, hasSymbols, length)
    };
  }

  private static getPasswordRecommendations(
    password: string,
    hasLower: boolean,
    hasUpper: boolean,
    hasNumbers: boolean,
    hasSymbols: boolean,
    length: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (length < 12) recommendations.push('Use at least 12 characters');
    if (!hasLower) recommendations.push('Include lowercase letters');
    if (!hasUpper) recommendations.push('Include uppercase letters');
    if (!hasNumbers) recommendations.push('Include numbers');
    if (!hasSymbols) recommendations.push('Include special symbols');
    
    return recommendations;
  }
}

// Funciones para backend cifrado
export const EncryptedVaultService = {
  // Función helper para obtener token de autenticación
  getAuthToken() {
    console.log('🚨 AUTH DEBUG VERSION 2.0 - GET TOKEN CALLED 🚨');
    console.log('🔍 [AUTH DEBUG] Getting auth token...');
    
    // Primero buscar token simple
    const token = localStorage.getItem('token');
    if (token) {
      console.log('✅ [AUTH DEBUG] Found simple token:', token.substring(0, 20) + '...');
      return token;
    }
    
    // Si no, buscar en los vault tokens
    console.log('🔍 [AUTH DEBUG] Searching vault tokens in localStorage...');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quankey_vault_')) {
        console.log('🔍 [AUTH DEBUG] Found vault key:', key);
        const vaultData = localStorage.getItem(key);
        if (vaultData) {
          try {
            const parsed = JSON.parse(vaultData);
            const foundToken = parsed.token || parsed.accessToken || parsed.authToken || vaultData;
            console.log('✅ [AUTH DEBUG] Found vault token:', foundToken.substring(0, 20) + '...');
            return foundToken;
          } catch {
            console.log('✅ [AUTH DEBUG] Found raw vault token:', vaultData.substring(0, 20) + '...');
            return vaultData;
          }
        }
      }
    }
    
    console.log('❌ [AUTH DEBUG] No token found in localStorage');
    return null;
  },

  // Generar contraseña cuántica - ACTUALIZADO PARA USAR LA RUTA CORRECTA
  async generateQuantumPassword(length: number = 16, includeSymbols: boolean = true) {
    const token = this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // CAMBIO IMPORTANTE: Usar la ruta quantum correcta
    const response = await fetch(`${API_URL}/api/quantum/password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ length, includeSymbols }),
      credentials: 'include'
    });
    
    const result = await response.json();
    console.log('🔮 Quantum generate response:', result);
    return result;
  },

  // Obtener contraseñas cifradas
  async getEncryptedPasswords() {
    const token = this.getAuthToken();
    
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/passwords/`, {
      headers,
      credentials: 'include'
    });
    
    const result = await response.json();
    console.log('🛡️ Get passwords response:', result);
    return result;
  },

  // Guardar contraseña cifrada
  async saveEncryptedPassword(data: {
    site: string;
    username: string;
    password: string;
    notes?: string;
    category?: string;
  }) {
    console.log('🚨 AUTH DEBUG VERSION 2.0 - SAVE PASSWORD STARTING 🚨');
    console.log('💾 [SAVE DEBUG] Starting saveEncryptedPassword...');
    console.log('💾 [SAVE DEBUG] Data:', { ...data, password: '[HIDDEN]' });
    console.log('💾 [SAVE DEBUG] API_URL:', API_URL);
    
    const token = this.getAuthToken();
    console.log('💾 [SAVE DEBUG] Token obtained:', token ? 'YES' : 'NO');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('💾 [SAVE DEBUG] Authorization header set with Bearer token');
    } else {
      console.log('❌ [SAVE DEBUG] NO TOKEN - Request will fail!');
    }
    
    console.log('💾 [SAVE DEBUG] Request headers:', headers);
    console.log('💾 [SAVE DEBUG] Full request URL:', `${API_URL}/api/passwords/save`);

    try {
      const response = await fetch(`${API_URL}/api/passwords/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      console.log('💾 [SAVE DEBUG] Response status:', response.status);
      console.log('💾 [SAVE DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 401) {
        console.error('❌ [SAVE DEBUG] 401 UNAUTHORIZED - Auth token rejected!');
        console.error('❌ [SAVE DEBUG] Token that was sent:', token?.substring(0, 30) + '...');
      }
      
      const result = await response.json();
      console.log('💾 [SAVE DEBUG] Save password response:', result);
      return result;
    } catch (error) {
      console.error('❌ [SAVE DEBUG] Request failed:', error);
      throw error;
    }
  }
};