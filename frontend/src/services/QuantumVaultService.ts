import SmartHybridQuantumCrypto from './SmartHybridQuantumCrypto';

/**
 * 🔐 QUANTUM VAULT SERVICE - ARQUITECTURA REALISTA PQC
 * 
 * CORRECCIÓN CRÍTICA:
 * - Cada DISPOSITIVO genera su propio par ML-KEM-768
 * - Master Key se ENVUELVE para cada dispositivo registrado
 * - Items del vault se cifran con DEK + Master Key
 * - NO derivamos claves de biometría (conceptualmente incorrecto)
 * 
 * FLUJO CORRECTO:
 * 1. Dispositivo genera par PQC localmente
 * 2. Servidor envuelve MK con clave pública del dispositivo
 * 3. Solo el dispositivo puede desencapsular su MK
 * 4. Items se cifran con DEK envueltas por MK
 */

// ⚠️ GOLDEN RULE: REAL ML-KEM-768 + ML-DSA-65 ONLY - NO SIMULATIONS
// Using @noble/post-quantum for NIST-approved post-quantum cryptography

export interface DeviceKeyPair {
  publicKey: Uint8Array;   // ML-KEM-768 public key (1184 bytes)
  secretKey: Uint8Array;   // ML-KEM-768 secret key (2400 bytes)
}

export interface EncapsulationResult {
  ciphertext: Uint8Array;  // Encapsulated key
  sharedSecret: Uint8Array; // 32-byte shared secret
}

