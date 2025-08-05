"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/passwords.ts - VERSIÓN FUNCIONANDO
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const passwordController_1 = require("../controllers/passwordController");
// PATENT-CRITICAL: Import/Export functionality for enterprise adoption
// const { importPasswords, exportPasswords } = require('../../controllers/importExportController');
// Wrapper functions para métodos estáticos  
router.post('/generate', (req, res) => passwordController_1.PasswordController.generatePassword(req, res));
// 🚨 CRITICAL DEBUGGING: Enhanced save endpoint with comprehensive logging
router.post('/save', async (req, res) => {
    const debugId = `save_debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        console.log(`🚨 [${debugId}] SAVE PASSWORD REQUEST RECEIVED:`);
        console.log(`🚨 [${debugId}] Request method: ${req.method}`);
        console.log(`🚨 [${debugId}] Request URL: ${req.url}`);
        console.log(`🚨 [${debugId}] Headers:`, {
            'content-type': req.headers['content-type'],
            'authorization': req.headers.authorization ? `Bearer ${req.headers.authorization.substring(0, 20)}...` : 'MISSING',
            'content-length': req.headers['content-length']
        });
        console.log(`🚨 [${debugId}] Auth middleware user:`, {
            hasUser: !!req.user,
            userId: req.user?.id,
            username: req.user?.username
        });
        console.log(`🚨 [${debugId}] Request body:`, {
            bodyExists: !!req.body,
            bodyKeys: req.body ? Object.keys(req.body) : [],
            bodySize: JSON.stringify(req.body || {}).length,
            site: req.body?.site,
            username: req.body?.username,
            hasPassword: !!req.body?.password,
            passwordLength: req.body?.password?.length,
            isQuantum: req.body?.isQuantum,
            hasQuantumInfo: !!req.body?.quantumInfo
        });
        console.log(`🚨 [${debugId}] Calling PasswordController.savePassword...`);
        // Call the original controller method
        await passwordController_1.PasswordController.savePassword(req, res);
        console.log(`🚨 [${debugId}] PasswordController.savePassword completed successfully`);
    }
    catch (error) {
        console.error(`🚨 [${debugId}] CRITICAL ERROR in route wrapper:`, {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack
        });
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Password save failed in route wrapper',
                debugId,
                details: process.env.NODE_ENV === 'development' ? {
                    message: error.message,
                    code: error.code
                } : undefined
            });
        }
    }
});
// 🚨 DEBUGGING: Database health check endpoint
router.get('/debug/health', async (req, res) => {
    const debugId = `health_${Date.now()}`;
    try {
        console.log(`🩺 [${debugId}] Password route health check...`);
        // Test database connection
        const { PrismaClient } = require('@prisma/client');
        const testPrisma = new PrismaClient();
        console.log(`🩺 [${debugId}] Testing database connection...`);
        await testPrisma.$queryRaw `SELECT 1 as test`;
        console.log(`🩺 [${debugId}] Testing password model...`);
        const passwordCount = await testPrisma.password.count();
        console.log(`🩺 [${debugId}] Testing user authentication...`);
        const userId = req.user?.id;
        await testPrisma.$disconnect();
        res.json({
            success: true,
            debugId,
            database: 'connected',
            passwordCount,
            authUser: {
                hasUser: !!userId,
                userId: userId
            }
        });
    }
    catch (error) {
        console.error(`🩺 [${debugId}] Health check failed:`, error);
        res.status(500).json({
            success: false,
            debugId,
            error: error.message,
            stack: error.stack
        });
    }
});
router.get('/', (req, res) => passwordController_1.PasswordController.getPasswords(req, res));
router.get('/stats/security', (req, res) => passwordController_1.PasswordController.getSecurityStats(req, res));
router.get('/:id', (req, res) => passwordController_1.PasswordController.getPassword(req, res));
router.put('/:id', (req, res) => passwordController_1.PasswordController.updatePassword(req, res));
router.delete('/:id', (req, res) => passwordController_1.PasswordController.deletePassword(req, res));
// PATENT-CRITICAL: Import/Export routes with full audit trail
// These endpoints demonstrate our zero-knowledge architecture even during data migration
// router.post('/import', importPasswords);
// router.get('/export', exportPasswords);
exports.default = router;
