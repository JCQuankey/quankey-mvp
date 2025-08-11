/**
 * 📱 DEVICE PAIRING SERVICE - QR TEMPORAL BRIDGE
 * 
 * ARQUITECTURA REALISTA:
 * - QR bridge entre dispositivos (60-120 segundos)
 * - Nuevo dispositivo obtiene Master Key envuelta
 * - NO recovery codes - solo device-to-device pairing
 * - WebSocket para comunicación tiempo real
 * 
 * FLUJO:
 * 1. Dispositivo A (autenticado) crea QR temporal
 * 2. Dispositivo B escanea QR y genera par PQC
 * 3. Servidor envuelve MK para dispositivo B
 * 4. Ambos dispositivos quedan sincronizados
 */

export interface PairingQRData {
  token: string;
  endpoint: string;
  expires: number;
  version: string;
}

export interface PairingSession {
  id: string;
  token: string;
  createdByDevice: string;
  expiresAt: Date;
  status: 'pending' | 'scanning' | 'paired' | 'expired' | 'failed';
}

export interface PairingResult {
  success: boolean;
  deviceId?: string;
  deviceName?: string;
  error?: string;
}

export class DevicePairingService {
  private static readonly API_BASE = 'https://quankey.xyz/api';
  private static readonly WS_ENDPOINT = 'wss://quankey.xyz/pairing';
  private static readonly QR_EXPIRY_SECONDS = 90; // 90 seconds
  
  private static websocket: WebSocket | null = null;
  private static pairingCallbacks = new Map<string, (result: PairingResult) => void>();