export interface VaultItem {
  id: string;
  site: string;
  username: string;
  password: string;
  notes?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EncryptedVaultItem {
  id: string;
  encryptedData: string;   // Item cifrado con DEK
  wrappedDEK: string;      // DEK envuelto con Master Key
  iv: string;              // IV para ChaCha20-Poly1305
  tag: string;             // Authentication tag
  algorithm: string;       // 'ChaCha20-Poly1305'
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisteredDevice {
  id: string;
  name: string;
  publicKey: string;       // Base64 encoded ML-KEM-768 public key
  registered: Date;
  lastUsed?: Date;
}

export class QuantumVaultService {
  private static readonly API_BASE = 'https://quankey.xyz/api';
  private static readonly DEVICE_KEY_STORAGE = 'device-pqc-keys';
  private static readonly MASTER_KEY_STORAGE = 'master-key-cache';

  /**
   * 🔐 REGISTER NEW DEVICE - Genera par ML-KEM-768
   */
  static async registerDevice(deviceName: string): Promise<RegisteredDevice> {
    console.log(`🔐 Registering device with PQC: ${deviceName}`);

    try {
      // 1. Generate ML-KEM-768 keypair for this device
      const deviceKeys = await this.generateMLKEM768KeyPair();

      // 2. Register device public key with server
      const response = await fetch(`${this.API_BASE}/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          deviceName,
          publicKey: this.uint8ArrayToBase64(deviceKeys.publicKey),
          algorithm: 'ML-KEM-768'
        })
      });

      if (!response.ok) {
        throw new Error(`Device registration failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Device registration failed');
      }

      // 3. Store device private key locally (secure storage)
      await this.storeDevicePrivateKey(deviceKeys.secretKey);

      // 4. Get wrapped Master Key for this device
      const wrappedMK = await this.getWrappedMasterKey(result.device.id);
      
      // 5. Decapsulate Master Key
      const masterKey = await this.decapsulateMasterKey(wrappedMK, deviceKeys.secretKey);
      
      // 6. Cache Master Key securely
      await this.storeMasterKey(masterKey);

      console.log(`✅ Device registered with PQC: ${result.device.id}`);

      return {
        id: result.device.id,
        name: result.device.name,
        publicKey: result.device.publicKey,
        registered: new Date(result.device.registered),
        lastUsed: result.device.lastUsed ? new Date(result.device.lastUsed) : undefined
      };

    } catch (error) {
      console.error('❌ Device registration failed:', error);
      throw new Error(`Device registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 🔑 GET WRAPPED MASTER KEY - Servidor envuelve MK para este dispositivo
   */
  static async getWrappedMasterKey(deviceId: string): Promise<string> {
    const response = await fetch(`${this.API_BASE}/vault/wrapped-key/${deviceId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get wrapped master key');
    }

    const result = await response.json();
    return result.wrappedMasterKey;
  }

  /**
   * 🔓 ENCRYPT VAULT ITEM - DEK + Master Key pattern
   */
  static async encryptVaultItem(item: VaultItem): Promise<EncryptedVaultItem> {
    try {
      // 1. Get Master Key
      const masterKey = await this.getMasterKey();

      // 2. Generate unique DEK for this item
      const dek = crypto.getRandomValues(new Uint8Array(32));

      // 3. Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12)); // ChaCha20-Poly1305 needs 12-byte IV

      // 4. Encrypt item with DEK using ChaCha20-Poly1305
      const itemData = JSON.stringify({
        site: item.site,
        username: item.username,
        password: item.password,
        notes: item.notes,
        category: item.category
      });

      const encryptedData = await this.chaCha20Poly1305Encrypt(
        new TextEncoder().encode(itemData),
        dek,
        iv
      );

      // 5. Wrap DEK with Master Key
      const dekIV = crypto.getRandomValues(new Uint8Array(12));
      const wrappedDEK = await this.chaCha20Poly1305Encrypt(dek, masterKey, dekIV);

      return {
        id: item.id,
        encryptedData: this.uint8ArrayToBase64(encryptedData.ciphertext),
        wrappedDEK: this.uint8ArrayToBase64(wrappedDEK.ciphertext),
        iv: this.uint8ArrayToBase64(iv),
        tag: this.uint8ArrayToBase64(encryptedData.tag),
        algorithm: 'ChaCha20-Poly1305',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };

    } catch (error) {
      console.error('❌ Vault item encryption failed:', error);
      throw new Error('Failed to encrypt vault item');
    }
  }

  /**
   * 🔓 DECRYPT VAULT ITEM - DEK + Master Key pattern
   */
  static async decryptVaultItem(encryptedItem: EncryptedVaultItem): Promise<VaultItem> {
    try {
      // 1. Get Master Key
      const masterKey = await this.getMasterKey();

      // 2. Unwrap DEK
      const wrappedDEKBytes = this.base64ToUint8Array(encryptedItem.wrappedDEK);
      const dek = await this.chaCha20Poly1305Decrypt(wrappedDEKBytes, masterKey);

      // 3. Decrypt item data
      const encryptedDataBytes = this.base64ToUint8Array(encryptedItem.encryptedData);
      const iv = this.base64ToUint8Array(encryptedItem.iv);
      const tag = this.base64ToUint8Array(encryptedItem.tag);

      const decryptedData = await this.chaCha20Poly1305Decrypt(
        encryptedDataBytes,
        dek,
        iv,
        tag
      );

      const itemData = JSON.parse(new TextDecoder().decode(decryptedData));

      return {
        id: encryptedItem.id,
        site: itemData.site,
        username: itemData.username,
        password: itemData.password,
        notes: itemData.notes,
        category: itemData.category,
        createdAt: encryptedItem.createdAt,
        updatedAt: encryptedItem.updatedAt
      };

    } catch (error) {
      console.error('❌ Vault item decryption failed:', error);
      throw new Error('Failed to decrypt vault item');
    }
  }

  /**
   * 📱 GET REGISTERED DEVICES
   */
  static async getRegisteredDevices(): Promise<RegisteredDevice[]> {
    const response = await fetch(`${this.API_BASE}/devices/list`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get registered devices');
    }

    const result = await response.json();
    
    return result.devices.map((device: any) => ({
      id: device.id,
      name: device.name,
      publicKey: device.publicKey,
      registered: new Date(device.registered),
      lastUsed: device.lastUsed ? new Date(device.lastUsed) : undefined
    }));
  }

  /**
   * 🗑️ REVOKE DEVICE
   */
  static async revokeDevice(deviceId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/devices/${deviceId}/revoke`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to revoke device');
    }

    console.log(`🗑️ Device revoked: ${deviceId}`);
  }

  // =========================================
  // PRIVATE CRYPTOGRAPHIC METHODS
  // =========================================

  /**
   * 🔑 GENERATE ML-KEM-768 KEYPAIR
   * ✅ REAL @noble/post-quantum implementation
   */
  private static async generateMLKEM768KeyPair(): Promise<DeviceKeyPair> {
    // 🔐 REAL ML-KEM-768 keypair generation - NO SIMULATIONS
    // ✅ Use SmartHybridQuantumCrypto for consistent fallback handling
    const seed = crypto.getRandomValues(new Uint8Array(64));
    const keypair = await SmartHybridQuantumCrypto.generateMLKEM768Keypair(seed);
    
    return { 
      publicKey: keypair.publicKey, 
      secretKey: keypair.secretKey 
    };
  }

  /**
   * 🔓 DECAPSULATE MASTER KEY
   * ✅ REAL ML-KEM-768 decapsulation - NO SIMULATIONS
   */
  private static async decapsulateMasterKey(
    wrappedMK: string, 
    deviceSecretKey: Uint8Array
  ): Promise<Uint8Array> {
    // 🔐 REAL ML-KEM-768 decapsulation - NO SIMULATIONS
    // ✅ Use SmartHybridQuantumCrypto for consistent fallback handling
    const wrappedBytes = this.base64ToUint8Array(wrappedMK);
    
    // Real ML-KEM-768 decapsulation
    const masterKey = await SmartHybridQuantumCrypto.decapsulateMLKEM768(wrappedBytes, deviceSecretKey);
    
    return masterKey;
  }

  /**
   * 🔒 ChaCha20-Poly1305 ENCRYPT
   * ✅ REAL ChaCha20-Poly1305 - NO AES SUBSTITUTES
   */
  private static async chaCha20Poly1305Encrypt(
    data: Uint8Array, 
    key: Uint8Array, 
    iv: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; tag: Uint8Array }> {
    // 🔐 REAL ChaCha20-Poly1305 encryption - NO AES SUBSTITUTES
    const { chacha20poly1305 } = await import('@noble/ciphers/chacha.js');
    
    const cipher = chacha20poly1305(key, iv);
    const encrypted = cipher.encrypt(data);
    
    // ChaCha20-Poly1305 returns ciphertext + tag concatenated
    const ciphertext = encrypted.slice(0, -16);
    const tag = encrypted.slice(-16);
    
    return { ciphertext, tag };
  }

  /**
   * 🔓 ChaCha20-Poly1305 DECRYPT
   * ✅ REAL ChaCha20-Poly1305 - NO AES SUBSTITUTES
   */
  private static async chaCha20Poly1305Decrypt(
    ciphertext: Uint8Array,
    key: Uint8Array,
    iv?: Uint8Array,
    tag?: Uint8Array
  ): Promise<Uint8Array> {
    // 🔐 REAL ChaCha20-Poly1305 decryption - NO AES SUBSTITUTES
    const { chacha20poly1305 } = await import('@noble/ciphers/chacha.js');
    
    const cipher = chacha20poly1305(key, iv || new Uint8Array(12));
    
    // Combine ciphertext and tag for ChaCha20-Poly1305 decryption
    const combined = new Uint8Array(ciphertext.length + (tag?.length || 16));
    combined.set(ciphertext);
    if (tag) combined.set(tag, ciphertext.length);

    const decrypted = cipher.decrypt(combined);
    
    return decrypted;
  }

  /**
   * 💾 STORE DEVICE PRIVATE KEY
   */
  private static async storeDevicePrivateKey(secretKey: Uint8Array): Promise<void> {
    // Store in IndexedDB with encryption
    const encrypted = await this.encryptForStorage(secretKey);
    localStorage.setItem(this.DEVICE_KEY_STORAGE, this.uint8ArrayToBase64(encrypted));
  }

  /**
   * 🔑 GET DEVICE PRIVATE KEY
   */
  private static async getDevicePrivateKey(): Promise<Uint8Array> {
    const stored = localStorage.getItem(this.DEVICE_KEY_STORAGE);
    if (!stored) {
      throw new Error('Device private key not found');
    }

    const encrypted = this.base64ToUint8Array(stored);
    return await this.decryptFromStorage(encrypted);
  }

  /**
   * 💾 STORE MASTER KEY
   */
  private static async storeMasterKey(masterKey: Uint8Array): Promise<void> {
    const encrypted = await this.encryptForStorage(masterKey);
    sessionStorage.setItem(this.MASTER_KEY_STORAGE, this.uint8ArrayToBase64(encrypted));
  }

  /**
   * 🔑 GET MASTER KEY
   */
  private static async getMasterKey(): Promise<Uint8Array> {
    const stored = sessionStorage.getItem(this.MASTER_KEY_STORAGE);
    if (!stored) {
      throw new Error('Master key not available - device not registered');
    }

    const encrypted = this.base64ToUint8Array(stored);
    return await this.decryptFromStorage(encrypted);
  }

  /**
   * 🔒 ENCRYPT FOR LOCAL STORAGE
   */
  private static async encryptForStorage(data: Uint8Array): Promise<Uint8Array> {
    // Use a derived key for local storage encryption
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('quankey-device-storage-key'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('quankey-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      data
    );

    // Prepend IV to encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);

    return result;
  }

  /**
   * 🔓 DECRYPT FROM LOCAL STORAGE
   */
  private static async decryptFromStorage(encryptedData: Uint8Array): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('quankey-device-storage-key'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('quankey-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      ciphertext
    );

    return new Uint8Array(decrypted);
  }

  /**
   * 🔄 UTILITY METHODS
   */
  private static uint8ArrayToBase64(bytes: Uint8Array): string {
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
  }

  private static base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
  }
}

export default QuantumVaultService;