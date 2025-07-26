import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { quantumRouter } from './routes/quantum';
import { authRouter } from './routes/auth';
import { DatabaseService } from './services/databaseService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/quantum', quantumRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', async (req, res) => {
  const dbHealth = await DatabaseService.healthCheck();
  
  res.json({ 
    status: 'OK', 
    message: 'Quankey Backend is running!',
    database: dbHealth ? 'Connected' : 'Disconnected',
    features: ['quantum-generation', 'webauthn-biometric', 'postgresql-persistence'],
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
async function startServer() {
  const dbConnected = await DatabaseService.initialize();
  
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Quankey Backend running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 WebAuthn biometric auth ready`);
    console.log(`⚛️ Quantum password generation ready`);
    console.log(`🗄️ PostgreSQL database connected`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await DatabaseService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await DatabaseService.disconnect();
  process.exit(0);
});

startServer().catch(console.error);