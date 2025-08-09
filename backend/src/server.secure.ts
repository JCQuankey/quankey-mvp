import './types/express';
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
import { db, prisma } from './services/database.service';
import quantumRoutes from './routes/quantum.routes';

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
  
  // Security headers - ESTRICTOS
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Para React
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  
  // CORS restrictivo
  app.use(cors({
    origin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'https://quankey.xyz',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(express.json({ limit: '1mb' })); // Límite estricto
  
  // Health check SIN autenticación
  app.get('/health', async (req, res) => {
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
  app.post('/api/vault/items', AuthMiddleware.validateRequest, async (req, res) => {
    try {
      const { VaultService } = await import('./services/vault.service');
      const item = await VaultService.createItem(req.user!.id, {
        site: req.body.site || req.body.title, // Support legacy API
        username: req.body.username,
        password: req.body.password,
        notes: req.body.notes,
        category: req.body.category
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
  app.get('/api/vault/items/:id/password', AuthMiddleware.validateRequest, async (req, res) => {
    try {
      const { VaultService } = await import('./services/vault.service');
      const password = await VaultService.getPassword(req.user!.id, req.params.id);
      res.json({ success: true, password });
    } catch (error) {
      res.status(404).json({ 
        success: false, 
        error: 'Password not found'
      });
    }
  });

  // Delete vault item
  app.delete('/api/vault/items/:id', AuthMiddleware.validateRequest, async (req, res) => {
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

export { app };