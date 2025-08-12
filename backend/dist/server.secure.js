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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
/// <reference path="./types/express.d.ts" />
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = require("crypto");
const auth_middleware_1 = require("./middleware/auth.middleware");
const rateLimiter_1 = require("./middleware/rateLimiter");
const inputValidation_middleware_1 = require("./middleware/inputValidation.middleware");
const database_service_1 = require("./services/database.service");
const quantum_routes_1 = __importDefault(require("./routes/quantum.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const quantum_biometric_routes_1 = __importDefault(require("./routes/quantum.biometric.routes"));
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 5000;
// Inicialización crítica
async function initialize() {
    console.log('🚀 Starting Quankey Security Service...');
    // Verificar variables críticas
    const required = [
        'DATABASE_URL',
        'JWT_PUBLIC_KEY',
        'JWT_PRIVATE_KEY',
        'DB_ENCRYPTION_KEY'
    ];
    for (const key of required) {
        if (!process.env[key]) {
            console.error(`FATAL: ${key} not configured`);
            process.exit(1);
        }
    }
    // Inicializar servicios
    await auth_middleware_1.AuthMiddleware.initialize();
    // Security headers - MILITARY-GRADE STRICT CSP
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'none'"], // Deny all by default
                scriptSrc: ["'self'", "'strict-dynamic'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: [
                    "'self'",
                    'https://quankey.xyz',
                    'https://api.quankey.xyz',
                    'https://qrng.anu.edu.au' // ANU QRNG for quantum entropy
                ],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                objectSrc: ["'none'"],
                mediaSrc: ["'none'"],
                frameSrc: ["'none'"],
                childSrc: ["'none'"],
                workerSrc: ["'self'"],
                manifestSrc: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"],
                upgradeInsecureRequests: []
            },
            reportOnly: false // Enforce, don't just report
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
    // CORS restrictivo - permite www y sin www
    const allowedOrigins = [
        'https://quankey.xyz',
        'https://www.quankey.xyz',
        'http://localhost:3000', // Para desarrollo local
        'http://localhost:3001' // Puerto alternativo
    ];
    // Añadir FRONTEND_URL y CORS_ORIGIN si están configurados
    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }
    if (process.env.CORS_ORIGIN) {
        allowedOrigins.push(process.env.CORS_ORIGIN);
    }
    app.use((0, cors_1.default)({
        origin: function (origin, callback) {
            // Permitir requests sin origin (Postman, curl, etc) solo en desarrollo
            if (!origin && process.env.NODE_ENV === 'development') {
                return callback(null, true);
            }
            if (origin && allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                console.warn(`CORS blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express_1.default.json({ limit: '1mb' })); // Límite estricto
    app.use(inputValidation_middleware_1.inputValidation.sanitizeRequest); // Global input sanitization
    // Health check SIN autenticación - with rate limiting
    app.get('/health', rateLimiter_1.apiLimiter, async (req, res) => {
        try {
            const dbHealth = await database_service_1.db.healthCheck();
            res.status(200).json({
                status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                version: '2.5.0-secure'
            });
        }
        catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                error: 'Database connection failed'
            });
        }
    });
    // Authentication routes - REAL WebAuthn implementation (legacy)
    app.use('/api/auth', auth_routes_1.default);
    // QUANTUM BIOMETRIC IDENTITY ROUTES - NO PASSWORDS
    app.use('/api/auth', quantum_biometric_routes_1.default);
    // Basic vault operations (simplified for security focus)
    app.use('/api/vault', auth_middleware_1.AuthMiddleware.validateRequest, rateLimiter_1.vaultLimiter);
    // Get vault items
    app.get('/api/vault/items', auth_middleware_1.AuthMiddleware.validateRequest, async (req, res) => {
        try {
            const { VaultService } = await Promise.resolve().then(() => __importStar(require('./services/vault.service')));
            const items = await VaultService.getItems(req.user.id);
            res.json({ success: true, items });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get vault items'
            });
        }
    });
    // Create vault item
    app.post('/api/vault/items', auth_middleware_1.AuthMiddleware.validateRequest, inputValidation_middleware_1.inputValidation.validateVaultItem(), async (req, res) => {
        try {
            const { VaultService } = await Promise.resolve().then(() => __importStar(require('./services/vault.service')));
            const item = await VaultService.createItem(req.user.id, {
                site: req.body.site || req.body.title, // Support legacy API
                username: req.body.username,
                password: req.body.password,
                notes: req.body.notes,
                category: req.body.category
            });
            res.json({ success: true, item });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create item'
            });
        }
    });
    // Get password (separate endpoint for security)
    app.get('/api/vault/items/:id/password', auth_middleware_1.AuthMiddleware.validateRequest, inputValidation_middleware_1.inputValidation.validateId(), async (req, res) => {
        try {
            const { VaultService } = await Promise.resolve().then(() => __importStar(require('./services/vault.service')));
            const password = await VaultService.getPassword(req.user.id, req.params.id);
            res.json({ success: true, password });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                error: 'Password not found'
            });
        }
    });
    // Delete vault item
    app.delete('/api/vault/items/:id', auth_middleware_1.AuthMiddleware.validateRequest, inputValidation_middleware_1.inputValidation.validateId(), async (req, res) => {
        try {
            const { VaultService } = await Promise.resolve().then(() => __importStar(require('./services/vault.service')));
            await VaultService.deleteItem(req.user.id, req.params.id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }
    });
    // Quantum API routes - PUBLIC (no auth required for status endpoints)
    app.use('/api/quantum', rateLimiter_1.apiLimiter, quantum_routes_1.default);
    // Apply rate limiting to all other API routes
    app.use('/api', auth_middleware_1.AuthMiddleware.validateRequest, rateLimiter_1.apiLimiter);
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Not found' });
    });
    // Admin routes (SECURE - only with proper authentication)
    if (process.env.ADMIN_SECRET_KEY && process.env.ADMIN_CLEANUP_TOKEN) {
        const adminRoutes = require('./routes/admin.secure.routes').default;
        app.use('/api/admin', adminRoutes);
        console.log('🔐 Admin routes enabled (secure)');
    }
    // Error handler
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        // NUNCA exponer detalles del error
        res.status(500).json({
            error: 'Internal server error',
            id: (0, crypto_1.randomBytes)(8).toString('hex') // Para tracking
        });
    });
    // Start server
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log('🔒 Security features: ACTIVE');
        console.log('📊 Audit logging: ENABLED');
        console.log('🚫 Rate limiting: ENFORCED');
    });
}
// Start con manejo de errores
initialize().catch((error) => {
    console.error('❌ FATAL: Server initialization failed:', error);
    process.exit(1);
});
