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
exports.authenticatePasskey = authenticatePasskey;
const jose = __importStar(require("jose"));
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
// Use the global Express.Request type with user property defined in types/express.d.ts
class AuthMiddleware {
    static async initialize() {
        // Cargar clave pública Ed25519 - O MORIR
        const publicKey = process.env.JWT_PUBLIC_KEY;
        const privateKey = process.env.JWT_PRIVATE_KEY;
        if (!publicKey || !privateKey) {
            console.error('FATAL: JWT_PUBLIC_KEY or JWT_PRIVATE_KEY not configured');
            process.exit(1);
        }
        try {
            this.publicKey = await jose.importSPKI(publicKey, 'EdDSA');
            this.privateKey = await jose.importPKCS8(privateKey, 'EdDSA');
            console.log('✅ Ed25519 JWT signing/verification initialized');
        }
        catch (error) {
            console.error('FATAL: Invalid JWT keys');
            process.exit(1);
        }
    }
    static async generateToken(user) {
        if (!this.privateKey) {
            throw new Error('JWT not initialized');
        }
        const jwt = await new jose.SignJWT({
            sub: user.userId,
            email: user.email
        })
            .setProtectedHeader({ alg: 'EdDSA' })
            .setIssuedAt()
            .setIssuer('quankey-auth')
            .setAudience('quankey-api')
            .setExpirationTime('15m')
            .sign(this.privateKey);
        return jwt;
    }
    static async verifyToken(req, res, next) {
        return AuthMiddleware.validateRequest(req, res, next);
    }
    static async validateRequest(req, res, next) {
        const startTime = Date.now();
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            // await prisma.auditOperation({  // Commented out - auditOperation not in Prisma schema
            //   userId: 'anonymous',
            //   action: 'AUTH_ATTEMPT',
            //   resource: req.path,
            //   result: 'FAILURE',
            //   metadata: { reason: 'No token', ip: req.ip }
            // });
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
            // await prisma.auditOperation({  // Commented out - auditOperation not in Prisma schema
            //   userId: user.id,
            //   action: 'AUTH_SUCCESS',
            //   resource: req.path,
            //   result: 'SUCCESS',
            //   metadata: { 
            //     duration: Date.now() - startTime,
            //     ip: req.ip
            //   }
            // });
            next();
        }
        catch (error) {
            // await prisma.auditOperation({  // Commented out - auditOperation not in Prisma schema
            //   userId: 'unknown',
            //   action: 'AUTH_FAILURE',
            //   resource: req.path,
            //   result: 'FAILURE',
            //   metadata: {
            //     error: error instanceof Error ? error.message : 'Unknown error',
            //     ip: req.ip,
            //     duration: Date.now() - startTime
            //   }
            // });
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
/**
 * 🔐 PASSKEY AUTHENTICATION MIDDLEWARE - REALISTIC ARCHITECTURE
 *
 * Authenticates users based on session tokens from passkey authentication
 * Validates session tokens and loads user context
 */
async function authenticatePasskey(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }
        // Find valid session
        const session = await prisma.session.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        createdAt: true,
                        lastLogin: true
                    }
                }
            }
        });
        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }
        // Check if session is expired
        if (session.expiresAt < new Date()) {
            // Clean up expired session
            await prisma.session.delete({
                where: { id: session.id }
            });
            return res.status(401).json({
                success: false,
                message: 'Authentication token expired'
            });
        }
        // Update session activity
        await prisma.session.update({
            where: { id: session.id },
            data: { lastActivity: new Date() }
        });
        // Attach user to request
        req.user = session.user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication service error'
        });
    }
}
// Auth middleware is ready
