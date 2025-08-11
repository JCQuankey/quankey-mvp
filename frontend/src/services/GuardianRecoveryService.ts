/**
 * 👥 GUARDIAN RECOVERY SERVICE - SHAMIR 2-DE-3
 * 
 * ARQUITECTURA REALISTA:
 * - Guardianes 2-de-3 para recuperación sin recovery codes
 * - Shamir Secret Sharing para dividir Master Key
 * - Cada guardián tiene share cifrado con su clave PQC
 * - Solo backup para pérdida total de dispositivos
 * 
 * FLUJO:
 * 1. Usuario divide Master Key en 3 shares (threshold 2)
 * 2. Cada share se cifra con clave pública del guardián
 * 3. Para recuperar: obtener 2 de 3 shares
 * 4. Combinar shares y recuperar Master Key
 */

// Note: In production, use @stablelib/shamir
// For now, implementing basic interface

export interface Guardian {
  id: string;
  name: string;
  email: string;
  publicKey: string;        // Base64 encoded ML-KEM-768 public key
  verified: boolean;
  addedAt: Date;
}

export interface GuardianShare {
  id: string;
  guardianId: string;
  shareIndex: number;       // 0, 1, or 2
  encryptedShare: string;   // Share cifrado con clave del guardián
  encapsulation: string;    // ML-KEM-768 encapsulation para el guardián
  createdAt: Date;
}

export interface RecoveryRequest {
  id: string;
  requesterDevice: string;
  sharesReceived: number;
  sharesNeeded: number;
  status: 'pending' | 'collecting' | 'ready' | 'completed' | 'failed';
  expiresAt: Date;
  createdAt: Date;
}

export interface RecoveryResult {
  success: boolean;
  deviceId?: string;
  error?: string;
  masterKeyRecovered?: boolean;
}

export class GuardianRecoveryService {
  private static readonly API_BASE = 'https://quankey.xyz/api';
  private static readonly THRESHOLD = 2;      // Need 2 of 3 shares
  private static readonly TOTAL_SHARES = 3;   // Generate 3 shares total

  /**
   * 👥 SETUP GUARDIANS - Divide Master Key en shares
   */
  static async setupGuardians(guardians: Guardian[]): Promise<void> {
    console.log(`👥 Setting up guardian recovery (${guardians.length} guardians)...`);

    try {
      if (guardians.length !== this.TOTAL_SHARES) {
        throw new Error(`Must provide exactly ${this.TOTAL_SHARES} guardians`);
      }

      // 1. Get current Master Key
      const { QuantumVaultService } = await import('./QuantumVaultService');
      const masterKey = await (QuantumVaultService as any).getMasterKey();

      // 2. Split Master Key using Shamir Secret Sharing
      const shares = await this.splitSecret(masterKey, this.TOTAL_SHARES, this.THRESHOLD);

      // 3. Encrypt each share with guardian's public key
      const encryptedShares: GuardianShare[] = [];
      
      for (let i = 0; i < guardians.length; i++) {
        const guardian = guardians[i];
        const share = shares[i];

        // Encrypt share with guardian's ML-KEM-768 public key
        const encryptedShare = await this.encryptShareForGuardian(
          share,
          guardian.publicKey
        );

        encryptedShares.push({
          id: this.generateId(),
          guardianId: guardian.id,
          shareIndex: i,
          encryptedShare: encryptedShare.ciphertext,
          encapsulation: encryptedShare.encapsulation,
          createdAt: new Date()
        });
      }

      // 4. Store encrypted shares on server
      const response = await fetch(`${this.API_BASE}/recovery/guardians/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          guardians,
          encryptedShares,
          threshold: this.THRESHOLD
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to setup guardians: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to setup guardians');
      }

      console.log(`✅ Guardian recovery setup complete (${this.THRESHOLD}/${this.TOTAL_SHARES} threshold)`);

    } catch (error) {
      console.error('❌ Failed to setup guardians:', error);
      throw new Error(`Failed to setup guardians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 📧 INVITE GUARDIAN
   */
  static async inviteGuardian(email: string, name: string): Promise<Guardian> {
    const response = await fetch(`${this.API_BASE}/recovery/guardians/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ email, name })
    });

    if (!response.ok) {
      throw new Error('Failed to invite guardian');
    }

    const result = await response.json();

    return {
      id: result.guardian.id,
      name: result.guardian.name,
      email: result.guardian.email,
      publicKey: result.guardian.publicKey,
      verified: result.guardian.verified,
      addedAt: new Date(result.guardian.addedAt)
    };
  }

  /**
   * 👥 GET GUARDIANS
   */
  static async getGuardians(): Promise<Guardian[]> {
    const response = await fetch(`${this.API_BASE}/recovery/guardians/list`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get guardians');
    }

    const result = await response.json();
    
    return result.guardians.map((g: any) => ({
      id: g.id,
      name: g.name,
      email: g.email,
      publicKey: g.publicKey,
      verified: g.verified,
      addedAt: new Date(g.addedAt)
    }));
  }

  /**
   * 🆘 REQUEST RECOVERY
   */
  static async requestRecovery(deviceInfo: {
    name: string;
    publicKey: string; // New device's ML-KEM-768 public key
  }): Promise<RecoveryRequest> {
    console.log('🆘 Requesting guardian recovery...');

    const response = await fetch(`${this.API_BASE}/recovery/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceInfo,
        threshold: this.THRESHOLD
      })
    });

    if (!response.ok) {
      throw new Error('Failed to request recovery');
    }

    const result = await response.json();

    return {
      id: result.request.id,
      requesterDevice: result.request.requesterDevice,
      sharesReceived: result.request.sharesReceived,
      sharesNeeded: result.request.sharesNeeded,
      status: result.request.status,
      expiresAt: new Date(result.request.expiresAt),
      createdAt: new Date(result.request.createdAt)
    };
  }

