import express from 'express';
import { WebAuthnService } from '../services/webauthnService';

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
    
    const options = await WebAuthnService.generateRegistrationOptions(username, displayName);
    
    res.json({
      success: true,
      options
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

// Complete registration
authRouter.post('/register/complete', async (req, res) => {
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
      res.json({
        success: true,
        message: 'Biometric authentication registered successfully',
        user: verification.user
      });
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

// Start authentication
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

// Complete authentication
authRouter.post('/authenticate/complete', async (req, res) => {
  try {
    const { username, response } = req.body;
    
    console.log(`🔍 Completing biometric authentication for: ${username || 'credential-based'}`);
    
    const verification = await WebAuthnService.verifyAuthentication(response, username);
    
    if (verification.verified) {
      res.json({
        success: true,
        message: 'Authentication successful',
        user: verification.user
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

// Check if user exists
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

// Get user info (for debugging)
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