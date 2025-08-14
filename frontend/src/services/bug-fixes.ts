// bug-fixes.ts
// FIXES ESPECÍFICOS PARA LOS 2 BUGS ENCONTRADOS

import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

/**
 * BUG 1: ML-DSA recibiendo 4 bytes en lugar de 4032
 * INVESTIGACIÓN Y FIX
 */
export class MLDSABugFix {
  
  /**
   * BUSCAR ESTOS PATRONES EN EL CÓDIGO
   */
  static patternsToSearch = [
    'sign(message, 4)',              // Pasando literal 4
    'sign(message, length)',          // Pasando un length
    'sign(message, index)',           // Pasando un índice
    'sign(message, buffer.length)',  // Pasando el length de algo
    'sign(message, key.slice(0, 4))', // Cortando la key
    '.subarray(0, 4)',               // Usando subarray mal
    'new Uint8Array(4)',             // Creando array de 4 bytes
  ];

  /**
   * FUNCIÓN CORRECTA para firmar con ML-DSA
   */
  static signCorrectly(message: Uint8Array, keypair: any): Uint8Array {
    // VALIDACIÓN CRÍTICA
    if (!keypair.secretKey) {
      throw new Error('❌ Secret key is undefined');
    }
    
    if (keypair.secretKey.length !== 4032) {
      console.error(`❌ WRONG SECRET KEY SIZE: ${keypair.secretKey.length} bytes`);
      console.error('Stack trace:', new Error().stack);
      throw new Error(`ML-DSA secret key must be 4032 bytes, got ${keypair.secretKey.length}`);
    }
    
    // FIRMA CORRECTA
    return ml_dsa65.sign(message, keypair.secretKey);
  }

  /**
   * WRAPPER SEGURO para detectar el error
   */
  static wrapMLDSASign() {
    const originalSign = ml_dsa65.sign;
    
    ml_dsa65.sign = function(message: Uint8Array, secretKey: Uint8Array) {
      console.log(`📝 ML-DSA.sign called with:
        - Message: ${message.length} bytes
        - SecretKey: ${secretKey.length} bytes`);
      
      if (secretKey.length !== 4032) {
        console.error('❌ FOUND THE BUG! Stack trace:');
        console.trace();
        throw new Error(`Wrong secret key size: ${secretKey.length}`);
      }
      
      return originalSign.call(this, message, secretKey);
    };
  }
}

/**
 * BUG 2: ML-KEM encapsulate retornando undefined
 * INVESTIGACIÓN Y FIX
 */
export class MLKEMBugFix {
  
  /**
   * FUNCIÓN CORRECTA para encapsular
   */
  static encapsulateCorrectly(publicKey: Uint8Array): {
    cipherText: Uint8Array;
    sharedSecret: Uint8Array;
  } {
    // VALIDACIÓN CRÍTICA
    if (!publicKey) {
      throw new Error('❌ Public key is undefined');
    }
    
    if (publicKey.length !== 1184) {
      console.error(`❌ WRONG PUBLIC KEY SIZE: ${publicKey.length} bytes`);
      throw new Error(`ML-KEM public key must be 1184 bytes, got ${publicKey.length}`);
    }
    
    // ENCAPSULACIÓN CORRECTA
    const result = ml_kem768.encapsulate(publicKey);
    
    // VALIDAR RESULTADO
    if (!result || !result.cipherText || !result.sharedSecret) {
      console.error('❌ Encapsulate returned invalid result:', result);
      throw new Error('ML-KEM encapsulate failed');
    }
    
    console.log(`✅ Encapsulation successful:
      - Ciphertext: ${result.cipherText.length} bytes
      - SharedSecret: ${result.sharedSecret.length} bytes`);
    
    return result;
  }

  /**
   * WRAPPER SEGURO para detectar el error
   */
  static wrapMLKEMEncapsulate() {
    const originalEncapsulate = ml_kem768.encapsulate;
    
    ml_kem768.encapsulate = function(publicKey: Uint8Array) {
      console.log(`🔐 ML-KEM.encapsulate called with:
        - PublicKey: ${publicKey?.length || 'undefined'} bytes`);
      
      if (!publicKey || publicKey.length !== 1184) {
        console.error('❌ FOUND THE BUG! Stack trace:');
        console.trace();
      }
      
      const result = originalEncapsulate.call(this, publicKey);
      
      if (!result || !result.cipherText) {
        console.error('❌ Encapsulate returned invalid:', result);
      }
      
      return result;
    };
  }
}

/**
 * DEBUG HELPER - Agregar a QuantumBiometricIdentity.tsx
 */
export class QuantumDebugHelper {
  