  /**
   * 🔑 PROVIDE GUARDIAN SHARE
   */
  static async provideGuardianShare(
    recoveryRequestId: string,
    guardianPrivateKey: string,
    shareData: { encryptedShare: string; encapsulation: string }
  ): Promise<void> {
    console.log(`🔑 Providing guardian share for recovery: ${recoveryRequestId}`);

    // 1. Decrypt the share using guardian's private key
    const decryptedShare = await this.decryptGuardianShare(
      shareData.encryptedShare,
      shareData.encapsulation,
      guardianPrivateKey
    );

    // 2. Submit share to recovery request
    const response = await fetch(`${this.API_BASE}/recovery/${recoveryRequestId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        share: this.uint8ArrayToBase64(decryptedShare)
      })
    });

    if (!response.ok) {
      throw new Error('Failed to provide guardian share');
    }

    console.log('✅ Guardian share provided successfully');
  }

  /**
   * 🔄 CHECK RECOVERY STATUS
   */
  static async checkRecoveryStatus(recoveryRequestId: string): Promise<RecoveryRequest> {
    const response = await fetch(`${this.API_BASE}/recovery/${recoveryRequestId}/status`);

    if (!response.ok) {
      throw new Error('Failed to check recovery status');
    }

    const result = await response.json();

    return {
      id: result.request.id,
      requesterDevice: result.request.requesterDevice,
      sharesReceived: result.request.sharesReceived,
      sharesNeeded: result.request.sharesNeeded,
      status: result.request.status,
      expiresAt: new Date(result.request.expiresAt),
      createdAt: new Date(result.request.createdAt)
    };
  }

  /**
   * ✅ COMPLETE RECOVERY
   */
  static async completeRecovery(
    recoveryRequestId: string,
    devicePrivateKey: Uint8Array
  ): Promise<RecoveryResult> {
    console.log(`✅ Completing recovery: ${recoveryRequestId}`);

    try {
      // 1. Get recovery data from server
      const response = await fetch(`${this.API_BASE}/recovery/${recoveryRequestId}/complete`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to complete recovery');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Recovery completion failed');
      }

      // 2. Combine shares to recover Master Key
      const shares = result.shares.map((s: string) => this.base64ToUint8Array(s));
      const recoveredMasterKey = await this.combineShares(shares);

      // 3. Store recovered Master Key
      const { QuantumVaultService } = await import('./QuantumVaultService');
      await (QuantumVaultService as any).storeMasterKey(recoveredMasterKey);

      // 4. Store device info
      localStorage.setItem('device_id', result.deviceId);

      console.log('✅ Recovery completed successfully');

      return {
        success: true,
        deviceId: result.deviceId,
        masterKeyRecovered: true
      };

    } catch (error) {
      console.error('❌ Recovery completion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Recovery completion failed'
      };
    }
  }

  /**
   * ❌ REVOKE GUARDIAN
   */
  static async revokeGuardian(guardianId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/recovery/guardians/${guardianId}/revoke`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to revoke guardian');
    }

    console.log(`❌ Guardian revoked: ${guardianId}`);
  }

  // =========================================
  // PRIVATE CRYPTOGRAPHIC METHODS
  // =========================================

