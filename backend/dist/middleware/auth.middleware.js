"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const jose = __importStar(require("jose"));
const database_service_1 = require("../services/database.service");
const crypto_1 = require("crypto");
// Use the global Express.Request type with user property defined in types/express.d.ts
class AuthMiddleware {
    static async initialize() {
        // Cargar clave pública Ed25519 - O MORIR
        const key = process.env.JWT_PUBLIC_KEY;
        if (!key) {
            console.error('FATAL: JWT_PUBLIC_KEY not configured');
            process.exit(1);
        }
        try {
            this.publicKey = await jose.importSPKI(key, 'EdDSA');
            console.log('✅ Ed25519 JWT verification initialized');
        }
        catch (error) {
            console.error('FATAL: Invalid JWT_PUBLIC_KEY');
            process.exit(1);
        }
    }
    static async validateRequest(req, res, next) {
        const startTime = Date.now();
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            await database_service_1.db.auditOperation({
                userId: 'anonymous',
                action: 'AUTH_ATTEMPT',
                resource: req.path,
                result: 'FAILURE',
                metadata: { reason: 'No token', ip: req.ip }
            });
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Check blacklist
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        if (this.blacklistedTokens.has(tokenHash)) {
            return res.status(401).json({ error: 'Token revoked' });
        }
        try {
            // Validación ESTRICTA - Sin excepciones
            const { payload } = await jose.jwtVerify(token, this.publicKey, {
                algorithms: ['EdDSA'], // SOLO EdDSA
                issuer: 'quankey-auth',
                audience: 'quankey-api',
                maxTokenAge: '15m', // 15 minutos MÁXIMO
                clockTolerance: 0
            });
            // Verificar usuario en DB - usando la instancia correcta
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../services/database.service')));
            const user = await prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    username: true
                }
            });
            if (!user) {
                throw new Error('User not found');
            }
            // Attach user
            req.user = {
                id: user.id,
                username: user.username
            };
            // Audit success
            await database_service_1.db.auditOperation({
                userId: user.id,
                action: 'AUTH_SUCCESS',
                resource: req.path,
                result: 'SUCCESS',
                metadata: {
                    duration: Date.now() - startTime,
                    ip: req.ip
                }
            });
            next();
        }
        catch (error) {
            await database_service_1.db.auditOperation({
                userId: 'unknown',
                action: 'AUTH_FAILURE',
                resource: req.path,
                result: 'FAILURE',
                metadata: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    ip: req.ip,
                    duration: Date.now() - startTime
                }
            });
            return res.status(401).json({ error: 'Invalid authentication' });
        }
    }
    // Revocación de tokens
    static revokeToken(token) {
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        this.blacklistedTokens.add(tokenHash);
        // Limpiar tokens viejos cada hora
        setTimeout(() => {
            this.blacklistedTokens.delete(tokenHash);
        }, 60 * 60 * 1000);
    }
}
exports.AuthMiddleware = AuthMiddleware;
AuthMiddleware.blacklistedTokens = new Set();
// Auth middleware is ready
