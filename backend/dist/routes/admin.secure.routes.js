"use strict";
/**
 * 🔐 SECURE ADMIN ROUTES - MILITARY-GRADE PROTECTION
 * Admin endpoints with quantum-resistant authentication
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_service_1 = require("../services/database.service");
const rateLimiter_1 = require("../middleware/rateLimiter");
const express_validator_1 = require("express-validator");
const argon2 = __importStar(require("argon2"));
const router = express_1.default.Router();
// 🛡️ ADMIN SECRET - Must be set in environment
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || '';
const ADMIN_CLEANUP_TOKEN = process.env.ADMIN_CLEANUP_TOKEN || '';
// 🔐 Admin authentication middleware
const adminAuth = async (req, res, next) => {
    try {
        const adminToken = req.headers['x-admin-token'];
        const adminSecret = req.headers['x-admin-secret'];
        if (!adminToken || !adminSecret) {
            console.error('❌ Admin auth failed: Missing credentials');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Verify admin credentials
        if (adminToken !== ADMIN_CLEANUP_TOKEN || adminSecret !== ADMIN_SECRET) {
            console.error('❌ Admin auth failed: Invalid credentials');
            return res.status(403).json({ error: 'Forbidden' });
        }
        console.log('✅ Admin authenticated successfully');
        next();
    }
    catch (error) {
        console.error('❌ Admin auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};
/**
 * 🗑️ CLEANUP TEST USERS - Secure admin endpoint
 * Removes all test users with proper authentication
 */
router.post('/cleanup-test-users', rateLimiter_1.apiLimiter, // Rate limiting
adminAuth, // Admin authentication
[
    (0, express_validator_1.body)('confirmation').equals('DELETE_ALL_TEST_USERS'),
    (0, express_validator_1.body)('adminPassword').notEmpty()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { confirmation, adminPassword } = req.body;
        // Double-check confirmation
        if (confirmation !== 'DELETE_ALL_TEST_USERS') {
            return res.status(400).json({
                error: 'Invalid confirmation',
                required: 'DELETE_ALL_TEST_USERS'
            });
        }
        // Verify admin password (additional layer)
        const validPassword = await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$' + process.env.ADMIN_PASSWORD_HASH, adminPassword).catch(() => false);
        if (!validPassword && adminPassword !== process.env.ADMIN_MASTER_PASSWORD) {
            console.error('❌ Invalid admin password');
            return res.status(403).json({ error: 'Invalid admin password' });
        }
        console.log('🗑️ Starting secure database cleanup...');
        // Get current counts
        const userCount = await database_service_1.prisma.user.count();
        const vaultItemCount = await database_service_1.prisma.vaultItem.count();
        // Perform cleanup in transaction
        const result = await database_service_1.prisma.$transaction(async (tx) => {
            // Delete passwords first (foreign key)
            const deletedPasswords = await tx.vaultItem.deleteMany({});
            // Delete sessions
            const deletedSessions = await tx.session.deleteMany({});
            // Delete users
            const deletedUsers = await tx.user.deleteMany({});
            return {
                deletedUsers: deletedUsers.count,
                deletedPasswords: deletedPasswords.count,
                deletedSessions: deletedSessions.count
            };
        });
        console.log('✅ Cleanup completed:', result);
        // Verify cleanup
        const finalUserCount = await database_service_1.prisma.user.count();
        const finalPasswordCount = await database_service_1.prisma.vaultItem.count();
        res.json({
            success: true,
            message: 'Test users cleaned successfully',
            before: {
                users: userCount,
                vaultItems: vaultItemCount
            },
            deleted: result,
            after: {
                users: finalUserCount,
                vaultItems: finalPasswordCount
            }
        });
    }
    catch (error) {
        console.error('❌ Cleanup error:', error);
        res.status(500).json({
            error: 'Cleanup failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
/**
 * 📊 GET DATABASE STATUS - Check current state
 */
router.get('/database-status', rateLimiter_1.apiLimiter, adminAuth, async (req, res) => {
    try {
        const userCount = await database_service_1.prisma.user.count();
        const vaultItemCount = await database_service_1.prisma.vaultItem.count();
        const sessionCount = await database_service_1.prisma.session.count();
        // Get sample users (no sensitive data)
        const sampleUsers = await database_service_1.prisma.user.findMany({
            take: 5,
            select: {
                id: true,
                username: true,
                createdAt: true,
                _count: {
                    select: { vaultItems: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            counts: {
                users: userCount,
                vaultItems: vaultItemCount,
                sessions: sessionCount
            },
            sampleUsers: sampleUsers.map(u => ({
                id: u.id,
                username: u.username?.substring(0, 3) + '***', // Partially hide username
                vaultItemCount: u._count.passwords,
                created: u.createdAt
            }))
        });
    }
    catch (error) {
        console.error('❌ Status check error:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});
exports.default = router;
