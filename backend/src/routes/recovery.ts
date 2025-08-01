// backend/src/routes/recovery.ts

import express from 'express';
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { RecoveryController } = require('../patents/quantum-recovery/quantumRecoveryController');

/**
 * PATENT-CRITICAL: Quantum Recovery Routes
 * These endpoints implement the world's first quantum-based
 * password manager recovery system without master passwords
 */

// Protected routes (require authentication)
router.post('/generate-kit', authMiddleware, RecoveryController.generateQuantumRecoveryKit);
router.get('/share/:shareId/download', authMiddleware, RecoveryController.downloadQuantumShare);
// router.post('/social-recovery/initiate', authMiddleware, RecoveryController.initiateSocialRecovery);
router.get('/status', authMiddleware, RecoveryController.getQuantumRecoveryStatus);
// router.delete('/kit/:kitId', authMiddleware, RecoveryController.revokeRecoveryKit);

// Public routes (no authentication - for recovery)
router.post('/recover', RecoveryController.recoverWithQuantumShares);

export default router;