// backend/src/routes/passwords.ts - VERSIÓN FUNCIONANDO
import express from 'express';

const router = express.Router();

import { PasswordController } from '../controllers/passwordController';
// PATENT-CRITICAL: Import/Export functionality for enterprise adoption
// const { importPasswords, exportPasswords } = require('../../controllers/importExportController');

// Wrapper functions para métodos estáticos
router.post('/generate', (req, res) => PasswordController.generatePassword(req, res));
router.post('/save', (req, res) => PasswordController.savePassword(req, res));
router.get('/', (req, res) => PasswordController.getPasswords(req, res));
router.get('/stats/security', (req, res) => PasswordController.getSecurityStats(req, res));
router.get('/:id', (req, res) => PasswordController.getPassword(req, res));
router.put('/:id', (req, res) => PasswordController.updatePassword(req, res));
router.delete('/:id', (req, res) => PasswordController.deletePassword(req, res));

// PATENT-CRITICAL: Import/Export routes with full audit trail
// These endpoints demonstrate our zero-knowledge architecture even during data migration
// router.post('/import', importPasswords);
// router.get('/export', exportPasswords);

export default router;