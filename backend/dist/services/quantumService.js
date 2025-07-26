"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuantumPassword = generateQuantumPassword;
const axios_1 = __importDefault(require("axios"));
// Character sets for password generation
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
// Quantum Random Number Generator using IBM Quantum Network
function getQuantumRandomNumbers(count) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Using QRNG service (Quantum Random Number Generator)
            // This is a free quantum randomness service
            const response = yield axios_1.default.get(`https://qrng.anu.edu.au/API/jsonI.php?length=${count}&type=uint8`);
            if (response.data && response.data.success && response.data.data) {
                console.log(`✅ Generated ${count} quantum random numbers`);
                return response.data.data;
            }
            else {
                throw new Error('Invalid quantum response');
            }
        }
        catch (error) {
            console.warn('⚠️ Quantum service unavailable, using crypto fallback');
            // Fallback to crypto-secure random if quantum service fails
            return generateCryptoFallback(count);
        }
    });
}
// Crypto-secure fallback
function generateCryptoFallback(count) {
    const crypto = require('crypto');
    const numbers = [];
    for (let i = 0; i < count; i++) {
        const array = new Uint8Array(1);
        crypto.getRandomValues(array);
        numbers.push(array[0]);
    }
    console.log(`🔐 Generated ${count} crypto-secure random numbers (fallback)`);
    return numbers;
}
// Generate quantum-secure password
function generateQuantumPassword() {
    return __awaiter(this, arguments, void 0, function* (length = 16, includeSymbols = true) {
        // Build character set
        let charset = LOWERCASE + UPPERCASE + NUMBERS;
        if (includeSymbols) {
            charset += SYMBOLS;
        }
        // Get quantum random numbers
        const randomNumbers = yield getQuantumRandomNumbers(length);
        // Convert to password characters
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = randomNumbers[i] % charset.length;
            password += charset[randomIndex];
        }
        // Ensure password has at least one character from each required type
        password = ensureComplexity(password, includeSymbols);
        console.log(`🔑 Generated quantum password: ${password.length} characters`);
        return password;
    });
}
// Ensure password meets complexity requirements
function ensureComplexity(password, includeSymbols) {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = includeSymbols ? /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) : true;
    if (hasLower && hasUpper && hasNumber && hasSymbol) {
        return password;
    }
    // Replace some characters to ensure complexity
    let result = password.split('');
    if (!hasLower)
        result[0] = 'a';
    if (!hasUpper)
        result[1] = 'A';
    if (!hasNumber)
        result[2] = '1';
    if (!hasSymbol && includeSymbols)
        result[3] = '!';
    return result.join('');
}
