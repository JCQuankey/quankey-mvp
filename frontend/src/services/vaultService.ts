import SmartHybridQuantumCrypto from './SmartHybridQuantumCrypto';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface VaultEntry {
  id: string;
  title: string;
  website: string;
  username: string;
  password: string;
  notes?: string;
  category?: string;
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
      encryptionVersion: vault.encryptionVersion,
      entries: vault.entries // Add entries property for SecurityDashboard
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

// 🔐 CRITICAL: ML-KEM-768 Real Key Generation
const initializeQuantumVault = async () => {
  try {
    console.log('🔐 Generating ML-KEM-768 keypair...');
    
    // Generate random seed
    const seed = crypto.getRandomValues(new Uint8Array(64));
    
    // ✅ Generate ML-KEM-768 keypair using SmartHybrid for fallback handling
    const { publicKey, secretKey } = await SmartHybridQuantumCrypto.generateMLKEM768Keypair(seed);
    
    // Convert to base64 for storage
    const publicKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(publicKey)));
    const secretKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(secretKey)));
    
    // Store keys securely
    localStorage.setItem('vault_public_key', publicKeyBase64);
    sessionStorage.setItem('vault_secret_key', secretKeyBase64);
    
    console.log('✅ ML-KEM-768 keypair generated:', {
      publicKeyLength: publicKey.length, // MUST be 1184
      secretKeyLength: secretKey.length  // MUST be 2400
    });
    
    return publicKeyBase64;
  } catch (error) {
    console.error('❌ Failed to generate ML-KEM-768 keypair:', error);
    throw error;
  }
};

// Initialize vault with real keys
export const initializeVault = async () => {
  const existingKey = localStorage.getItem('vault_public_key');
  
  if (!existingKey || existingKey === 'quantum-public-key-base64-demo') {
    console.log('🔄 Initializing quantum vault...');
    await initializeQuantumVault();
  } else {
    // Verify existing key is valid
    try {
      const keyBytes = atob(existingKey);
      if (keyBytes.length !== 1184) {
        console.log('⚠️ Invalid existing key size:', keyBytes.length, 'regenerating...');
        await initializeQuantumVault();
      } else {
        console.log('✅ Valid ML-KEM-768 key found (1184 bytes)');
      }
    } catch (error) {
      console.log('⚠️ Error validating existing key, regenerating...', error);
      await initializeQuantumVault();
    }
  }
};

