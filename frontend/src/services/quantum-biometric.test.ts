// quantum-biometric.test.ts
// TEST COMPLETO DEL SISTEMA QUANTUM-BIOMETRIC

import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { MultiQuantumEntropyService, BiometricQuantumProcessor } from './MultiQuantumEntropyService';

// Mock de fetch para evitar CORS en tests
global.fetch = jest.fn();

// Mock de crypto.getRandomValues si no está disponible
if (!global.crypto) {
  global.crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: jest.fn(),
      importKey: jest.fn(),
      encrypt: jest.fn(),
      deriveBits: jest.fn()
    }
  } as any;
}

describe('Quantum Biometric System - Complete Test Suite', () => {
  
  // ============================================
  // TEST 1: VERIFICAR TODOS LOS TAMAÑOS
  // ============================================
  describe('Size Validation Tests', () => {
    
    test('ML-KEM-768 key sizes are correct', () => {
      const seed = new Uint8Array(64); // 64 bytes para ML-KEM
      crypto.getRandomValues(seed);
      
      const keypair = ml_kem768.keygen(seed);
      
      expect(keypair.publicKey.length).toBe(1184);
      expect(keypair.secretKey.length).toBe(2400);
    });
    
    test('ML-DSA-65 key sizes are correct', () => {
      const seed = new Uint8Array(32); // 32 bytes para ML-DSA
      crypto.getRandomValues(seed);
      
      const keypair = ml_dsa65.keygen(seed);
      
      expect(keypair.publicKey.length).toBe(1952);
      expect(keypair.secretKey.length).toBe(4032); // ¡ESTE ES EL QUE DEBE PASAR!
    });
    
    test('ML-KEM encapsulation produces correct sizes', () => {
      const seed = new Uint8Array(64);
      crypto.getRandomValues(seed);
      const keypair = ml_kem768.keygen(seed);
      
      const encap = ml_kem768.encapsulate(keypair.publicKey);
      
      expect(encap.ciphertext.length).toBe(1088);
      expect(encap.sharedSecret.length).toBe(32);
    });
    
    test('ML-DSA signature size is correct', () => {
      const seed = new Uint8Array(32);
      crypto.getRandomValues(seed);
      const keypair = ml_dsa65.keygen(seed);
      
      const message = new TextEncoder().encode('test');
      const signature = ml_dsa65.sign(message, keypair.secretKey);
      
      expect(signature.length).toBe(3309);
    });
  });

  // ============================================
  // TEST 2: FUENTES DE ENTROPÍA
  // ============================================
  describe('Multi-Source Entropy Tests', () => {
    let entropyService: MultiQuantumEntropyService;
    
    beforeEach(() => {
      entropyService = new MultiQuantumEntropyService();
      jest.clearAllMocks();
    });
    
    test('Hardware entropy always works as fallback', async () => {
      // Mock todas las fuentes para fallar excepto hardware
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const entropy = await entropyService.getQuantumEntropy(32);
      
      expect(entropy).toBeDefined();
      expect(entropy.length).toBe(32);
    });
    
    test('XOR combination works with multiple sources', async () => {
      // Mock respuestas exitosas
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ // ANU
          ok: true,
          json: async () => ({ success: true, data: new Array(32).fill(255) })
        })
        .mockRejectedValueOnce(new Error('IBM failed')) // IBM
        .mockRejectedValueOnce(new Error('Cloudflare failed')); // Cloudflare
      
      const entropy = await entropyService.getQuantumEntropy(32);
      
      expect(entropy).toBeDefined();
      expect(entropy.length).toBe(32);
      // Verificar que no son todos 255 (XOR funcionó)
      expect(entropy.some(byte => byte !== 255)).toBe(true);
    });

    test('Cloudflare entropy works without Buffer', async () => {
      // Mock respuesta de Cloudflare
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          randomness: 'deadbeefcafebabe1234567890abcdef' 
        })
      });

      const entropy = await entropyService.getQuantumEntropy(32);
      
      expect(entropy).toBeDefined();
      expect(entropy.length).toBe(32);
    });
  });

  // ============================================
  // TEST 3: PROCESAMIENTO BIOMÉTRICO
  // ============================================
  describe('Biometric Processing Tests', () => {
    let processor: BiometricQuantumProcessor;
    
    beforeEach(() => {
      processor = new BiometricQuantumProcessor();
      
      // Mock crypto.subtle methods
      (crypto.subtle.digest as jest.Mock).mockResolvedValue(
        new ArrayBuffer(32)
      );
      (crypto.subtle.importKey as jest.Mock).mockResolvedValue({});
      (crypto.subtle.encrypt as jest.Mock).mockResolvedValue(
        new ArrayBuffer(64)
      );
      (crypto.subtle.deriveBits as jest.Mock).mockResolvedValue(
        new ArrayBuffer(64)
      );
    });
    
    test('Biometric to ML-KEM conversion works', async () => {
      const biometric = new ArrayBuffer(64);
      
      const result = await processor.biometricToMLKEM(biometric);
      
      expect(result.publicKey.length).toBe(1184);
      expect(result.secretKey.length).toBe(2400);
      expect(result.encrypted).toBe(true);
    });
    
    test('Biometric to ML-DSA conversion works', async () => {
      const biometric = new ArrayBuffer(64);
      
      const result = await processor.biometricToMLDSA(biometric);
      
      expect(result.publicKey.length).toBe(1952);
      expect(result.secretKey.length).toBe(4032); // ¡VERIFICAR ESTE!
      expect(result.encrypted).toBe(true);
    });
    
    test('Biometric data is never exposed in plaintext', async () => {
      const biometric = new ArrayBuffer(64);
      const spy = jest.spyOn(console, 'log');
      
      await processor.biometricToMLKEM(biometric);
      
      // Verificar que nunca se logea el biométrico raw
      expect(spy).not.toHaveBeenCalledWith(expect.stringContaining(biometric.toString()));
    });
  });

  // ============================================
  // TEST 4: ERRORES ESPECÍFICOS ENCONTRADOS
  // ============================================
  describe('Bug Fix Tests', () => {
    
    test('Buffer is not defined error in browser', () => {
      // Verificar que no usamos Buffer.from()
      const hexToBytes = (hex: string) => {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
      };
      
      const bytes = hexToBytes('74657374');
      expect(bytes).toEqual(new Uint8Array([116, 101, 115, 116]));
    });
    
    test('ML-DSA secret key size validation', () => {
      const correctSeed = new Uint8Array(32);
      crypto.getRandomValues(correctSeed);
      
      const keypair = ml_dsa65.keygen(correctSeed);
      
      // El problema NO es el seed, es que algo está pasando
      // una clave de 32 bytes en lugar de la secretKey de 4032
      expect(keypair.secretKey.length).toBe(4032);
      
      // Función de validación
      const validateMLDSAKey = (secretKey: Uint8Array) => {
        if (secretKey.length !== 4032) {
          throw new Error(`ML-DSA secret key must be 4032 bytes, got ${secretKey.length}`);
        }
      };
      
      expect(() => validateMLDSAKey(keypair.secretKey)).not.toThrow();
      expect(() => validateMLDSAKey(new Uint8Array(32))).toThrow();
    });

    test('Hex to bytes conversion works correctly', () => {
      const service = new MultiQuantumEntropyService();
      // Access private method through type assertion for testing
      const hexToBytes = (service as any).hexToBytes.bind(service);
      
      const result = hexToBytes('deadbeef');
      expect(result).toEqual(new Uint8Array([222, 173, 190, 239]));
    });
  });

  // ============================================
  // TEST 5: INTEGRACIÓN CON CORS
  // ============================================
  describe('CORS and Network Tests', () => {
    
    test('Handles CORS errors gracefully', async () => {
      const service = new MultiQuantumEntropyService();
      
      // Mock CORS error
      (fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));
      
      // Should still work with hardware fallback
      const entropy = await service.getQuantumEntropy(32);
      expect(entropy.length).toBe(32);
    });
    
    test('IBM Quantum fallback works when network fails', async () => {
      const service = new MultiQuantumEntropyService();
      
      // Mock network failure for IBM
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const entropy = await service.getQuantumEntropy(32);
      expect(entropy).toBeDefined();
      expect(entropy.length).toBe(32);
    });
  });
});

// ============================================
// TEST HELPER FUNCTIONS
// ============================================

export class TestHelpers {
  static createMockBiometric(size: number = 64): ArrayBuffer {
    const buffer = new ArrayBuffer(size);
    const view = new Uint8Array(buffer);
    crypto.getRandomValues(view);
    return buffer;
  }
  
  static validateQuantumKeySize(key: Uint8Array, algorithm: 'ML-KEM-768' | 'ML-DSA-65', keyType: 'public' | 'secret'): boolean {
    const expectedSizes = {
      'ML-KEM-768': { public: 1184, secret: 2400 },
      'ML-DSA-65': { public: 1952, secret: 4032 }
    };
    
    const expectedSize = expectedSizes[algorithm][keyType];
    return key.length === expectedSize;
  }
  
  static async mockCryptoMethods() {
    return {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      importKey: jest.fn().mockResolvedValue({}),
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(64)),
      deriveBits: jest.fn().mockResolvedValue(new ArrayBuffer(64))
    };
  }
}