"use strict";
// backend/models/Password.ts - VERSIÓN PRISMA + CIFRADO
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordModel = void 0;
// Import corregido según tu estructura
const EncryptionService = require('../src/services/encryptionService').EncryptionService;
class PasswordModel {
    /**
     * Cifra una contraseña antes de guardarla
     */
    static encryptPassword(plainPassword, userCredential) {
        return __awaiter(this, void 0, void 0, function* () {
            const encryptedData = yield EncryptionService.encrypt(plainPassword, userCredential);
            return JSON.stringify(encryptedData);
        });
    }
    /**
     * Descifra una contraseña desde la base de datos
     */
    static decryptPassword(encryptedPassword, userCredential) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const encryptedData = JSON.parse(encryptedPassword);
                return yield EncryptionService.decrypt(encryptedData, userCredential);
            }
            catch (error) {
                console.error('Failed to decrypt password:', error);
                throw new Error('Failed to decrypt password');
            }
        });
    }
    /**
     * Cifra notas antes de guardarlas
     */
    static encryptNotes(plainNotes, userCredential) {
        return __awaiter(this, void 0, void 0, function* () {
            const encryptedData = yield EncryptionService.encrypt(plainNotes, userCredential);
            return JSON.stringify(encryptedData);
        });
    }
    /**
     * Descifra notas desde la base de datos
     */
    static decryptNotes(encryptedNotes, userCredential) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!encryptedNotes) {
                return null;
            }
            try {
                const encryptedData = JSON.parse(encryptedNotes);
                return yield EncryptionService.decrypt(encryptedData, userCredential);
            }
            catch (error) {
                console.error('Failed to decrypt notes:', error);
                return null;
            }
        });
    }
    /**
     * Genera credencial de usuario para cifrado
     */
    static generateUserCredential(userId, webauthnId) {
        return EncryptionService.generateUserCredential(userId, webauthnId);
    }
    /**
     * Calcula la fortaleza de una contraseña
     */
    static calculatePasswordStrength(password) {
        let strength = 0;
        // Longitud
        if (password.length >= 8)
            strength += 25;
        if (password.length >= 12)
            strength += 25;
        // Caracteres
        if (/[a-z]/.test(password))
            strength += 10;
        if (/[A-Z]/.test(password))
            strength += 15;
        if (/[0-9]/.test(password))
            strength += 15;
        if (/[^A-Za-z0-9]/.test(password))
            strength += 10;
        return Math.min(strength, 100);
    }
    /**
     * Convierte datos de password a formato seguro (sin contraseñas descifradas)
     */
    static toSafeJSON(password) {
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
    static validatePasswordInput(input) {
        var _a, _b, _c, _d;
        const errors = [];
        if (!((_a = input.site) === null || _a === void 0 ? void 0 : _a.trim())) {
            errors.push('Site is required');
        }
        if (!((_b = input.username) === null || _b === void 0 ? void 0 : _b.trim())) {
            errors.push('Username is required');
        }
        if (!((_c = input.plainPassword) === null || _c === void 0 ? void 0 : _c.trim())) {
            errors.push('Password is required');
        }
        if (!((_d = input.userId) === null || _d === void 0 ? void 0 : _d.trim())) {
            errors.push('User ID is required');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.PasswordModel = PasswordModel;
exports.default = PasswordModel;
