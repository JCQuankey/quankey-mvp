"use strict";
// backend/src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const quantum_1 = __importDefault(require("./routes/quantum"));
const auth_1 = require("./routes/auth");
// SECURITY RECOVERY: Real WebAuthn routes
const authReal_1 = require("./routes/authReal");
const hybridDatabaseService_1 = require("./services/hybridDatabaseService");
const passwords_1 = __importDefault(require("./routes/passwords"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const recovery_1 = __importDefault(require("./routes/recovery"));
const auth_2 = require("./middleware/auth");
// Security hardening imports
const rateLimiting_1 = require("./middleware/rateLimiting");
const auditLogging_1 = require("./middleware/auditLogging");
const basicAuth_1 = __importDefault(require("./middleware/basicAuth"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Basic Auth Protection (when enabled)
app.use(basicAuth_1.default);
app.use('/dashboard', dashboard_1.default);
// CORS Configuration - CRITICAL for production domains
const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://quankey.xyz', // ← CRITICAL: Frontend domain
    'https://www.quankey.xyz', // ← CRITICAL: WWW domain  
    'https://api.quankey.xyz', // ← CRITICAL: API domain
    'https://quankey-mvp.onrender.com'
];
console.log('🌐 [CORS] Configured for origins:', allowedOrigins);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        console.log('🌐 [CORS] Request from origin:', origin || 'no-origin');
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            console.log('✅ [CORS] Origin allowed:', origin);
            return callback(null, true);
        }
        console.log('❌ [CORS] Origin blocked:', origin);
        return callback(new Error('CORS policy violation'), false);
    },
    credentials: true, // ← IMPORTANT for auth
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));
// Middleware
app.use(express_1.default.json());
// Security hardening middleware - Applied BEFORE routes
app.use(rateLimiting_1.trackFailedAttempt); // Track failed authentication attempts
app.use(rateLimiting_1.threatDetection); // AI-powered threat detection
// Logging middleware para debug + audit logging
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path}`);
    next();
});
// Audit logging for all requests
app.use((0, auditLogging_1.auditMiddleware)(auditLogging_1.AuditEventType.SYSTEM_ERROR, 'API Request', auditLogging_1.RiskLevel.LOW));
// Routes with security hardening - ORDEN IMPORTANTE
app.use('/api/auth', (0, rateLimiting_1.createRateLimiter)('authentication'), (0, auditLogging_1.auditMiddleware)(auditLogging_1.AuditEventType.USER_LOGIN, 'Authentication Request', auditLogging_1.RiskLevel.MEDIUM), auth_1.authRouter);
// SECURITY RECOVERY: Real WebAuthn routes
app.use('/api/auth-real', (0, rateLimiting_1.createRateLimiter)('authentication'), (0, auditLogging_1.auditMiddleware)(auditLogging_1.AuditEventType.USER_LOGIN, 'Real WebAuthn Authentication', auditLogging_1.RiskLevel.HIGH), authReal_1.authRealRouter);
app.use('/api/quantum', (0, rateLimiting_1.createRateLimiter)('passwordGeneration'), (0, auditLogging_1.auditMiddleware)(auditLogging_1.AuditEventType.QUANTUM_GENERATION, 'Quantum Password Generation', auditLogging_1.RiskLevel.LOW), quantum_1.default);
app.use('/api/passwords', (0, rateLimiting_1.createRateLimiter)('vaultAccess'), auth_2.authMiddleware, (0, auditLogging_1.auditMiddleware)(auditLogging_1.AuditEventType.VAULT_ACCESSED, 'Password Vault Access', auditLogging_1.RiskLevel.MEDIUM), passwords_1.default);
app.use('/api/dashboard', (0, rateLimiting_1.createRateLimiter)('api'), auth_2.authMiddleware, (0, auditLogging_1.auditMiddleware)(auditLogging_1.AuditEventType.VAULT_ACCESSED, 'Dashboard Access', auditLogging_1.RiskLevel.LOW), dashboard_1.default);
app.use('/api/recovery', (0, rateLimiting_1.createRateLimiter)('api'), (0, auditLogging_1.auditMiddleware)(auditLogging_1.AuditEventType.RECOVERY_INITIATED, 'Recovery Request', auditLogging_1.RiskLevel.HIGH), recovery_1.default);
// Health check with security status
app.get('/api/health', async (req, res) => {
    const dbHealth = await hybridDatabaseService_1.HybridDatabaseService.healthCheck();
    res.json({
        status: 'OK',
        message: 'Quankey Backend is running!',
        database: dbHealth ? 'Connected' : 'Disconnected',
        features: [
            'quantum-generation',
            'webauthn-biometric',
            'postgresql-persistence',
            'quantum-enhanced-security',
            'enterprise-audit-logging',
            'ai-threat-detection'
        ],
        security: {
            hardening: 'active',
            rateLimiting: 'enabled',
            threatDetection: 'quantum-enhanced',
            auditLogging: 'comprehensive'
        },
        timestamp: new Date().toISOString()
    });
});
// Security monitoring endpoints
app.get('/api/security/metrics', rateLimiting_1.securityMetrics);
app.get('/api/security/audit', auditLogging_1.auditMetricsEndpoint);
// 404 handler
app.use((req, res) => {
    console.log(`[404] Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});
