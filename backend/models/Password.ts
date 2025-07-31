// backend/models/Password.ts - VERSIÓN PRISMA + CIFRADO

// Definir EncryptedData localmente para evitar problemas de import
interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
  authTag: string;
  metadata: {
    algorithm: string;
    keyDerivation: string;
    timestamp: string;
    version: string;
  };
}

// Import corregido según tu estructura
const EncryptionService = require('../src/services/encryptionService').EncryptionService;

export interface PasswordData {
  id: string;
  userId: string;
  site: string;
  username: string;
  encryptedPassword: string; // JSON string de EncryptedData
  encryptedNotes?: string | null;   // JSON string de EncryptedData
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date | null;
  isFavorite: boolean;
  category?: string | null;
  strength: number;
}

export interface PasswordCreateInput {
  userId: string;
  site: string;
  username: string;
  plainPassword: string;
  notes?: string;
  category?: string;
  isFavorite?: boolean;
}

export class PasswordModel {
  
  /**
   * Cifra una contraseña antes de guardarla
   */
  static async encryptPassword(plainPassword: string, userCredential: string): Promise<string> {
    const encryptedData = await EncryptionService.encrypt(plainPassword, userCredential);
    return JSON.stringify(encryptedData);
  }

  /**
   * Descifra una contraseña desde la base de datos
   */
  static async decryptPassword(encryptedPassword: string, userCredential: string): Promise<string> {
    try {
      const encryptedData: EncryptedData = JSON.parse(encryptedPassword);
      return await EncryptionService.decrypt(encryptedData, userCredential);
    } catch (error) {
      console.error('Failed to decrypt password:', error);
      throw new Error('Failed to decrypt password');
    }
  }

  /**
   * Cifra notas antes de guardarlas
   */
  static async encryptNotes(plainNotes: string, userCredential: string): Promise<string> {
    const encryptedData = await EncryptionService.encrypt(plainNotes, userCredential);
    return JSON.stringify(encryptedData);
  }

  /**
   * Descifra notas desde la base de datos
   */
  static async decryptNotes(encryptedNotes: string, userCredential: string): Promise<string | null> {
    if (!encryptedNotes) {
      return null;
    }

    try {
      const encryptedData: EncryptedData = JSON.parse(encryptedNotes);
      return await EncryptionService.decrypt(encryptedData, userCredential);
    } catch (error) {
      console.error('Failed to decrypt notes:', error);
      return null;
    }
  }

  /**
   * Genera credencial de usuario para cifrado
   */
  static generateUserCredential(userId: string, webauthnId: string): string {
    return EncryptionService.generateUserCredential(userId, webauthnId);
  }

  /**
   * Calcula la fortaleza de una contraseña
   */
  static calculatePasswordStrength(password: string): number {
    let strength = 0;
    
    // Longitud
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    
    // Caracteres
    if (/[a-z]/.test(password)) strength += 10;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    return Math.min(strength, 100);
  }

  /**
   * Convierte datos de password a formato seguro (sin contraseñas descifradas)
   */
  static toSafeJSON(password: PasswordData): object {
    return {
      id: password.id,
      site: password.site,
      username: password.username,
      createdAt: password.createdAt,
      updatedAt: password.updatedAt,
      lastUsed: password.lastUsed,
      isFavorite: password.isFavorite,
      category: password.category,
      strength: password.strength,
      hasNotes: !!password.encryptedNotes,
      encryption: {
        algorithm: 'AES-256-GCM',
        keyDerivation: 'Argon2id'
      }
    };
  }

  /**
   * Valida los datos de entrada para crear contraseña
   */
  static validatePasswordInput(input: PasswordCreateInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.site?.trim()) {
      errors.push('Site is required');
    }

    if (!input.username?.trim()) {
      errors.push('Username is required');
    }

    if (!input.plainPassword?.trim()) {
      errors.push('Password is required');
    }

    if (!input.userId?.trim()) {
      errors.push('User ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default PasswordModel;