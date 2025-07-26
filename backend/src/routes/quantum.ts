import express from 'express';
import { generateQuantumPassword } from '../services/quantumService';

export const quantumRouter = express.Router();

// Generate quantum password
quantumRouter.post('/generate-password', async (req, res) => {
  try {
    const { length = 16, includeSymbols = true } = req.body;
    
    console.log(`🔬 Generating quantum password with length: ${length}`);
    
    const password = await generateQuantumPassword(length, includeSymbols);
    
    res.json({
      success: true,
      password,
      length: password.length,
      timestamp: new Date().toISOString(),
      quantum: true,
      entropy: Math.log2(Math.pow(94, password.length)).toFixed(2) + ' bits'
    });
    
  } catch (error) {
    console.error('❌ Error generating quantum password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quantum password',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test quantum connection
quantumRouter.get('/test-connection', async (req, res) => {
  try {
    // Test basic quantum randomness
    const testNumbers = await generateQuantumPassword(8, false);
    
    res.json({
      success: true,
      message: 'Quantum connection working!',
      sample: testNumbers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Quantum connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});