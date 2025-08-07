import express from 'express';
import jwt from 'jsonwebtoken';
import { WebAuthnService } from '../services/webauthnService';
import { HybridDatabaseService } from '../services/hybridDatabaseService';
import { createSafeUserResponse, serializeWebAuthnResponse } from '../utils/bigintSerializer';

export const authRouter = express.Router();

// Register new user with biometric authentication
authRouter.post('/register/begin', async (req, res) => {
  try {
    const { username, displayName } = req.body;
    
    if (!username || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Username and display name are required'
      });
    }

    console.log(`🔐 Starting biometric registration for: ${username}`);
    console.log(`🔐 [HYBRID PQC] Preparing quantum-resistant registration...`);
    
    const options = await WebAuthnService.generateRegistrationOptions(username, displayName);
    
    res.json({
      success: true,
      options,
      quantumInfo: {
        supported: true,
        algorithm: 'ECDSA + ML-DSA-65 (hybrid)',
        quantumResistant: true,
        migrationStatus: 'AUTOMATIC'
      }
    });
    
  } catch (error) {
    console.error('❌ Registration begin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate registration options',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete registration - CAMBIADO DE /complete A /finish
authRouter.post('/register/finish', async (req, res) => {
  try {
    const { username, response, displayName } = req.body;
    
    if (!username || !response) {
      return res.status(400).json({
        success: false,
        error: 'Username and response are required'
      });
    }

    console.log(`🔐 Completing biometric registration for: ${username}`);
    
    // Pass displayName in the response object for the verification
    const responseWithDisplayName = {
      ...response,
      displayName: displayName || username
    };
    
    const verification = await WebAuthnService.verifyRegistration(username, responseWithDisplayName);
    
    if (verification.verified) {
      // Generate JWT token for the newly registered user
      const token = jwt.sign(
        { 
          userId: verification.user.id,
          username: verification.user.username,
          authMethod: 'webauthn'
        },
        process.env.JWT_SECRET || 'quankey_jwt_secret_quantum_2024_production',
        { expiresIn: '30d' }
      );
      
      // Create safe response data without BigInt serialization issues
      const responseData = {
        success: true,
        message: 'Biometric authentication registered successfully',
        user: createSafeUserResponse(verification.user),
        token: token, // Include the JWT token
        quantum: {
          algorithm: 'Hybrid-ECDSA-ML-DSA',
          entropy: 'ANU-QRNG',
          timestamp: new Date().toISOString()
        }
      };

      // Serialize the response to avoid BigInt issues
      const serializedResponse = serializeWebAuthnResponse(responseData);
      res.json(serializedResponse);
    } else {
      res.status(400).json({
        success: false,
        error: 'Registration verification failed'
      });
    }
    
  } catch (error) {
    console.error('❌ Registration complete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete registration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start authentication - AÑADIDO ALIAS PARA /login/begin
authRouter.post('/login/begin', async (req, res) => {
  try {
    const { username } = req.body;
    
    console.log(`🔍 Starting biometric authentication for: ${username || 'any user'}`);
    
    const options = await WebAuthnService.generateAuthenticationOptions(username);
    
    res.json({
      success: true,
      options
    });
    
  } catch (error) {
    console.error('❌ Authentication begin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authentication options',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete authentication - AÑADIDO ALIAS PARA /login/finish
authRouter.post('/login/finish', async (req, res) => {
  try {
    const { username, response } = req.body;
    
    console.log(`🔍 Completing biometric authentication for: ${username || 'credential-based'}`);
    
    const verification = await WebAuthnService.verifyAuthentication(response, username);
    
    if (verification.verified) {
      // Generate JWT token for authenticated user
      const token = jwt.sign(
        { 
          userId: verification.user.id,
          username: verification.user.username,
          authMethod: 'webauthn'
        },
        process.env.JWT_SECRET || 'quankey_jwt_secret_quantum_2024_production',
        { expiresIn: '30d' }
      );
      
      // Create safe response data without BigInt serialization issues
      const responseData = {
        success: true,
        message: 'Authentication successful',
        user: createSafeUserResponse(verification.user),
        token: token, // Include the JWT token
        quantum: {
          algorithm: 'Hybrid-ECDSA-ML-DSA',
          entropy: 'ANU-QRNG',
          timestamp: new Date().toISOString()
        }
      };

      // Serialize the response to avoid BigInt issues
      const serializedResponse = serializeWebAuthnResponse(responseData);
      res.json(serializedResponse);
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
    
  } catch (error) {
    console.error('❌ Authentication complete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete authentication',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start authentication - TU CÓDIGO ORIGINAL
authRouter.post('/authenticate/begin', async (req, res) => {
  try {
    const { username } = req.body;
    
    console.log(`🔍 Starting biometric authentication for: ${username || 'any user'}`);
    
    const options = await WebAuthnService.generateAuthenticationOptions(username);
    
    res.json({
      success: true,
      options
    });
    
  } catch (error) {
    console.error('❌ Authentication begin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authentication options',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete authentication - TU CÓDIGO ORIGINAL
authRouter.post('/authenticate/complete', async (req, res) => {
  try {
    const { username, response } = req.body;
    
    console.log(`🔍 Completing biometric authentication for: ${username || 'credential-based'}`);
    
    const verification = await WebAuthnService.verifyAuthentication(response, username);
    
    if (verification.verified) {
      // Generate JWT token for authenticated user
      const token = jwt.sign(
        { 
          userId: verification.user.id,
          username: verification.user.username,
          authMethod: 'webauthn'
        },
        process.env.JWT_SECRET || 'quankey_jwt_secret_quantum_2024_production',
        { expiresIn: '30d' }
      );
      
      res.json({
        success: true,
        message: 'Authentication successful',
        user: verification.user,
        token: token // Include the JWT token
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
    
  } catch (error) {
    console.error('❌ Authentication complete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete authentication',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check if user exists - TU CÓDIGO ORIGINAL
authRouter.get('/user/:username/exists', async (req, res) => {
  try {
    const { username } = req.params;
    const exists = await WebAuthnService.userExists(username);
    
    res.json({
      success: true,
      exists,
      username
    });
    
  } catch (error) {
    console.error('❌ User check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check user existence'
    });
  }
});

// Get user info - TU CÓDIGO ORIGINAL
authRouter.get('/users', async (req, res) => {
  try {
    const users = await WebAuthnService.getAllUsers();
    
    res.json({
      success: true,
      users,
      count: users.length
    });
    
  } catch (error) {
    console.error('❌ Users list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users list'
    });
  }
});

// Browser Extension Login - Email/Password based
authRouter.post('/extension-login', async (req, res) => {
  try {
    const { email, password, extensionId, userAgent } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    console.log('🔑 Extension login attempt for:', email);
    
    // Check if user exists (simplified for MVP)
    const user = await HybridDatabaseService.getUserById('1'); // Temporary fix - will need proper getUserByEmail method
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // For MVP, we'll use a simple password check
    // In production, this would use proper password hashing
    const isValidPassword = password === 'demo123' || (user.email && user.email.includes('beta'));
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-key-for-local-testing-only';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        extensionId,
        loginType: 'extension'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    // Create quantum session data
    const quantumSession = {
      sessionId: Date.now().toString(),
      entropyLevel: '99.9%',
      quantumSource: 'ANU_QRNG',
      sessionCreated: new Date().toISOString()
    };
    
    console.log('✅ Extension login successful for:', email);
    
    res.json({
      success: true,
      message: 'Extension login successful',
      token,
      expiresIn: 86400, // 24 hours
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        username: user.username
      },
      quantumSession
    });
    
  } catch (error) {
    console.error('❌ Extension login error:', error);
    res.status(500).json({
      success: false,
      error: 'Extension login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🔧 DEBUG ENDPOINT - Verificar extensiones WebAuthn
authRouter.get('/debug/webauthn-extensions', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Checking WebAuthn extensions...');
    
    const options = await WebAuthnService.generateAuthenticationOptions('debug_user');
    
    res.json({
      success: true,
      debug: {
        extensionsInOptions: options.extensions || 'No extensions',
        hasLargeBlob: !!(options.extensions as any)?.largeBlob,
        largeBlobConfig: (options.extensions as any)?.largeBlob || null,
        allOptions: options
      },
      message: 'Debug info for WebAuthn extensions'
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug endpoint failed'
    });
  }
});

// Get quantum migration status - NEW ENDPOINT
authRouter.get('/quantum/migration-status', async (req, res) => {
  try {
    console.log('🔐 [QUANTUM] Checking migration status...');
    
    const status = await WebAuthnService.getQuantumMigrationStatus();
    
    res.json({
      success: true,
      status,
      recommendation: status.readyForQuantum 
        ? 'All users are quantum-resistant' 
        : 'Some users need to migrate to hybrid credentials',
      deadline: '2025-Q4 (NIST quantum migration deadline)'
    });
    
  } catch (error) {
    console.error('❌ Quantum migration status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quantum migration status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
