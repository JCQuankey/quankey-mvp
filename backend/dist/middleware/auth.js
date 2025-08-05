"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('❌ No authorization header or wrong format');
            return res.status(401).json({ error: 'No authorization header' });
        }
        const token = authHeader.substring(7);
        console.log('🔍 Auth middleware - Token found:', token.substring(0, 20) + '...');
        // 🚨 CRITICAL FIX: Properly verify and decode JWT
        try {
            const JWT_SECRET = process.env.JWT_SECRET || 'quankey_jwt_secret_quantum_2024_production';
            // VERIFY the token with the secret (not just decode)
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            console.log('📝 JWT verified and decoded:', {
                userId: decoded.userId,
                username: decoded.username,
                authMethod: decoded.authMethod,
                exp: new Date(decoded.exp * 1000)
            });
            // 🔴 CRITICAL: Extract REAL userId from JWT payload
            const userId = decoded.userId;
            const username = decoded.username;
            if (!userId) {
                console.error('❌ JWT payload missing userId');
                return res.status(401).json({ error: 'Invalid token payload' });
            }
            // 🚨 CRITICAL: Verify user exists in database
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                console.error('❌ User not found in database:', userId);
                return res.status(401).json({ error: 'User not found' });
            }
            // Set authenticated user with REAL database ID
            req.user = {
                id: userId, // <-- REAL user ID from database
                username: username || user.username,
                webauthnId: user.webauthnId || `webauthn_${userId}`
            };
            console.log('✅ User authenticated correctly:', {
                id: req.user.id,
                username: req.user.username,
                exists_in_db: !!user
            });
            next();
        }
        catch (jwtError) {
            console.error('❌ JWT verification failed:', jwtError);
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            }
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }
            return res.status(401).json({ error: 'Token verification failed' });
        }
    }
    catch (error) {
        console.error('❌ Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.authMiddleware = authMiddleware;
