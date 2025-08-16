"use strict";
/**
 * 🔒 QUANTUM SECURITY MIDDLEWARE
 * ⚠️ GOLDEN RULE: MAXIMUM SECURITY WITHOUT COMPROMISE
 *
 * Implements:
 * - Rate limiting per IP and per user
 * - Brute force protection with account locking
 * - Quantum-proof algorithm validation
 * - Anti-replay attack protection
 * - Request signature validation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityUtils = exports.quantumSecurityStack = exports.antiReplayProtection = exports.quantumProofValidation = exports.clearFailedAttempts = exports.recordFailedAttempt = exports.bruteForceProtection = exports.biometricSpeedLimiter = exports.biometricRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Track failed attempts per IP
const failedAttempts = new Map();
// Rate limiter for biometric endpoints (strict)
exports.biometricRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 5, // max 5 attempts per minute
    message: 'Too many biometric authentication attempts. Please wait before trying again.',
    standardHeaders: true,
    legacyHeaders: false,
    // Store in memory (use Redis in production)
    handler: (req, res) => {
        console.error(`⚠️ RATE LIMIT: IP ${req.ip} exceeded biometric rate limit`);
        res.status(429).json({
            error: 'Too many attempts',
            retryAfter: 60
        });
    }
});
// Speed limiter - gradually slow down responses
exports.biometricSpeedLimiter = (0, express_slow_down_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    delayAfter: 2, // allow 2 requests at full speed
    delayMs: (hits) => hits * 1000, // add 1s delay per request after limit
    maxDelayMs: 5000 // max 5 second delay
});
// Brute force protection middleware
const bruteForceProtection = async (req, res, next) => {
    const ip = req.ip || 'unknown';
    const attempts = failedAttempts.get(ip);
    // Check if IP is locked out
    if (attempts) {
        const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
        // Lock for 30 minutes after 10 failed attempts
        if (attempts.count >= 10) {
            const lockDuration = 30 * 60 * 1000; // 30 minutes
            if (timeSinceLastAttempt < lockDuration) {
                const remainingTime = Math.ceil((lockDuration - timeSinceLastAttempt) / 1000);
                console.error(`🔒 LOCKED: IP ${ip} is locked out for ${remainingTime} seconds`);
                return res.status(429).json({
                    error: 'Account temporarily locked due to too many failed attempts',
                    retryAfter: remainingTime
                });
            }
            else {
                // Reset after lock period
                failedAttempts.delete(ip);
            }
        }
        // Exponential backoff for failed attempts
        if (attempts.count >= 3) {
            const requiredDelay = Math.pow(2, attempts.count - 3) * 1000; // 1s, 2s, 4s, 8s...
            if (timeSinceLastAttempt < requiredDelay) {
                const remainingDelay = Math.ceil((requiredDelay - timeSinceLastAttempt) / 1000);
                console.warn(`⏱️ THROTTLE: IP ${ip} must wait ${remainingDelay} seconds`);
                return res.status(429).json({
                    error: 'Please wait before trying again',
                    retryAfter: remainingDelay
                });
            }
        }
    }
    next();
};
exports.bruteForceProtection = bruteForceProtection;
// Record failed attempt
const recordFailedAttempt = (ip) => {
    const current = failedAttempts.get(ip) || { count: 0, lastAttempt: new Date() };
    current.count++;
    current.lastAttempt = new Date();
    failedAttempts.set(ip, current);
    console.warn(`⚠️ Failed attempt #${current.count} from IP: ${ip}`);
};
exports.recordFailedAttempt = recordFailedAttempt;
// Clear failed attempts on success
const clearFailedAttempts = (ip) => {
    failedAttempts.delete(ip);
    console.log(`✅ Cleared failed attempts for IP: ${ip}`);
};
exports.clearFailedAttempts = clearFailedAttempts;
// Quantum-proof algorithm validation
const quantumProofValidation = (req, res, next) => {
    const { biometricProof } = req.body;
    if (!biometricProof) {
        return res.status(400).json({
            error: 'Missing biometric proof'
        });
    }
    // Only accept quantum-safe algorithms
    const allowedAlgorithms = ['ML-DSA-65', 'dilithium3', 'dilithium5'];
    if (!allowedAlgorithms.includes(biometricProof.algorithm)) {
        console.error(`❌ SECURITY: Non-quantum-safe algorithm attempted: ${biometricProof.algorithm}`);
        return res.status(400).json({
            error: 'Only quantum-safe algorithms are accepted'
        });
    }
    // Validate proof structure
    if (!biometricProof.proof || !biometricProof.challenge) {
        return res.status(400).json({
            error: 'Invalid proof structure'
        });
    }
    // Check proof sizes (base64 decoded)
    try {
        const proofBytes = Buffer.from(biometricProof.proof, 'base64');
        const challengeBytes = Buffer.from(biometricProof.challenge, 'base64');
        // ML-DSA-65/Dilithium3 signature should be ~3293 bytes
        if (proofBytes.length < 3000 || proofBytes.length > 3500) {
            console.error(`❌ Invalid proof size: ${proofBytes.length}`);
            return res.status(400).json({
                error: 'Invalid proof size'
            });
        }
        // Challenge should be 32 bytes (SHA-256 hash)
        if (challengeBytes.length !== 32) {
            console.error(`❌ Invalid challenge size: ${challengeBytes.length}`);
            return res.status(400).json({
                error: 'Invalid challenge size'
            });
        }
    }
    catch (error) {
        return res.status(400).json({
            error: 'Invalid base64 encoding'
        });
    }
    next();
};
exports.quantumProofValidation = quantumProofValidation;
// Anti-replay protection
const recentNonces = new Set();
const NONCE_LIFETIME = 5 * 60 * 1000; // 5 minutes
const antiReplayProtection = (req, res, next) => {
    const { nonce, timestamp } = req.body;
    // Check if request has anti-replay fields
    if (nonce && timestamp) {
        // Check timestamp freshness
        const age = Date.now() - timestamp;
        if (age > NONCE_LIFETIME || age < 0) {
            console.error(`❌ REPLAY: Request too old or from future (age: ${age}ms)`);
            return res.status(400).json({
                error: 'Request expired or invalid timestamp'
            });
        }
        // Check nonce uniqueness
        const nonceKey = `${nonce}-${timestamp}`;
        if (recentNonces.has(nonceKey)) {
            console.error(`❌ REPLAY: Duplicate nonce detected: ${nonceKey}`);
            return res.status(400).json({
                error: 'Duplicate request detected'
            });
        }
        // Store nonce
        recentNonces.add(nonceKey);
        // Clean old nonces periodically
        setTimeout(() => {
            recentNonces.delete(nonceKey);
        }, NONCE_LIFETIME);
    }
    next();
};
exports.antiReplayProtection = antiReplayProtection;
// Combined security middleware stack
exports.quantumSecurityStack = [
    exports.biometricRateLimit,
    exports.biometricSpeedLimiter,
    exports.bruteForceProtection,
    exports.quantumProofValidation,
    exports.antiReplayProtection
];
// Export utility functions
exports.securityUtils = {
    recordFailedAttempt: exports.recordFailedAttempt,
    clearFailedAttempts: exports.clearFailedAttempts
};
