// backend/src/routes/recovery.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { RecoveryController } = require('../controllers/recoveryController');

/**
 * PATENT-CRITICAL: Quantum Recovery Routes
 * These endpoints implement the world's first quantum-based
 * password manager recovery system without master passwords
 */

// Protected routes (require authentication)
router.post('/generate-kit', authMiddleware, RecoveryController.generateRecoveryKit);
router.get('/share/:shareId/download', authMiddleware, RecoveryController.downloadShare);
router.post('/social-recovery/initiate', authMiddleware, RecoveryController.initiateSocialRecovery);
router.get('/status', authMiddleware, RecoveryController.getRecoveryStatus);
router.delete('/kit/:kitId', authMiddleware, RecoveryController.revokeRecoveryKit);

// Public routes (no authentication - for recovery)
router.post('/recover', RecoveryController.recoverWithShares);

module.exports = router;