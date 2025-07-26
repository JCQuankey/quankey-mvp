// index.js - EN LA RAÍZ del repositorio quankey-mvp/
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://quankey.xyz'],
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🔮 Quankey API está funcionando!',
    version: '1.0.0',
    quantum: 'ready',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    quantum: 'ready',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Quantum Password Generation (simplificado)
app.post('/api/quantum/password', (req, res) => {
  try {
    const { length = 16, includeSymbols = true, includeNumbers = true, includeUppercase = true, includeLowercase = true } = req.body;
    
    // Construir conjunto de caracteres
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // Generar contraseña con crypto (temporal)
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(length * 2);
    
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % charset.length;
      password += charset[randomIndex];
    }

    // Calcular fortaleza
    let score = 0;
    if (password.length >= 12) score += 25;
    if (/[a-z]/.test(password)) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    let level = 'weak';
    if (score >= 80) level = 'very-strong';
    else if (score >= 60) level = 'strong';
    else if (score >= 40) level = 'medium';

    res.json({
      success: true,
      password,
      strength: {
        score,
        level,
        feedback: [],
        quantumAdvantage: 'Post-quantum resistant'
      },
      quantumSource: 'crypto',
      generatedAt: new Date().toISOString(),
      message: 'Password generated successfully'
    });
  } catch (error) {
    console.error('Password generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate password'
    });
  }
});

app.get('/api/quantum/status', (req, res) => {
  res.json({
    success: true,
    quantum: {
      provider: 'IBM Quantum Network',
      configured: !!process.env.IBM_QUANTUM_TOKEN,
      fallback: true,
      status: 'ready'
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Quankey Server running on port ${PORT}`);
  console.log(`🔮 Quantum services ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});