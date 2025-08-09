import { 
  createCipheriv, 
  createDecipheriv, 
  randomBytes, 
  scryptSync,
  createHash 
} from 'crypto';

export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: Buffer;
  
  private constructor() {
    // Derivar master key de variable de entorno
    const keySource = process.env.DB_ENCRYPTION_KEY || process.env.MASTER_ENCRYPTION_KEY;
    
    if (!keySource || keySource.length < 64) {
      console.error('FATAL: DB_ENCRYPTION_KEY invalid or missing (must be 64+ chars)');
      process.exit(1);
    }
    
    // Derivar clave con scrypt
    const salt = createHash('sha256').update('quankey-v1').digest();
    this.masterKey = scryptSync(keySource, salt, 32);
    
    // Test de cifrado/descifrado
    this.selfTest();
  }
  
  private selfTest() {
    try {
      const testData = 'encryption-self-test';
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      
      if (decrypted !== testData) {
        throw new Error('Encryption self-test failed');
      }
      
      console.log('✅ Encryption service verified');
    } catch (error) {
      console.error('❌ FATAL: Encryption service failed:', error);
      process.exit(1);
    }
  }
  
  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }
  
  encrypt(plaintext: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:ciphertext (base64)
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }
  
  decrypt(ciphertext: string): string {
    try {
      const buffer = Buffer.from(ciphertext, 'base64');
      
      const iv = buffer.subarray(0, 16);
      const authTag = buffer.subarray(16, 32);
      const encrypted = buffer.subarray(32);
      
      const decipher = createDecipheriv('aes-256-gcm', this.masterKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error('Decryption failed - possible key rotation needed');
    }
  }
  
  // Cifrado de campos específicos
  encryptPassword(password: string): {
    encrypted: string;
    keyHash: string;
  } {
    const encrypted = this.encrypt(password);
    const keyHash = createHash('sha256')
      .update(this.masterKey)
      .digest('hex')
      .substring(0, 8); // Primeros 8 chars para verificación
    
    return { encrypted, keyHash };
  }
  
  decryptPassword(encrypted: string, keyHash: string): string {
    // Verificar que estamos usando la clave correcta
    const currentKeyHash = createHash('sha256')
      .update(this.masterKey)
      .digest('hex')
      .substring(0, 8);
    
    if (currentKeyHash !== keyHash) {
      throw new Error('Encryption key mismatch - possible key rotation needed');
    }
    
    return this.decrypt(encrypted);
  }
}

export const encryption = EncryptionService.getInstance();