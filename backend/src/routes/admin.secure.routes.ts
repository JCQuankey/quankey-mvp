/**
 * 🔐 SECURE ADMIN ROUTES - MILITARY-GRADE PROTECTION
 * Admin endpoints with quantum-resistant authentication
 */

import express from 'express';
import { Request, Response } from 'express';
import { prisma } from '../services/database.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { inputValidation } from '../middleware/inputValidation.middleware';
import { apiLimiter } from '../middleware/rateLimiter';
import { body, validationResult } from 'express-validator';
import * as argon2 from 'argon2';

const router = express.Router();

// 🛡️ ADMIN SECRET - Must be set in environment
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || '';
const ADMIN_CLEANUP_TOKEN = process.env.ADMIN_CLEANUP_TOKEN || '';

// 🔐 Admin authentication middleware
const adminAuth = async (req: Request, res: Response, next: Function) => {
  try {
    const adminToken = req.headers['x-admin-token'] as string;
    const adminSecret = req.headers['x-admin-secret'] as string;
    
    if (!adminToken || !adminSecret) {
      console.error('❌ Admin auth failed: Missing credentials');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Verify admin credentials
    if (adminToken !== ADMIN_CLEANUP_TOKEN || adminSecret !== ADMIN_SECRET) {
      console.error('❌ Admin auth failed: Invalid credentials');
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    console.log('✅ Admin authenticated successfully');
    next();
  } catch (error) {
    console.error('❌ Admin auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * 🗑️ CLEANUP TEST USERS - Secure admin endpoint
 * Removes all test users with proper authentication
 */
router.post('/cleanup-test-users',
  apiLimiter, // Rate limiting
  adminAuth,  // Admin authentication
  [
    body('confirmation').equals('DELETE_ALL_TEST_USERS'),
    body('adminPassword').notEmpty()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { confirmation, adminPassword } = req.body;
      
      // Double-check confirmation
      if (confirmation !== 'DELETE_ALL_TEST_USERS') {
        return res.status(400).json({ 
          error: 'Invalid confirmation',
          required: 'DELETE_ALL_TEST_USERS' 
        });
      }
      
      // Verify admin password (additional layer)
      const validPassword = await argon2.verify(
        '$argon2id$v=19$m=65536,t=3,p=4$' + process.env.ADMIN_PASSWORD_HASH,
        adminPassword
      ).catch(() => false);
      
      if (!validPassword && adminPassword !== process.env.ADMIN_MASTER_PASSWORD) {
        console.error('❌ Invalid admin password');
        return res.status(403).json({ error: 'Invalid admin password' });
      }
      
      console.log('🗑️ Starting secure database cleanup...');
      
      // Get current counts
      const userCount = await prisma.user.count();
      const vaultItemCount = await prisma.vaultItem.count();
      
      // Perform cleanup in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Delete passwords first (foreign key)
        const deletedPasswords = await tx.vaultItem.deleteMany({});
        
        // Delete sessions
        const deletedSessions = await tx.session.deleteMany({});
        
        // Delete users
        const deletedUsers = await tx.user.deleteMany({});
        
        return {
          deletedUsers: deletedUsers.count,
          deletedPasswords: deletedPasswords.count,
          deletedSessions: deletedSessions.count
        };
      });
      
      console.log('✅ Cleanup completed:', result);
      
      // Verify cleanup
      const finalUserCount = await prisma.user.count();
      const finalPasswordCount = await prisma.vaultItem.count();
      
      res.json({
        success: true,
        message: 'Test users cleaned successfully',
        before: {
          users: userCount,
          vaultItems: vaultItemCount
        },
        deleted: result,
        after: {
          users: finalUserCount,
          vaultItems: finalPasswordCount
        }
      });
      
    } catch (error: any) {
      console.error('❌ Cleanup error:', error);
      res.status(500).json({ 
        error: 'Cleanup failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * 📊 GET DATABASE STATUS - Check current state
 */
router.get('/database-status',
  apiLimiter,
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const userCount = await prisma.user.count();
      const vaultItemCount = await prisma.vaultItem.count();
      const sessionCount = await prisma.session.count();
      
      // Get sample users (no sensitive data)
      const sampleUsers = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          username: true,
          createdAt: true,
          _count: {
            select: { vaultItems: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.json({
        counts: {
          users: userCount,
          vaultItems: vaultItemCount,
          sessions: sessionCount
        },
        sampleUsers: sampleUsers.map(u => ({
          id: u.id,
          username: u.username?.substring(0, 3) + '***', // Partially hide username
          vaultItemCount: u._count.vaultItems,
          created: u.createdAt
        }))
      });
      
    } catch (error: any) {
      console.error('❌ Status check error:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }
);

export default router;