  /**
   * Agregar logging a todas las funciones crypto
   */
  static enableDebugMode() {
    console.log('🔍 QUANTUM DEBUG MODE ENABLED');
    
    // Wrap ML-DSA
    MLDSABugFix.wrapMLDSASign();
    
    // Wrap ML-KEM
    MLKEMBugFix.wrapMLKEMEncapsulate();
    
    // Log key generation
    const originalKEMKeygen = ml_kem768.keygen;
    ml_kem768.keygen = function(seed?: Uint8Array) {
      // Generar seed si no se proporciona
      if (!seed) {
        seed = crypto.getRandomValues(new Uint8Array(64));
      }
      console.log(`🔑 ML-KEM keygen with seed: ${seed.length} bytes`);
      const result = originalKEMKeygen.call(this, seed);
      console.log(`  → PublicKey: ${result.publicKey.length} bytes`);
      console.log(`  → SecretKey: ${result.secretKey.length} bytes`);
      return result;
    };
    
    const originalDSAKeygen = ml_dsa65.keygen;
    ml_dsa65.keygen = function(seed?: Uint8Array) {
      // Generar seed si no se proporciona  
      if (!seed) {
        seed = crypto.getRandomValues(new Uint8Array(32));
      }
      console.log(`🔑 ML-DSA keygen with seed: ${seed.length} bytes`);
      const result = originalDSAKeygen.call(this, seed);
      console.log(`  → PublicKey: ${result.publicKey.length} bytes`);
      console.log(`  → SecretKey: ${result.secretKey.length} bytes`);
      return result;
    };
  }
  
  /**
   * Verificar un keypair
   */
  static validateKeypair(keypair: any, type: 'ML-KEM' | 'ML-DSA') {
    console.log(`\n🔍 Validating ${type} keypair:`);
    
    if (!keypair) {
      console.error('❌ Keypair is undefined!');
      return false;
    }
    
    if (!keypair.publicKey) {
      console.error('❌ Public key is undefined!');
      return false;
    }
    
    if (!keypair.secretKey) {
      console.error('❌ Secret key is undefined!');
      return false;
    }
    
    const expectedSizes = {
      'ML-KEM': { public: 1184, secret: 2400 },
      'ML-DSA': { public: 1952, secret: 4032 }
    };
    
    const expected = expectedSizes[type];
    
    console.log(`  PublicKey: ${keypair.publicKey.length} bytes (expected: ${expected.public})`);
    console.log(`  SecretKey: ${keypair.secretKey.length} bytes (expected: ${expected.secret})`);
    
    const valid = 
      keypair.publicKey.length === expected.public &&
      keypair.secretKey.length === expected.secret;
    
    console.log(`  Status: ${valid ? '✅ VALID' : '❌ INVALID'}`);
    
    return valid;
  }
}

/**
 * SOLUCIÓN COMPLETA PARA AMBOS BUGS
 */
export class CompleteBugFix {
  
  /**
   * Buscar y arreglar el bug de ML-DSA
   */
  static findMLDSABug(): string[] {
    const suspectLines: string[] = [];
    
    console.log(`
🔍 BUSCAR ESTOS PATRONES EN QuantumBiometricIdentity.tsx:

1. Buscar ".sign(" y verificar el segundo parámetro
2. Buscar "secretKey" y ver si se modifica
3. Buscar "4" solo (el número que aparece en el error)
4. Buscar ".length" cerca de sign()
    `);
    
    return suspectLines;
  }
  
  /**
   * Buscar y arreglar el bug de ML-KEM
   */
  static findMLKEMBug(): string[] {
    const suspectLines: string[] = [];
    
    console.log(`
🔍 BUSCAR ESTOS PATRONES EN QuantumBiometricIdentity.tsx:

1. Buscar ".encapsulate(" y verificar el parámetro
2. Buscar lugares donde se usa el resultado sin validar
3. Buscar "ciphertext" y ver si se accede sin verificar undefined
4. Buscar "publicKey" y verificar que tiene 1184 bytes
    `);
    
    return suspectLines;
  }
  
  /**
   * FIX DEFINITIVO - Agregar validaciones en todas partes
   */
  static applyCompleteFix() {
    // Este código debe agregarse al inicio de QuantumBiometricIdentity.tsx
    return `
// AGREGAR AL INICIO DE QuantumBiometricIdentity.tsx

// Habilitar debug mode para encontrar los bugs
import { QuantumDebugHelper } from '../services/bug-fixes';
QuantumDebugHelper.enableDebugMode();

// En cada función que use ML-DSA.sign:
if (secretKey.length !== 4032) {
  console.error('BUG FOUND: Wrong secret key size:', secretKey.length);
  console.trace();
  throw new Error('ML-DSA secret key must be 4032 bytes');
}

// En cada función que use ML-KEM.encapsulate:
if (!publicKey || publicKey.length !== 1184) {
  console.error('BUG FOUND: Wrong public key:', publicKey?.length);
  console.trace();
  throw new Error('ML-KEM public key must be 1184 bytes');
}

const result = ML_KEM_768.encapsulate(publicKey);
if (!result || !result.cipherText) {
  throw new Error('ML-KEM encapsulation failed');
}
    `;
  }
}