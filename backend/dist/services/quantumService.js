"use strict";
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
async function getQuantumRandomNumbers(count) {
    try {
        // Using QRNG service (Quantum Random Number Generator)
        // This is a free quantum randomness service
        const response = await axios_1.default.get(`https://qrng.anu.edu.au/API/jsonI.php?length=${count}&type=uint8`);
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
async function generateQuantumPassword(length = 16, includeSymbols = true) {
    // Build character set
    let charset = LOWERCASE + UPPERCASE + NUMBERS;
    if (includeSymbols) {
        charset += SYMBOLS;
    }
    // Get quantum random numbers
    const randomNumbers = await getQuantumRandomNumbers(length);
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
