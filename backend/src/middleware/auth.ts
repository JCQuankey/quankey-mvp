// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    webauthnId?: string;
  };
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header or wrong format');
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.substring(7);
    console.log('🔍 Auth middleware - Token found:', token.substring(0, 20) + '...');
    
    // 🚨 CRITICAL FIX: Properly verify and decode JWT
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'quankey_jwt_secret_quantum_2024_production';
      
      // VERIFY the token with the secret (not just decode)
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('📝 JWT verified and decoded:', {
        userId: decoded.userId,
        username: decoded.username,
        authMethod: decoded.authMethod,
        exp: new Date(decoded.exp * 1000)
      });
      
      // 🔴 CRITICAL: Extract REAL userId from JWT payload
      const userId = decoded.userId;
      const username = decoded.username;
      
      if (!userId) {
        console.error('❌ JWT payload missing userId');
        return res.status(401).json({ error: 'Invalid token payload' });
      }
      
      // 🚨 CRITICAL: Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        console.error('❌ User not found in database:', userId);
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Set authenticated user with REAL database ID
      req.user = {
        id: userId,  // <-- REAL user ID from database
        username: username || user.username,
        webauthnId: user.webauthnId || `webauthn_${userId}`
      };
      
      console.log('✅ User authenticated correctly:', {
        id: req.user.id,
        username: req.user.username,
        exists_in_db: !!user
      });
      
      next();
      
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError);
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      return res.status(401).json({ error: 'Token verification failed' });
    }
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  } finally {
    await prisma.$disconnect();
  }
};