// Initialize database and start server
async function startServer() {
    // Initialize hybrid database service
    const dbInitialized = await hybridDatabaseService_1.HybridDatabaseService.initialize();
    if (!dbInitialized) {
        console.error('❌ Failed to initialize database service');
        process.exit(1);
    }
    const dbInfo = hybridDatabaseService_1.HybridDatabaseService.getDatabaseInfo();
    console.log(`[DB] Database service initialized: ${dbInfo.type} (${dbInfo.persistent ? 'persistent' : 'temporary'})`);
    console.log(`[DB] Features: ${dbInfo.features.join(', ')}`);
    app.listen(PORT, () => {
        console.log(`[SERVER] Quankey Backend running on port ${PORT}`);
        console.log(`[HEALTH] Check: http://localhost:${PORT}/api/health`);
        console.log('[AUTH] WebAuthn biometric auth ready');
        console.log('[QUANTUM] Multi-source quantum generation ready');
        console.log(`[DB] Database: ${dbInfo.type} ${dbInfo.persistent ? '(persistent)' : '(in-memory)'}`);
        console.log('\n[ROUTES] Available endpoints:');
        console.log('   POST /api/auth/register');
        console.log('   POST /api/auth/login');
        console.log('   POST /api/quantum/password');
        console.log('   GET  /api/quantum/test-connection');
        console.log('   GET  /api/quantum/health');
        console.log('   POST /api/passwords/generate');
        console.log('   POST /api/passwords/save');
        console.log('   GET  /api/passwords');
        console.log('   GET  /api/passwords/stats/security');
        console.log('   GET  /api/passwords/:id');
        console.log('   PUT  /api/passwords/:id');
        console.log('   DELETE /api/passwords/:id');
        console.log('   POST /api/passwords/import');
        console.log('   GET  /api/passwords/export');
        console.log('   GET  /api/dashboard/stats');
        console.log('   GET  /api/dashboard/recommendations');
        console.log('   GET  /api/dashboard/activity');
        console.log('   POST /api/recovery/generate-kit');
        console.log('   POST /api/recovery/social-recovery/initiate');
        console.log('   POST /api/recovery/recover-with-shares');
        console.log('   GET  /api/recovery/status');
    });
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Shutting down gracefully...');
    await hybridDatabaseService_1.HybridDatabaseService.disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n[SHUTDOWN] Shutting down gracefully...');
    await hybridDatabaseService_1.HybridDatabaseService.disconnect();
    process.exit(0);
});
startServer().catch(console.error);
