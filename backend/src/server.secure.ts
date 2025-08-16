/// <reference path="./types/express.d.ts" />
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { randomBytes } from 'crypto';
import { AuthMiddleware } from './middleware/auth.middleware';
import { 
  authLimiter, 
  apiLimiter, 
  vaultLimiter 
} from './middleware/rateLimiter';
import { inputValidation } from './middleware/inputValidation.middleware';
import { db, prisma } from './services/database.service';
import quantumRoutes from './routes/quantum.routes';
import authRoutes from './routes/auth.routes';
import quantumBiometricRoutes from './routes/quantum.biometric.routes';
import identityQuantumRoutes from './routes/identity.quantum.routes';

const app = express();
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
  await AuthMiddleware.initialize();
  
  // Security headers - MILITARY-GRADE STRICT CSP
  app.use(helmet({
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
    'http://localhost:3001'  // Puerto alternativo
  ];
  
  // Añadir FRONTEND_URL y CORS_ORIGIN si están configurados
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }
  if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
  }
  
  app.use(cors({
    origin: function(origin, callback) {
      // Permitir requests sin origin (Postman, curl, etc) solo en desarrollo
      if (!origin && process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      if (origin && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(express.json({ limit: '1mb' })); // Límite estricto
  app.use(inputValidation.sanitizeRequest); // Global input sanitization
  
  // Health check SIN autenticación - with rate limiting
  app.get('/health', apiLimiter, async (req, res) => {
    try {
      const dbHealth = await db.healthCheck();
      res.status(200).json({ 
        status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '2.5.0-secure'
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'unhealthy',
        error: 'Database connection failed'
      });
    }
  });

  // 🧬 MASTER PLAN v6.0: QUANTUM BIOMETRIC IDENTITY (PRIMARY)
  app.use('/api/identity', identityQuantumRoutes);
  
  // Authentication routes - REAL WebAuthn implementation (legacy support)
  app.use('/api/auth', authRoutes);
  
  // QUANTUM BIOMETRIC ROUTES (legacy - being replaced by identity routes)
  app.use('/api/auth', quantumBiometricRoutes);
  
  // Basic vault operations (simplified for security focus)
  app.use('/api/vault', AuthMiddleware.validateRequest, vaultLimiter);
  
  // Get vault items
  app.get('/api/vault/items', AuthMiddleware.validateRequest, async (req, res) => {
    try {
      const { VaultService } = await import('./services/vault.service');
      const items = await VaultService.getItems(req.user!.id);
      res.json({ success: true, items });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get vault items' 
      });
    }
  });

  // Create vault item
  app.post('/api/vault/items', AuthMiddleware.validateRequest, inputValidation.validateVaultItem(), async (req, res) => {
    try {
      const { VaultService } = await import('./services/vault.service');
      const item = await VaultService.createItem(req.user!.id, {
        itemType: req.body.itemType || 'credential',
        title: req.body.title || req.body.site,
        itemData: {
          site: req.body.site,
          username: req.body.username,
          encryptedPassword: req.body.password, // Will be encrypted by service
          notes: req.body.notes,
          category: req.body.category
        }
      });
      res.json({ success: true, item });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create item'
      });
    }
  });

  // Get password (separate endpoint for security)
  app.get('/api/vault/items/:id/password', AuthMiddleware.validateRequest, inputValidation.validateId(), async (req, res) => {
    try {
      const { VaultService } = await import('./services/vault.service');
      const vaultItem = await VaultService.getItemDecrypted(req.user!.id, req.params.id);
      const password = vaultItem?.data?.encryptedPassword;
      res.json({ success: true, password });
    } catch (error) {
      res.status(404).json({ 
        success: false, 
        error: 'Password not found'
      });
    }
  });

  // Delete vault item
  app.delete('/api/vault/items/:id', AuthMiddleware.validateRequest, inputValidation.validateId(), async (req, res) => {
    try {
      const { VaultService } = await import('./services/vault.service');
      await VaultService.deleteItem(req.user!.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(404).json({ 
        success: false, 
        error: 'Item not found'
      });
    }
  });
  
  // Quantum API routes - PUBLIC (no auth required for status endpoints)
  app.use('/api/quantum', apiLimiter, quantumRoutes);
  
  // Apply rate limiting to all other API routes
  app.use('/api', AuthMiddleware.validateRequest, apiLimiter);
  
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
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);
    
    // NUNCA exponer detalles del error
    res.status(500).json({ 
      error: 'Internal server error',
      id: randomBytes(8).toString('hex') // Para tracking
    });
  });
  
  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend server running on 0.0.0.0:${PORT}`);
    console.log(`🌐 Accessible from: http://54.72.3.39:${PORT}`);
    console.log('🔒 Security features: ACTIVE');
    console.log('📊 Audit logging: ENABLED');
    console.log('🚫 Rate limiting: ENFORCED');
    console.log(`🚀 Local access: http://localhost:${PORT}`);
    console.log(`🌍 Public access: http://54.72.3.39:${PORT}`);
  });
}

// Start con manejo de errores
initialize().catch((error) => {
  console.error('❌ FATAL: Server initialization failed:', error);
  process.exit(1);
});

export { app };