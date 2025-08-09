"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vaultLimiter = exports.passwordGenLimiter = exports.apiLimiter = exports.authLimiter = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_service_1 = require("../services/database.service");
// Store en memoria - Redis vendrá con AWS
const bruteForcePrevention = new Map();
const createRateLimiter = (name, windowMs, max, blockDuration = 3600000 // 1 hora por defecto
) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            // IP + User ID si existe
            const userId = req.user?.id || 'anonymous';
            return `${req.ip}:${userId}`;
        },
        handler: async (req, res) => {
            const key = `${req.ip}:${req.user?.id || 'anonymous'}`;
            // Incrementar contador de violaciones
            const violations = (bruteForcePrevention.get(key) || 0) + 1;
            bruteForcePrevention.set(key, violations);
            // Block exponencial
            if (violations > 3) {
                const blockTime = blockDuration * Math.pow(2, violations - 3);
                await database_service_1.db.auditOperation({
                    userId: req.user?.id || 'anonymous',
                    action: 'RATE_LIMIT_VIOLATION',
                    resource: req.path,
                    result: 'FAILURE',
                    metadata: {
                        violations,
                        blockTime,
                        ip: req.ip,
                        userAgent: req.headers['user-agent']
                    }
                });
                return res.status(429).json({
                    error: 'Too many violations. Blocked.',
                    retryAfter: Math.floor(blockTime / 1000)
                });
            }
            res.status(429).json({
                error: 'Rate limit exceeded',
                retryAfter: windowMs / 1000
            });
        },
        skip: (req) => {
            // Nunca skipear rate limiting
            return false;
        }
    });
};
exports.createRateLimiter = createRateLimiter;
// Límites AGRESIVOS - Sin piedad
exports.authLimiter = (0, exports.createRateLimiter)('auth', 15 * 60 * 1000, // 15 minutos
3, // 3 intentos
24 * 60 * 60 * 1000 // Block 24h
);
exports.apiLimiter = (0, exports.createRateLimiter)('api', 60 * 1000, // 1 minuto
30, // 30 requests
60 * 60 * 1000 // Block 1h
);
exports.passwordGenLimiter = (0, exports.createRateLimiter)('password-gen', 60 * 1000, // 1 minuto
5, // 5 generaciones
60 * 60 * 1000 // Block 1h
);
exports.vaultLimiter = (0, exports.createRateLimiter)('vault', 60 * 1000, // 1 minuto
20, // 20 operaciones
60 * 60 * 1000 // Block 1h
);
