// backend/src/server.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import quantumRouter from './routes/quantum';
import { authRouter } from './routes/auth';
// SECURITY RECOVERY: Real WebAuthn routes
import { authRealRouter } from './routes/authReal';
// 🚀 PATENT-CRITICAL: World's first quantum vault routes
import vaultRouter from './routes/vault';
// 🚀 PATENT-CRITICAL: World's first ML-DSA-65 audit system
import auditRouter from './routes/audit';
import { HybridDatabaseService } from './services/hybridDatabaseService';
import passwordRoutes from './routes/passwords';
import dashboardRoutes from './routes/dashboard';
import recoveryRoutes from './routes/recovery';
import { authMiddleware } from './middleware/auth';

// Security hardening imports
import { 
  createRateLimiter, 
  threatDetection, 
  securityMetrics, 
  trackFailedAttempt 
} from './middleware/rateLimiting';
import { 
  intelligentSecurityMiddleware,
  createIntelligentRateLimiter,
  intelligentSecurityMetrics
} from './middleware/intelligentThreatDetection';
import { 
  auditMiddleware, 
  auditMetricsEndpoint, 
  AuditEventType, 
  RiskLevel 
} from './middleware/auditLogging';
import basicAuthMiddleware from './middleware/basicAuth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic Auth Protection (when enabled)
app.use(basicAuthMiddleware);

app.use('/dashboard', dashboardRoutes);

// CORS Configuration - CRITICAL for production domains
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000', 
  'https://quankey.xyz',           // ← CRITICAL: Frontend domain
  'https://www.quankey.xyz',       // ← CRITICAL: WWW domain  
  'https://api.quankey.xyz',       // ← CRITICAL: API domain
  'https://quankey-mvp.onrender.com'
];

console.log('🌐 [CORS] Configured for origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('🌐 [CORS] Request from origin:', origin || 'no-origin');
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ [CORS] Origin allowed:', origin);
      return callback(null, true);
    }
    
    console.log('❌ [CORS] Origin blocked:', origin);
    return callback(new Error('CORS policy violation'), false);
  },
  credentials: true,               // ← IMPORTANT for auth
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json());

// Intelligent Security hardening middleware - Applied BEFORE routes
app.use(trackFailedAttempt); // Track failed authentication attempts
app.use(intelligentSecurityMiddleware); // AI-powered intelligent threat detection with zero false positives

// Logging middleware para debug + audit logging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

// Audit logging for all requests
app.use(auditMiddleware(AuditEventType.SYSTEM_ERROR, 'API Request', RiskLevel.LOW));

// Routes with intelligent security hardening - ORDEN IMPORTANTE
app.use('/api/auth', 
  createIntelligentRateLimiter('authentication'), 
  auditMiddleware(AuditEventType.USER_LOGIN, 'Authentication Request', RiskLevel.MEDIUM),
  authRouter
);

// SECURITY RECOVERY: Real WebAuthn routes
app.use('/api/auth-real', 
  createIntelligentRateLimiter('authentication'), 
  auditMiddleware(AuditEventType.USER_LOGIN, 'Real WebAuthn Authentication', RiskLevel.HIGH),
  authRealRouter
);

app.use('/api/quantum', 
  createIntelligentRateLimiter('passwordGeneration'),
  auditMiddleware(AuditEventType.QUANTUM_GENERATION, 'Quantum Password Generation', RiskLevel.LOW),
  quantumRouter
);

// 🚀 PATENT-CRITICAL: World's first quantum vault API
app.use('/api/vault', 
  createIntelligentRateLimiter('vaultAccess'),
  auditMiddleware(AuditEventType.VAULT_ACCESSED, 'Quantum Vault Access', RiskLevel.HIGH),
  vaultRouter
);

app.use('/api/passwords', 
  createIntelligentRateLimiter('vaultAccess'),
  authMiddleware, 
  auditMiddleware(AuditEventType.VAULT_ACCESSED, 'Password Vault Access', RiskLevel.MEDIUM),
  passwordRoutes
);

app.use('/api/dashboard', 
  createIntelligentRateLimiter('api'),
  authMiddleware, 
  auditMiddleware(AuditEventType.VAULT_ACCESSED, 'Dashboard Access', RiskLevel.LOW),
  dashboardRoutes
);

app.use('/api/recovery', 
  createIntelligentRateLimiter('api'),
  auditMiddleware(AuditEventType.RECOVERY_INITIATED, 'Recovery Request', RiskLevel.HIGH),
  recoveryRoutes
);

// 🚀 PATENT-CRITICAL: Quantum Audit Routes - World's First ML-DSA-65 Audit System
app.use('/api/audit', 
  createIntelligentRateLimiter('api'),
  auditMiddleware(AuditEventType.VAULT_ACCESSED, 'Quantum Audit Access', RiskLevel.LOW),
  auditRouter
);

// Health check with security status
app.get('/api/health', async (req, res) => {
  const dbHealth = await HybridDatabaseService.healthCheck();
  
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
      rateLimiting: 'intelligent-adaptive',
      threatDetection: 'ai-powered-intelligent',
      auditLogging: 'comprehensive',
      falsePositivePrevention: 'quantum-enhanced'
    },
    timestamp: new Date().toISOString()
  });
});

// Security monitoring endpoints
app.get('/api/security/metrics', securityMetrics);
app.get('/api/security/intelligent-metrics', intelligentSecurityMetrics);
app.get('/api/security/audit', auditMetricsEndpoint);

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
  const dbInitialized = await HybridDatabaseService.initialize();
  if (!dbInitialized) {
    console.error('❌ Failed to initialize database service');
    process.exit(1);
  }

  const dbInfo = HybridDatabaseService.getDatabaseInfo();
  console.log(`[DB] Database service initialized: ${dbInfo.type} (${dbInfo.persistent ? 'persistent' : 'temporary'})`);
  console.log(`[DB] Features: ${dbInfo.features.join(', ')}`);
  
  app.listen(PORT, () => {
    console.log(`[SERVER] Quankey Backend running on port ${PORT}`);
    
    // Production URL for health check
    const healthUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.quankey.xyz/api/health'
      : `http://localhost:${PORT}/api/health`;
    console.log(`[HEALTH] Check: ${healthUrl}`);
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
  await HybridDatabaseService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[SHUTDOWN] Shutting down gracefully...');
  await HybridDatabaseService.disconnect();
  process.exit(0);
});

startServer().catch(console.error);