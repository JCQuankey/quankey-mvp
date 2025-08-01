"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/passwords.ts - VERSIÓN FUNCIONANDO
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const passwordController_1 = require("../controllers/passwordController");
// PATENT-CRITICAL: Import/Export functionality for enterprise adoption
// const { importPasswords, exportPasswords } = require('../../controllers/importExportController');
// Wrapper functions para métodos estáticos
router.post('/generate', (req, res) => passwordController_1.PasswordController.generatePassword(req, res));
router.post('/save', (req, res) => passwordController_1.PasswordController.savePassword(req, res));
router.get('/', (req, res) => passwordController_1.PasswordController.getPasswords(req, res));
router.get('/stats/security', (req, res) => passwordController_1.PasswordController.getSecurityStats(req, res));
router.get('/:id', (req, res) => passwordController_1.PasswordController.getPassword(req, res));
router.put('/:id', (req, res) => passwordController_1.PasswordController.updatePassword(req, res));
router.delete('/:id', (req, res) => passwordController_1.PasswordController.deletePassword(req, res));
// PATENT-CRITICAL: Import/Export routes with full audit trail
// These endpoints demonstrate our zero-knowledge architecture even during data migration
// router.post('/import', importPasswords);
// router.get('/export', exportPasswords);
exports.default = router;