  /**
   * 📱 CREATE PAIRING QR - Desde dispositivo AUTENTICADO
   */
  static async createPairingQR(): Promise<{ qrData: PairingQRData; qrCode: string }> {
    console.log('📱 Creating device pairing QR...');

    try {
      // 1. Create pairing session on server
      const response = await fetch(`${this.API_BASE}/pairing/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          expiresIn: this.QR_EXPIRY_SECONDS,
          deviceInfo: {
            name: await this.getDeviceName(),
            userAgent: navigator.userAgent,
            timestamp: Date.now()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create pairing session: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create pairing session');
      }

      // 2. Generate QR data
      const qrData: PairingQRData = {
        token: result.token,
        endpoint: this.WS_ENDPOINT,
        expires: Date.now() + (this.QR_EXPIRY_SECONDS * 1000),
        version: '1.0'
      };

      // 3. Generate QR code
      const qrCode = await this.generateQRCode(qrData);

      console.log(`✅ Pairing QR created (expires in ${this.QR_EXPIRY_SECONDS}s)`);

      return { qrData, qrCode };

    } catch (error) {
      console.error('❌ Failed to create pairing QR:', error);
      throw new Error(`Failed to create pairing QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 🔍 CONSUME PAIRING QR - Desde NUEVO dispositivo
   */
  static async consumePairingQR(qrData: PairingQRData): Promise<PairingResult> {
    console.log('🔍 Consuming pairing QR...');

    try {
      // 1. Check if QR is expired
      if (Date.now() > qrData.expires) {
        throw new Error('QR code has expired');
      }

      // 2. Generate ML-KEM-768 keypair for new device
      const { QuantumVaultService } = await import('./QuantumVaultService');
      const deviceKeys = await (QuantumVaultService as any).generateMLKEM768KeyPair();

      // 3. Connect to pairing WebSocket
      await this.connectToPairingWebSocket(qrData.endpoint, qrData.token);

      // 4. Send device registration to pairing session
      const pairingResult = await this.sendPairingRequest({
        token: qrData.token,
        deviceInfo: {
          name: await this.getDeviceName(),
          userAgent: navigator.userAgent,
          publicKey: this.uint8ArrayToBase64(deviceKeys.publicKey),
          algorithm: 'ML-KEM-768'
        }
      });

      if (!pairingResult.success) {
        throw new Error(pairingResult.error || 'Pairing failed');
      }

      // 5. Store device keys locally
      await this.storeNewDeviceKeys(
        deviceKeys,
        pairingResult.wrappedMasterKey!,
        pairingResult.deviceId!
      );

      console.log(`✅ Device pairing successful: ${pairingResult.deviceId}`);

      return {
        success: true,
        deviceId: pairingResult.deviceId,
        deviceName: pairingResult.deviceName
      };

    } catch (error) {
      console.error('❌ Failed to consume pairing QR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QR pairing failed'
      };
    } finally {
      this.disconnectFromPairingWebSocket();
    }
  }

  /**
   * 📊 GET PAIRING STATUS
   */
  static async getPairingStatus(token: string): Promise<PairingSession> {
    const response = await fetch(`${this.API_BASE}/pairing/status/${token}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get pairing status');
    }

    const result = await response.json();
    
    return {
      id: result.session.id,
      token: result.session.token,
      createdByDevice: result.session.createdByDevice,
      expiresAt: new Date(result.session.expiresAt),
      status: result.session.status
    };
  }

  /**
   * ❌ CANCEL PAIRING SESSION
   */
  static async cancelPairingSession(token: string): Promise<void> {
    await fetch(`${this.API_BASE}/pairing/cancel/${token}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    console.log(`❌ Pairing session cancelled: ${token}`);
  }

  /**
   * 🔗 MONITOR PAIRING PROGRESS
   */
  static monitorPairingProgress(
    token: string,
    onProgress: (status: string, data?: any) => void,
    onComplete: (result: PairingResult) => void
  ): () => void {
    // Store callback
    this.pairingCallbacks.set(token, onComplete);

    // Connect to WebSocket for real-time updates
    this.connectToPairingWebSocket(this.WS_ENDPOINT, token)
      .then(() => {
        // Send monitoring message
        if (this.websocket) {
          this.websocket.send(JSON.stringify({
            type: 'monitor',
            token
          }));
        }
      })
      .catch(error => {
        console.error('❌ Failed to monitor pairing:', error);
        onComplete({ success: false, error: 'Failed to monitor pairing' });
      });

    // Set up message handler
    if (this.websocket) {
      this.websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'progress':
            onProgress(message.status, message.data);
            break;
          case 'complete':
            const callback = this.pairingCallbacks.get(token);
            if (callback) {
              callback(message.result);
              this.pairingCallbacks.delete(token);
            }
            break;
          case 'error':
            const errorCallback = this.pairingCallbacks.get(token);
            if (errorCallback) {
              errorCallback({ success: false, error: message.error });
              this.pairingCallbacks.delete(token);
            }
            break;
        }
      };
    }

    // Return cleanup function
    return () => {
      this.pairingCallbacks.delete(token);
      this.disconnectFromPairingWebSocket();
    };
  }

  // =========================================
  // PRIVATE METHODS
  // =========================================

  /**
   * 🔌 CONNECT TO PAIRING WEBSOCKET
   */
  private static async connectToPairingWebSocket(endpoint: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(`${endpoint}?token=${token}`);

        this.websocket.onopen = () => {
          console.log('🔌 Connected to pairing WebSocket');
          resolve();
        };

        this.websocket.onclose = () => {
          console.log('🔌 Disconnected from pairing WebSocket');
        };

        this.websocket.onerror = (error) => {
          console.error('❌ Pairing WebSocket error:', error);
          reject(new Error('Failed to connect to pairing service'));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 🔌 DISCONNECT FROM PAIRING WEBSOCKET
   */
  private static disconnectFromPairingWebSocket(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * 📤 SEND PAIRING REQUEST
   */
  private static async sendPairingRequest(request: {
    token: string;
    deviceInfo: {
      name: string;
      userAgent: string;
      publicKey: string;
      algorithm: string;
    };
  }): Promise<{ success: boolean; error?: string; deviceId?: string; deviceName?: string; wrappedMasterKey?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.websocket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Set up response handler
      const handleResponse = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        
        if (response.type === 'pairing_response') {
          this.websocket!.removeEventListener('message', handleResponse);
          resolve(response);
        }
      };

      this.websocket.addEventListener('message', handleResponse);

      // Send pairing request
      this.websocket.send(JSON.stringify({
        type: 'pair_device',
        ...request
      }));

      // Set timeout
      setTimeout(() => {
        this.websocket!.removeEventListener('message', handleResponse);
        reject(new Error('Pairing request timeout'));
      }, 30000); // 30 seconds timeout
    });
  }

  /**
   * 💾 STORE NEW DEVICE KEYS
   */
  private static async storeNewDeviceKeys(
    deviceKeys: { publicKey: Uint8Array; secretKey: Uint8Array },
    wrappedMasterKey: string,
    deviceId: string
  ): Promise<void> {
    // Store device private key
    const { QuantumVaultService } = await import('./QuantumVaultService');
    await (QuantumVaultService as any).storeDevicePrivateKey(deviceKeys.secretKey);

    // Decapsulate and store master key
    const masterKey = await (QuantumVaultService as any).decapsulateMasterKey(
      wrappedMasterKey,
      deviceKeys.secretKey
    );
    await (QuantumVaultService as any).storeMasterKey(masterKey);

    // Store device info
    localStorage.setItem('device_id', deviceId);
    
    console.log(`💾 Device keys stored for: ${deviceId}`);
  }

  /**
   * 🏷️ GET DEVICE NAME
   */
  private static async getDeviceName(): Promise<string> {
    // Generate a friendly device name
    const platform = navigator.platform;
    const timestamp = new Date().toLocaleDateString();
    
    if (platform.includes('Mac')) {
      return `Mac (${timestamp})`;
    } else if (platform.includes('Win')) {
      return `Windows (${timestamp})`;
    } else if (platform.includes('iPhone')) {
      return `iPhone (${timestamp})`;
    } else if (platform.includes('Android')) {
      return `Android (${timestamp})`;
    } else {
      return `Device (${timestamp})`;
    }
  }

  /**
   * 🔗 GENERATE QR CODE
   */
  private static async generateQRCode(data: PairingQRData): Promise<string> {
    // For now, return the data as JSON string
    // In production, use a QR code library
    const qrString = JSON.stringify(data);
    
    // Simple data URL for demo purposes
    // TODO: Use proper QR code generation library
    return `data:text/plain;base64,${btoa(qrString)}`;
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

export default DevicePairingService;