  /**
   * ✂️ SPLIT SECRET - Shamir Secret Sharing
   * TODO: Use @stablelib/shamir when available
   */
  private static async splitSecret(
    secret: Uint8Array,
    totalShares: number,
    threshold: number
  ): Promise<Uint8Array[]> {
    // Simulate Shamir Secret Sharing
    // In production: const shares = split(secret, totalShares, threshold);
    
    console.log(`✂️ Splitting secret into ${totalShares} shares (threshold: ${threshold})`);

    // For now, create deterministic shares for testing
    const shares: Uint8Array[] = [];
    
    for (let i = 0; i < totalShares; i++) {
      // Simple XOR-based splitting (NOT secure - just for demo)
      const share = new Uint8Array(secret.length + 4); // +4 for share index
      
      // Store share index
      share[0] = i;
      share[1] = totalShares;
      share[2] = threshold;
      share[3] = 0; // Reserved
      
      // XOR secret with deterministic key for this share
      for (let j = 0; j < secret.length; j++) {
        share[j + 4] = secret[j] ^ ((i + 1) * (j + 1)) % 256;
      }
      
      shares.push(share);
    }

    return shares;
  }

  /**
   * 🔗 COMBINE SHARES - Reconstruct secret
   */
  private static async combineShares(shares: Uint8Array[]): Promise<Uint8Array> {
    // Simulate Shamir Secret Sharing reconstruction
    // In production: const secret = combine(shares);
    
    console.log(`🔗 Combining ${shares.length} shares`);

    if (shares.length < this.THRESHOLD) {
      throw new Error(`Need at least ${this.THRESHOLD} shares to recover secret`);
    }

    // For demo - reverse the XOR operation
    const firstShare = shares[0];
    const secretLength = firstShare.length - 4;
    const secret = new Uint8Array(secretLength);

    // Simple XOR reversal (NOT secure - just for demo)
    for (let j = 0; j < secretLength; j++) {
      secret[j] = firstShare[j + 4] ^ ((0 + 1) * (j + 1)) % 256;
    }

    return secret;
  }

  /**
   * 🔒 ENCRYPT SHARE FOR GUARDIAN
   */
  private static async encryptShareForGuardian(
    share: Uint8Array,
    guardianPublicKey: string
  ): Promise<{ ciphertext: string; encapsulation: string }> {
    // Simulate ML-KEM-768 encapsulation
    // In production: const { ciphertext, sharedSecret } = ml_kem768.encapsulate(publicKey);
    
    const publicKey = this.base64ToUint8Array(guardianPublicKey);
    
    // Generate fake encapsulation
    const encapsulation = crypto.getRandomValues(new Uint8Array(1088)); // ML-KEM-768 ciphertext size
    
    // Generate shared secret (fake)
    const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
    
    // Encrypt share with shared secret
    const encrypted = await this.chaCha20Poly1305Encrypt(share, sharedSecret);
    
    return {
      ciphertext: this.uint8ArrayToBase64(encrypted.ciphertext),
      encapsulation: this.uint8ArrayToBase64(encapsulation)
    };
  }

  /**
   * 🔓 DECRYPT GUARDIAN SHARE
   */
  private static async decryptGuardianShare(
    encryptedShare: string,
    encapsulation: string,
    guardianPrivateKey: string
  ): Promise<Uint8Array> {
    // Simulate ML-KEM-768 decapsulation
    // In production: const sharedSecret = ml_kem768.decapsulate(encapsulation, privateKey);
    
    const privateKey = this.base64ToUint8Array(guardianPrivateKey);
    const encapsulationBytes = this.base64ToUint8Array(encapsulation);
    
    // Generate shared secret (fake - should match encryption)
    const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
    
    // Decrypt share
    const encryptedBytes = this.base64ToUint8Array(encryptedShare);
    const decrypted = await this.chaCha20Poly1305Decrypt(encryptedBytes, sharedSecret);
    
    return decrypted;
  }

  /**
   * 🔒 ChaCha20-Poly1305 ENCRYPT
   */
  private static async chaCha20Poly1305Encrypt(
    data: Uint8Array,
    key: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; tag: Uint8Array }> {
    // Use AES-GCM as substitute
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );

    const ciphertext = new Uint8Array(encrypted.slice(0, -16));
    const tag = new Uint8Array(encrypted.slice(-16));

    return { ciphertext, tag };
  }

  /**
   * 🔓 ChaCha20-Poly1305 DECRYPT
   */
  private static async chaCha20Poly1305Decrypt(
    ciphertext: Uint8Array,
    key: Uint8Array
  ): Promise<Uint8Array> {
    // Use AES-GCM as substitute
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const iv = new Uint8Array(12); // Zero IV for simplicity
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    return new Uint8Array(decrypted);
  }

  /**
   * 🔄 UTILITY METHODS
   */
  private static generateId(): string {
    return crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9);
  }

  private static uint8ArrayToBase64(bytes: Uint8Array): string {
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
  }

  private static base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
  }
}

export default GuardianRecoveryService;