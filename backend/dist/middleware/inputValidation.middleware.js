"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputValidation = exports.InputValidationMiddleware = void 0;
const express_validator_1 = require("express-validator");
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const auditLogger_service_1 = require("../services/auditLogger.service");
/**
 * 🔒 COMPREHENSIVE INPUT VALIDATION MIDDLEWARE
 * Military-grade input sanitization and validation for Quankey
 * Addresses all security testing requirements for input validation
 */
class InputValidationMiddleware {
    /**
     * 🔐 SANITIZE INPUT - Remove XSS and malicious content
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string')
            return '';
        // 1. DOMPurify for HTML sanitization
        let cleaned = isomorphic_dompurify_1.default.sanitize(input, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
        });
        // 2. Remove JavaScript protocols
        cleaned = cleaned.replace(/javascript:|data:|vbscript:/gi, '');
        // 3. Remove SQL injection patterns - AGGRESSIVE BLOCKING
        cleaned = cleaned.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '');
        cleaned = cleaned.replace(/[';]/g, ''); // Remove dangerous SQL characters
        cleaned = cleaned.replace(/--/g, ''); // Remove SQL comments
        cleaned = cleaned.replace(/['"]/g, ''); // Remove quotes entirely
        // 4. Remove command injection patterns - AGGRESSIVE BLOCKING
        cleaned = cleaned.replace(/[;&|`$(){}[\]]/g, ''); // Remove dangerous shell characters
        cleaned = cleaned.replace(/\.\.\//g, ''); // Remove path traversal
        cleaned = cleaned.replace(/\.\.\\/g, ''); // Remove Windows path traversal
        // 5. Remove dangerous HTML entities
        cleaned = cleaned.replace(/&[#x]?[0-9a-f]+;/gi, '');
        // 6. Normalize whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        return cleaned;
    }
    /**
     * 🚨 DETECT MALICIOUS PATTERNS
     */
    static detectMaliciousPatterns(input) {
        const threats = [];
        // SQL Injection detection
        if (this.PATTERNS.SQL_INJECTION.test(input)) {
            threats.push('SQL_INJECTION_ATTEMPT');
        }
        // XSS detection
        if (this.PATTERNS.XSS_PATTERNS.test(input)) {
            threats.push('XSS_ATTEMPT');
        }
        // Path traversal
        if (input.includes('../') || input.includes('..\\')) {
            threats.push('PATH_TRAVERSAL_ATTEMPT');
        }
        // Command injection
        if (input.includes('|') || input.includes('&') || input.includes(';') || input.includes('$(')) {
            threats.push('COMMAND_INJECTION_ATTEMPT');
        }
        return threats;
    }
    /**
     * 📝 REGISTRATION VALIDATION
     */
    static validateRegistration() {
        return [
            (0, express_validator_1.body)('email')
                .isLength({ min: 1, max: this.LIMITS.EMAIL_MAX })
                .withMessage('Email is required and must be less than 320 characters')
                .matches(this.PATTERNS.EMAIL)
                .withMessage('Invalid email format')
                .normalizeEmail()
                .custom((value) => {
                const threats = this.detectMaliciousPatterns(value);
                if (threats.length > 0) {
                    throw new Error(`Security violation detected: ${threats.join(', ')}`);
                }
                return true;
            }),
            (0, express_validator_1.body)('password')
                .isLength({ min: 8, max: this.LIMITS.PASSWORD_MAX })
                .withMessage('Password must be 8-512 characters')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                .withMessage('Password must contain: lowercase, uppercase, number, and special character'),
            (0, express_validator_1.body)('name')
                .optional()
                .isLength({ max: this.LIMITS.USERNAME_MAX })
                .withMessage('Name must be less than 100 characters')
                .matches(this.PATTERNS.SAFE_STRING)
                .withMessage('Name contains invalid characters')
                .customSanitizer(this.sanitizeInput),
            this.handleValidationErrors
        ];
    }
    /**
     * 🔑 LOGIN VALIDATION
     */
    static validateLogin() {
        return [
            (0, express_validator_1.body)('email')
                .isLength({ min: 1, max: this.LIMITS.EMAIL_MAX })
                .withMessage('Email is required')
                .matches(this.PATTERNS.EMAIL)
                .withMessage('Invalid email format')
                .normalizeEmail()
                .custom((value) => {
                const threats = this.detectMaliciousPatterns(value);
                if (threats.length > 0) {
                    throw new Error('Invalid credentials');
                }
                return true;
            }),
            (0, express_validator_1.body)('password')
                .isLength({ min: 1, max: this.LIMITS.PASSWORD_MAX })
                .withMessage('Password is required')
                .custom((value) => {
                const threats = this.detectMaliciousPatterns(value);
                if (threats.length > 0) {
                    throw new Error('Invalid credentials');
                }
                return true;
            }),
            this.handleValidationErrors
        ];
    }
    /**
     * 🔐 VAULT ITEM VALIDATION
     */
    static validateVaultItem() {
        return [
            (0, express_validator_1.body)('site')
                .isLength({ min: 1, max: this.LIMITS.TITLE_MAX })
                .withMessage('Site is required and must be less than 200 characters')
                .customSanitizer(this.sanitizeInput)
                .custom((value) => {
                const threats = this.detectMaliciousPatterns(value);
                if (threats.length > 0) {
                    throw new Error(`Security violation in site: ${threats.join(', ')}`);
                }
                return true;
            }),
            // Legacy support for 'title' field
            (0, express_validator_1.body)('title')
                .optional()
                .isLength({ min: 1, max: this.LIMITS.TITLE_MAX })
                .withMessage('Title must be less than 200 characters')
                .customSanitizer(this.sanitizeInput)
                .custom((value) => {
                const threats = this.detectMaliciousPatterns(value);
                if (threats.length > 0) {
                    throw new Error(`Security violation in title: ${threats.join(', ')}`);
                }
                return true;
            }),
            (0, express_validator_1.body)('username')
                .optional()
                .isLength({ max: this.LIMITS.USERNAME_MAX })
                .withMessage('Username must be less than 100 characters')
                .customSanitizer(this.sanitizeInput),
            (0, express_validator_1.body)('password')
                .isLength({ min: 1, max: this.LIMITS.PASSWORD_MAX })
                .withMessage('Password is required'),
            (0, express_validator_1.body)('website')
                .optional()
                .isLength({ max: this.LIMITS.URL_MAX })
                .withMessage('Website URL must be less than 2048 characters')
                .custom((value) => {
                if (value && !this.PATTERNS.URL.test(value)) {
                    throw new Error('Invalid website URL format');
                }
                return true;
            }),
            (0, express_validator_1.body)('notes')
                .optional()
                .isLength({ max: this.LIMITS.DESCRIPTION_MAX })
                .withMessage('Notes must be less than 1000 characters')
                .customSanitizer(this.sanitizeInput),
            this.handleValidationErrors
        ];
    }
    /**
     * 🔍 SEARCH VALIDATION
     */
    static validateSearch() {
        return [
            (0, express_validator_1.query)('search')
                .optional()
                .isLength({ max: this.LIMITS.SEARCH_MAX })
                .withMessage('Search query must be less than 100 characters')
                .customSanitizer(this.sanitizeInput)
                .custom((value) => {
                if (!value)
                    return true;
                const threats = this.detectMaliciousPatterns(value);
                if (threats.length > 0) {
                    throw new Error('Invalid search query');
                }
                return true;
            }),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100'),
            (0, express_validator_1.query)('offset')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Offset must be non-negative'),
            this.handleValidationErrors
        ];
    }
    /**
     * 🆔 ID PARAMETER VALIDATION
     */
    static validateId() {
        return [
            (0, express_validator_1.param)('id')
                .isUUID(4)
                .withMessage('Invalid ID format'),
            this.handleValidationErrors
        ];
    }
    /**
     * ⚠️ HANDLE VALIDATION ERRORS
     */
    static handleValidationErrors(req, res, next) {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const errorDetails = errors.array().map(error => ({
                field: error.type === 'field' ? error.path : 'unknown',
                message: error.msg,
                value: error.type === 'field' ? error.value : undefined
            }));
            // 🚨 Log security violations
            InputValidationMiddleware.auditLogger.logSecurityEvent({
                type: 'VALIDATION_FAILURE',
                userId: req.user?.id || 'anonymous',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: `${req.method} ${req.path}`,
                details: {
                    errors: errorDetails,
                    body: req.body,
                    query: req.query,
                    params: req.params
                },
                severity: 'medium'
            });
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Invalid input data provided',
                details: errorDetails.map(e => ({ field: e.field, message: e.message })),
                timestamp: new Date().toISOString()
            });
        }
        next();
    }
    /**
     * 🔐 GENERAL REQUEST SANITIZATION
     */
    static sanitizeRequest(req, res, next) {
        try {
            // Sanitize body
            if (req.body && typeof req.body === 'object') {
                req.body = InputValidationMiddleware.deepSanitize(req.body);
            }
            // Sanitize query parameters
            if (req.query && typeof req.query === 'object') {
                req.query = InputValidationMiddleware.deepSanitize(req.query);
            }
            // Check request size
            const requestSize = JSON.stringify(req.body || {}).length + JSON.stringify(req.query || {}).length;
            if (requestSize > 100000) { // 100KB limit
                return res.status(413).json({
                    error: 'Request too large',
                    message: 'Request payload exceeds size limit',
                    maxSize: '100KB'
                });
            }
            next();
        }
        catch (error) {
            InputValidationMiddleware.auditLogger.logSecurityEvent({
                type: 'REQUEST_SANITIZATION_ERROR',
                userId: req.user?.id || 'anonymous',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: `${req.method} ${req.path}`,
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
                severity: 'high'
            });
            res.status(400).json({
                error: 'Invalid request',
                message: 'Request could not be processed safely'
            });
        }
    }
    /**
     * 🔍 DEEP SANITIZATION FOR NESTED OBJECTS
     */
    static deepSanitize(obj) {
        if (typeof obj === 'string') {
            return this.sanitizeInput(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepSanitize(item));
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                const sanitizedKey = this.sanitizeInput(key);
                sanitized[sanitizedKey] = this.deepSanitize(value);
            }
            return sanitized;
        }
        return obj;
    }
    /**
     * 🧪 QUANTUM TEST VALIDATION
     */
    static validateQuantumTest() {
        return [
            (0, express_validator_1.body)('plaintext')
                .isLength({ min: 1, max: 1000 })
                .withMessage('Plaintext is required and must be less than 1000 characters')
                .customSanitizer(this.sanitizeInput)
                .custom((value) => {
                const threats = this.detectMaliciousPatterns(value);
                if (threats.length > 0) {
                    throw new Error(`Security violation in plaintext: ${threats.join(', ')}`);
                }
                return true;
            }),
            this.handleValidationErrors
        ];
    }
    /**
     * 🔐 PASSKEY REGISTRATION VALIDATION
     */
    static validatePasskeyRegister() {
        return [
            (0, express_validator_1.body)('username')
                .isLength({ min: 1, max: this.LIMITS.USERNAME_MAX })
                .withMessage('Username is required and must be less than 100 characters')
                .matches(this.PATTERNS.SAFE_STRING)
                .withMessage('Username contains invalid characters')
                .customSanitizer(this.sanitizeInput)
                .custom((value) => {
                const threats = this.detectMaliciousPatterns(value);
                if (threats.length > 0) {
                    throw new Error('Invalid username');
                }
                return true;
            }),
            this.handleValidationErrors
        ];
    }
    /**
     * 📱 DEVICE REGISTRATION VALIDATION
     */
    static validateDeviceRegister() {
        return [
            (0, express_validator_1.body)('deviceName')
                .isLength({ min: 1, max: 100 })
                .withMessage('Device name is required and must be less than 100 characters')
                .customSanitizer(this.sanitizeInput)
                .custom((value) => {
                const threats = this.detectMaliciousPatterns(value);
                if (threats.length > 0) {
                    throw new Error('Invalid device name');
                }
                return true;
            }),
            (0, express_validator_1.body)('publicKey')
                .isBase64()
                .withMessage('Public key must be valid base64')
                .isLength({ min: 1 })
                .withMessage('Public key is required'),
            this.handleValidationErrors
        ];
    }
    /**
     * 🔄 PAIRING CONSUME VALIDATION
     */
    static validatePairingConsume() {
        return [
            (0, express_validator_1.body)('token')
                .isLength({ min: 64, max: 64 })
                .withMessage('Invalid token format')
                .isHexadecimal()
                .withMessage('Token must be hexadecimal'),
            (0, express_validator_1.body)('devicePublicKey')
                .isBase64()
                .withMessage('Device public key must be valid base64')
                .isLength({ min: 1 })
                .withMessage('Device public key is required'),
            (0, express_validator_1.body)('deviceName')
                .optional()
                .isLength({ max: 100 })
                .withMessage('Device name must be less than 100 characters')
                .customSanitizer(this.sanitizeInput),
            this.handleValidationErrors
        ];
    }
    /**
     * 👥 GUARDIAN SETUP VALIDATION
     */
    static validateGuardianSetup() {
        return [
            (0, express_validator_1.body)('guardians')
                .isArray({ min: 3, max: 3 })
                .withMessage('Exactly 3 guardians required'),
            (0, express_validator_1.body)('guardians.*.id')
                .isLength({ min: 1, max: 100 })
                .withMessage('Guardian ID is required')
                .customSanitizer(this.sanitizeInput),
            (0, express_validator_1.body)('guardians.*.name')
                .isLength({ min: 1, max: 100 })
                .withMessage('Guardian name is required')
                .customSanitizer(this.sanitizeInput),
            (0, express_validator_1.body)('guardians.*.publicKey')
                .isBase64()
                .withMessage('Guardian public key must be valid base64')
                .isLength({ min: 1 })
                .withMessage('Guardian public key is required'),
            this.handleValidationErrors
        ];
    }
    /**
     * 🔄 RECOVERY INITIATION VALIDATION
     */
    static validateRecoveryInit() {
        return [
            (0, express_validator_1.body)('username')
                .isLength({ min: 1, max: this.LIMITS.USERNAME_MAX })
                .withMessage('Username is required')
                .customSanitizer(this.sanitizeInput),
            (0, express_validator_1.body)('guardianIds')
                .isArray({ min: 2, max: 3 })
                .withMessage('At least 2 guardian IDs required'),
            (0, express_validator_1.body)('guardianIds.*')
                .isLength({ min: 1, max: 100 })
                .withMessage('Invalid guardian ID')
                .customSanitizer(this.sanitizeInput),
            this.handleValidationErrors
        ];
    }
    /**
     * ✅ RECOVERY COMPLETION VALIDATION
     */
    static validateRecoveryComplete() {
        return [
            (0, express_validator_1.body)('recoveryRequestId')
                .isLength({ min: 32, max: 32 })
                .withMessage('Invalid recovery request ID')
                .isHexadecimal()
                .withMessage('Recovery request ID must be hexadecimal'),
            (0, express_validator_1.body)('decryptedShares')
                .isArray({ min: 2, max: 3 })
                .withMessage('At least 2 decrypted shares required'),
            (0, express_validator_1.body)('decryptedShares.*.data')
                .isBase64()
                .withMessage('Share data must be valid base64'),
            (0, express_validator_1.body)('newDevicePublicKey')
                .isBase64()
                .withMessage('New device public key must be valid base64')
                .isLength({ min: 1 })
                .withMessage('New device public key is required'),
            (0, express_validator_1.body)('newDeviceName')
                .optional()
                .isLength({ max: 100 })
                .withMessage('Device name must be less than 100 characters')
                .customSanitizer(this.sanitizeInput),
            this.handleValidationErrors
        ];
    }
}
exports.InputValidationMiddleware = InputValidationMiddleware;
InputValidationMiddleware.auditLogger = new auditLogger_service_1.AuditLogger();
// 🛡️ VALIDATION RULES
InputValidationMiddleware.LIMITS = {
    TITLE_MAX: 200,
    DESCRIPTION_MAX: 1000,
    PASSWORD_MAX: 512,
    URL_MAX: 2048,
    EMAIL_MAX: 320,
    SEARCH_MAX: 100,
    USERNAME_MAX: 100
};
InputValidationMiddleware.PATTERNS = {
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    URL: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,
    SAFE_STRING: /^[a-zA-Z0-9\s\-_@.]+$/,
    SQL_INJECTION: /('|(\\)|(\|)|(\*)|(%)|(\+)|(\?)|(\[)|(\])|(\{)|(\})|(\()|(\))|(\^)|(\$)|(=)|(!)|(<)|(>)|(;)|(:))/i,
    XSS_PATTERNS: /<script|javascript:|onload=|onerror=|onclick=|onmouse|<iframe|<object|<embed|<applet/i
};
/**
 * 🔒 EXPORT VALIDATION MIDDLEWARE
 */
exports.inputValidation = InputValidationMiddleware;