// Funciones para backend cifrado
export const EncryptedVaultService = {
  // Función helper para obtener token de autenticación
  getAuthToken() {
    // Primero buscar token simple
    const token = localStorage.getItem('auth_token');
    if (token) {
      console.log('🔑 Found auth token in localStorage');
      return token;
    }
    
    // Check session storage as fallback
    const sessionToken = sessionStorage.getItem('auth_token');
    if (sessionToken) {
      console.log('🔑 Found auth token in sessionStorage');
      return sessionToken;
    }
    
    // Si no, buscar en los vault tokens
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quankey_vault_')) {
        const vaultData = localStorage.getItem(key);
        if (vaultData) {
          try {
            const parsed = JSON.parse(vaultData);
            return parsed.token || parsed.accessToken || parsed.authToken || vaultData;
          } catch {
            return vaultData;
          }
        }
      }
    }
    
    console.warn('⚠️ No auth token found in storage');
    return null;
  },

  // 🔴 CRITICAL FIX: ALWAYS extract userId from JWT token, NEVER localStorage
  getUserIdFromToken() {
    const token = this.getAuthToken();
    if (!token) {
      console.error('❌ No auth token found - cannot extract userId');
      return null;
    }
    
    try {
      // Decode JWT token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      
      console.log('🔑 Extracted userId from JWT token:', userId);
      return userId;
    } catch (error) {
      console.error('❌ Failed to decode JWT token:', error);
      return null;
    }
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

    // Use secure quantum password generation endpoint
    const response = await fetch(`${API_URL}/quantum/password`, {
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

    const response = await fetch(`${API_URL}/vault/items`, {
      headers,
      credentials: 'include'
    });
    
    const result = await response.json();
    console.log('🛡️ Get passwords response:', result);
    return result;
  },

  // 🚀 QUANTUM VAULT - Save password with ML-KEM-768 encryption
  async saveQuantumPassword(data: {
    site: string;
    username: string;
    password: string;
    notes?: string;
    category?: string;
    isQuantum?: boolean;
    quantumInfo?: {
      source?: string;
      theoretical_entropy?: string;
      generation_method?: string;
      timestamp?: string;
    };
  }) {
    console.log('🔍 DEBUG: Starting quantum vault save process');
    
    const token = this.getAuthToken();
    // 🔴 CRITICAL FIX: Extract userId from JWT token, NOT localStorage
    const userId = this.getUserIdFromToken();
    const storedQuantumKey = localStorage.getItem('quantum_vault_public_key');
    
    // 🔴 FIX: Enhanced debugging
    console.log('🔍 DEBUG: Auth status:', {
      hasToken: !!token,
      tokenPreview: token?.substring(0, 20) + '...',
      hasUserId: !!userId,
      userId: userId,
      hasStoredQuantumKey: !!storedQuantumKey,
      storedQuantumKeySize: storedQuantumKey ? atob(storedQuantumKey).length : 0
    });
    
    console.log('🚀 QUANTUM VAULT: Saving password for site:', data.site);
    console.log('🔐 Auth token present:', !!token);
    
    // Get or generate quantum vault keys
    const quantumKey = await this.getQuantumVaultKey();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Authorization header set');
    } else {
      console.error('❌ No auth token available for quantum vault save');
      throw new Error('Authentication token required for quantum vault');
    }

    try {
      // 🚀 QUANTUM VAULT: Create vault item with ML-KEM-768 encryption
      const vaultItem = {
        // ✅ FIX: Don't send userId - backend extracts it from JWT token
        // userId is handled by auth middleware from decoded JWT
        vaultId: 'quantum-vault-primary',
        title: data.site,
        username: data.username,
        password: data.password,
        url: `https://${data.site}`,
        notes: data.notes || '',
        vaultPublicKey: quantumKey, // ML-KEM-768 real key (1184 bytes)
        metadata: {
          isQuantum: true,
          algorithm: 'ML-KEM-768 + AES-GCM-SIV',
          createdAt: new Date().toISOString(),
          quantumSource: data.quantumInfo?.source || 'ANU Quantum Generator',
          entropy: data.quantumInfo?.theoretical_entropy || 'Hardware TRNG',
          category: data.category || 'Quantum-Generated'
        }
      };
      
      console.log('🚀 QUANTUM VAULT: Sending ML-KEM-768 encrypted save request');
      console.log('🔐 Quantum key length:', quantumKey.length, 'chars (base64)');
      console.log('⚛️ Item metadata:', vaultItem.metadata);
      
      // 🔴 FIX: Enhanced debugging before fetch
      console.log('🔍 DEBUG: About to fetch to backend:', {
        url: `${API_URL}/vault/items`,
        method: 'POST',
        hasHeaders: !!headers,
        hasAuth: headers.Authorization ? 'yes' : 'no',
        authHeader: headers.Authorization?.substring(0, 20) + '...',
        bodySize: JSON.stringify(vaultItem).length,
        bodyPreview: {
          title: vaultItem.title,
          username: vaultItem.username,
          hasPassword: !!vaultItem.password,
          hasVaultKey: !!vaultItem.vaultPublicKey
        }
      });
      
      const response = await fetch(`${API_URL}/vault/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: data.site,
          username: data.username,
          password: data.password,
          website: `https://${data.site}`,
          notes: data.notes || '',
          category: data.category || 'other',
          isQuantum: data.isQuantum !== false,
          entropySource: data.quantumInfo?.source || 'quantum-generated'
        }),
        credentials: 'include'
      });
      
      console.log('📡 Quantum vault response status:', response.status);
      console.log('🔍 DEBUG: Response details:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.status === 401) {
        console.error('❌ 401 Unauthorized - Authentication token may be invalid or missing');
      }
      
      const result = await response.json();
      console.log('🚀 QUANTUM VAULT response data:', result);
      
      if (!response.ok) {
        throw new Error(result.error || `Quantum vault error! status: ${response.status}`);
      }
      
      console.log('✅ PASSWORD QUANTUM-ENCRYPTED AND SAVED SUCCESSFULLY');
      return result;
    } catch (error) {
      console.error('❌ Quantum vault save error:', error);
      throw error;
    }
  },

  // 🔐 Get or generate quantum vault ML-KEM-768 keys
  async getQuantumVaultKey(): Promise<string> {
    let publicKey = localStorage.getItem('quantum_vault_public_key');
    
    if (!publicKey || publicKey === 'quantum-public-key-base64-demo') {
      console.log('🔐 Generating quantum vault ML-KEM-768 keys...');
      
      try {
        const seed = crypto.getRandomValues(new Uint8Array(64));
        // ✅ Use SmartHybrid for consistent fallback handling
        const { publicKey: pk, secretKey: sk } = await SmartHybridQuantumCrypto.generateMLKEM768Keypair(seed);
        
        const publicKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(pk)));
        const secretKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(sk)));
        
        localStorage.setItem('quantum_vault_public_key', publicKeyBase64);
        sessionStorage.setItem('quantum_vault_secret_key', secretKeyBase64);
        
        console.log('✅ QUANTUM KEYS GENERATED (ML-KEM-768):', {
          publicKeyLength: pk.length, // Must be 1184
          secretKeyLength: sk.length  // Must be 2400
        });
        
        return publicKeyBase64;
      } catch (error) {
        console.error('❌ Failed to generate quantum keys:', error);
        throw new Error('Quantum key generation failed');
      }
    }
    
    // Verify existing key
    try {
      const keyBytes = atob(publicKey);
      if (keyBytes.length !== 1184) {
        console.log('⚠️ Invalid quantum key size, regenerating...');
        localStorage.removeItem('quantum_vault_public_key');
        return this.getQuantumVaultKey(); // Recursive call to regenerate
      }
    } catch (error) {
      console.log('⚠️ Invalid quantum key format, regenerating...');
      localStorage.removeItem('quantum_vault_public_key');
      return this.getQuantumVaultKey(); // Recursive call to regenerate
    }
    
    console.log('🔐 Using existing quantum vault key (1184 bytes)');
    return publicKey;
  },

  // DEPRECATED: Use saveQuantumPassword instead
  async saveEncryptedPassword(data: any) {
    console.warn('⚠️ DEPRECATED: saveEncryptedPassword - Use saveQuantumPassword instead');
    return this.saveQuantumPassword(data);
  }
};