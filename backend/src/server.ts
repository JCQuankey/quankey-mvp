// backend/src/server.ts

import express from 'express';
import dotenv from 'dotenv';
import quantumRouter from './routes/quantum';
import { authRouter } from './routes/auth';
// SECURITY RECOVERY: Real WebAuthn routes
import { authRealRouter } from './routes/authReal';
import { DatabaseService } from './services/databaseService';
import passwordRoutes from './routes/passwords';
const dashboardRoutes = require('./routes/dashboard');
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
  auditMiddleware, 
  auditMetricsEndpoint, 
  AuditEventType, 
  RiskLevel 
} from './middleware/auditLogging';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - ANTES de todo middleware
app.use((req, res, next) => {
  console.log('[CORS] Applied for:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
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
app.use(express.json());

// Security hardening middleware - Applied BEFORE routes
app.use(trackFailedAttempt); // Track failed authentication attempts
app.use(threatDetection); // AI-powered threat detection

// Logging middleware para debug + audit logging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

// Audit logging for all requests
app.use(auditMiddleware(AuditEventType.SYSTEM_ERROR, 'API Request', RiskLevel.LOW));

// Routes with security hardening - ORDEN IMPORTANTE
app.use('/api/auth', 
  createRateLimiter('authentication'), 
  auditMiddleware(AuditEventType.USER_LOGIN, 'Authentication Request', RiskLevel.MEDIUM),
  authRouter
);

// SECURITY RECOVERY: Real WebAuthn routes
app.use('/api/auth-real', 
  createRateLimiter('authentication'), 
  auditMiddleware(AuditEventType.USER_LOGIN, 'Real WebAuthn Authentication', RiskLevel.HIGH),
  authRealRouter
);

app.use('/api/quantum', 
  createRateLimiter('passwordGeneration'),
  auditMiddleware(AuditEventType.QUANTUM_GENERATION, 'Quantum Password Generation', RiskLevel.LOW),
  quantumRouter
);

app.use('/api/passwords', 
  createRateLimiter('vaultAccess'),
  authMiddleware, 
  auditMiddleware(AuditEventType.VAULT_ACCESSED, 'Password Vault Access', RiskLevel.MEDIUM),
  passwordRoutes
);

app.use('/api/dashboard', 
  createRateLimiter('api'),
  authMiddleware, 
  auditMiddleware(AuditEventType.VAULT_ACCESSED, 'Dashboard Access', RiskLevel.LOW),
  dashboardRoutes
);

app.use('/api/recovery', 
  createRateLimiter('api'),
  auditMiddleware(AuditEventType.RECOVERY_INITIATED, 'Recovery Request', RiskLevel.HIGH),
  recoveryRoutes
);

// Health check with security status
app.get('/api/health', async (req, res) => {
  const dbHealth = await DatabaseService.healthCheck();
  
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
app.get('/api/security/metrics', securityMetrics);
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
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[SHUTDOWN] Shutting down gracefully...');
  await DatabaseService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[SHUTDOWN] Shutting down gracefully...');
  await DatabaseService.disconnect();
  process.exit(0);
});

startServer().catch(console.error);