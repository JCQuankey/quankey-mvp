"use strict";
// backend/src/server.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const quantum_1 = __importDefault(require("./routes/quantum"));
const auth_1 = require("./routes/auth");
const databaseService_1 = require("./services/databaseService");
const passwords_1 = __importDefault(require("./routes/passwords"));
const dashboardRoutes = require('./routes/dashboard');
const recovery_1 = __importDefault(require("./routes/recovery"));
const auth_2 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// CORS Configuration - ANTES de todo middleware
app.use((req, res, next) => {
    console.log('[CORS] Applied for:', req.headers.origin);
    res.header('Access-Control-Allow-Origin', 'https://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        console.log('[CORS] Handling preflight request');
        return res.status(200).end();
    }
    next();
});
// Middleware
app.use(express_1.default.json());
// Logging middleware para debug
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path}`);
    next();
});
// Routes - ORDEN IMPORTANTE
app.use('/api/auth', auth_1.authRouter); // Primero auth (sin middleware)
app.use('/api/quantum', quantum_1.default); // Luego quantum
app.use('/api/passwords', auth_2.authMiddleware, passwords_1.default); // Passwords con auth
app.use('/api/dashboard', auth_2.authMiddleware, dashboardRoutes); // Dashboard con auth
app.use('/api/recovery', recovery_1.default); // Mix of auth and no-auth routes
// Health check
app.get('/api/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dbHealth = yield databaseService_1.DatabaseService.healthCheck();
    res.json({
        status: 'OK',
        message: 'Quankey Backend is running!',
        database: dbHealth ? 'Connected' : 'Disconnected',
        features: ['quantum-generation', 'webauthn-biometric', 'postgresql-persistence'],
        timestamp: new Date().toISOString()
    });
}));
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
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('[DB] Database service initialized (in-memory mode)');
        app.listen(PORT, () => {
            console.log(`[SERVER] Quankey Backend running on port ${PORT}`);
            console.log(`[HEALTH] Check: http://localhost:${PORT}/api/health`);
            console.log('[AUTH] WebAuthn biometric auth ready');
            console.log('[QUANTUM] Quantum password generation ready');
            console.log('[DB] PostgreSQL database connected');
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
    });
}
// Graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n[SHUTDOWN] Shutting down gracefully...');
    yield databaseService_1.DatabaseService.disconnect();
    process.exit(0);
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n[SHUTDOWN] Shutting down gracefully...');
    yield databaseService_1.DatabaseService.disconnect();
    process.exit(0);
}));
startServer().catch(console.error);
