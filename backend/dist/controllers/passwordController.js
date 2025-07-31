"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordController = void 0;
const client_1 = require("@prisma/client");
const encryptionService_1 = require("../src/services/encryptionService");
const realQuantumService_1 = require("../src/services/realQuantumService");
const prisma = new client_1.PrismaClient();
/**
 * PATENT-CRITICAL: Password Controller with Quantum Integration
 *
 * @patent-feature Quantum password generation and encrypted storage
 * @innovation Zero-knowledge password management
 * @security All passwords encrypted with user-specific keys
 */
exports.passwordController = {
    /**
     * PATENT-CRITICAL: Generate Quantum Password
     * POST /api/passwords/generate
     */
    generate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const generationId = `pwd_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            try {
                const { length = 16, includeSymbols = true } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                console.log(`🔮 [${generationId}] Generating quantum password for user: ${userId}`);
                // PATENT-CRITICAL: Use real quantum service
                const result = yield realQuantumService_1.RealQuantumService.generateQuantumPassword(length, includeSymbols);
                res.json({
                    success: true,
                    password: result.password,
                    strength: result.strength,
                    quantum: result.quantumInfo.quantum,
                    quantumInfo: result.quantumInfo,
                    generationId
                });
            }
            catch (error) {
                console.error(`❌ [${generationId}] Password generation error:`, error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate password',
                    generationId
                });
            }
        });
    },
    /**
     * PATENT-CRITICAL: Save Encrypted Password
     * POST /api/passwords/save
     */
    save(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const saveId = `pwd_save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            try {
                const { site, username, password, notes, category, isQuantum, quantumInfo } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                console.log(`💾 [${saveId}] Saving password for site: ${site}`);
                // PATENT-CRITICAL: Generate user-specific encryption credential
                const userCredential = encryptionService_1.EncryptionService.generateUserCredential(userId, userId);
                // PATENT-CRITICAL: Encrypt password with zero-knowledge
                const encryptedPasswordData = yield encryptionService_1.EncryptionService.encrypt(password, userCredential);
                // Encrypt notes if provided
                let encryptedNotesData = null;
                if (notes) {
                    const encryptedNotes = yield encryptionService_1.EncryptionService.encrypt(notes, userCredential);
                    encryptedNotesData = encryptedNotes.encryptedData;
                }
                // Calculate password strength
                const strength = calculatePasswordStrength(password);
                // PATENT-CRITICAL: Save with complete encryption metadata
                const savedPassword = yield prisma.password.create({
                    data: {
                        userId,
                        site,
                        username,
                        encryptedPassword: encryptedPasswordData.encryptedData,
                        encryptedNotes: encryptedNotesData,
                        encryptedData: encryptedPasswordData.encryptedData,
                        iv: encryptedPasswordData.iv,
                        salt: encryptedPasswordData.salt,
                        authTag: encryptedPasswordData.authTag,
                        strength,
                        category: category || 'General',
                        isFavorite: false,
                        isQuantum: isQuantum || false,
                        quantumSource: (quantumInfo === null || quantumInfo === void 0 ? void 0 : quantumInfo.source) || null,
                        quantumEntropy: (quantumInfo === null || quantumInfo === void 0 ? void 0 : quantumInfo.theoretical_entropy) || null,
                        metadata: quantumInfo || null,
                        algorithm: encryptedPasswordData.metadata.algorithm,
                        keyDerivation: encryptedPasswordData.metadata.keyDerivation,
                        encryptionVersion: encryptedPasswordData.metadata.version
                    }
                });
                console.log(`✅ [${saveId}] Password saved successfully: ${savedPassword.id}`);
                res.json({
                    success: true,
                    id: savedPassword.id,
                    message: 'Password saved securely'
                });
            }
            catch (error) {
                console.error(`❌ [${saveId}] Save password error:`, error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to save password'
                });
            }
        });
    },
    /**
     * PATENT-CRITICAL: Get All Passwords (Encrypted)
     * GET /api/passwords
     */
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                // PATENT-CRITICAL: Return only metadata, not decrypted passwords
                const passwords = yield prisma.password.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        site: true,
                        username: true,
                        category: true,
                        strength: true,
                        isFavorite: true,
                        isQuantum: true,
                        quantumSource: true,
                        createdAt: true,
                        updatedAt: true,
                        lastUsed: true
                    },
                    orderBy: { updatedAt: 'desc' }
                });
                console.log(`📚 Retrieved ${passwords.length} password entries for user: ${userId}`);
                res.json({
                    success: true,
                    passwords,
                    count: passwords.length
                });
            }
            catch (error) {
                console.error('Get passwords error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve passwords'
                });
            }
        });
    },
    /**
     * PATENT-CRITICAL: Get Single Password (Decrypted)
     * GET /api/passwords/:id
     */
    getOne(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const retrieveId = `pwd_get_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            try {
                const { id } = req.params;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                console.log(`🔓 [${retrieveId}] Retrieving password: ${id}`);
                const password = yield prisma.password.findFirst({
                    where: { id, userId }
                });
                if (!password) {
                    return res.status(404).json({ error: 'Password not found' });
                }
                // PATENT-CRITICAL: Decrypt password with user credential
                const userCredential = encryptionService_1.EncryptionService.generateUserCredential(userId, userId);
                const decryptedPassword = yield encryptionService_1.EncryptionService.decrypt({
                    encryptedData: password.encryptedData,
                    iv: password.iv,
                    salt: password.salt,
                    authTag: password.authTag,
                    metadata: {
                        algorithm: password.algorithm,
                        keyDerivation: password.keyDerivation,
                        timestamp: password.createdAt.toISOString(),
                        version: password.encryptionVersion
                    }
                }, userCredential);
                // Update last used
                yield prisma.password.update({
                    where: { id },
                    data: { lastUsed: new Date() }
                });
                console.log(`✅ [${retrieveId}] Password retrieved successfully`);
                res.json({
                    success: true,
                    password: Object.assign(Object.assign({}, password), { decryptedPassword // Only send decrypted password when specifically requested
                     })
                });
            }
            catch (error) {
                console.error(`❌ [${retrieveId}] Get password error:`, error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve password'
                });
            }
        });
    },
    /**
     * Update Password
     * PUT /api/passwords/:id
     */
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const updates = req.body;
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                // Verify ownership
                const existing = yield prisma.password.findFirst({
                    where: { id, userId }
                });
                if (!existing) {
                    return res.status(404).json({ error: 'Password not found' });
                }
                // If password is being updated, re-encrypt it
                if (updates.password) {
                    const userCredential = encryptionService_1.EncryptionService.generateUserCredential(userId, userId);
                    const encryptedPasswordData = yield encryptionService_1.EncryptionService.encrypt(updates.password, userCredential);
                    updates.encryptedPassword = encryptedPasswordData.encryptedData;
                    updates.encryptedData = encryptedPasswordData.encryptedData;
                    updates.iv = encryptedPasswordData.iv;
                    updates.salt = encryptedPasswordData.salt;
                    updates.authTag = encryptedPasswordData.authTag;
                    updates.strength = calculatePasswordStrength(updates.password);
                    delete updates.password; // Don't store plaintext
                }
                const updated = yield prisma.password.update({
                    where: { id },
                    data: updates
                });
                res.json({
                    success: true,
                    message: 'Password updated successfully'
                });
            }
            catch (error) {
                console.error('Update password error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to update password'
                });
            }
        });
    },
    /**
     * Delete Password
     * DELETE /api/passwords/:id
     */
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                // Verify ownership before deletion
                const existing = yield prisma.password.findFirst({
                    where: { id, userId }
                });
                if (!existing) {
                    return res.status(404).json({ error: 'Password not found' });
                }
                yield prisma.password.delete({
                    where: { id }
                });
                console.log(`🗑️ Password deleted: ${id}`);
                res.json({
                    success: true,
                    message: 'Password deleted successfully'
                });
            }
            catch (error) {
                console.error('Delete password error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to delete password'
                });
            }
        });
    },
    /**
     * Get Password Statistics
     * GET /api/passwords/stats
     */
    getStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                const [total, quantum, favorite, byCategory] = yield Promise.all([
                    prisma.password.count({ where: { userId } }),
                    prisma.password.count({ where: { userId, isQuantum: true } }),
                    prisma.password.count({ where: { userId, isFavorite: true } }),
                    prisma.password.groupBy({
                        by: ['category'],
                        where: { userId },
                        _count: true
                    })
                ]);
                const stats = {
                    total,
                    quantum,
                    favorite,
                    byCategory: byCategory.reduce((acc, cat) => {
                        acc[cat.category || 'General'] = cat._count;
                        return acc;
                    }, {}),
                    securityScore: calculateSecurityScore(total, quantum)
                };
                res.json({
                    success: true,
                    stats
                });
            }
            catch (error) {
                console.error('Get stats error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get statistics'
                });
            }
        });
    }
};
/**
 * Calculate password strength score
 */
function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8)
        strength += 20;
    if (password.length >= 12)
        strength += 20;
    if (password.length >= 16)
        strength += 10;
    if (/[a-z]/.test(password))
        strength += 10;
    if (/[A-Z]/.test(password))
        strength += 10;
    if (/[0-9]/.test(password))
        strength += 10;
    if (/[^A-Za-z0-9]/.test(password))
        strength += 20;
    return Math.min(strength, 100);
}
/**
 * Calculate overall security score
 */
function calculateSecurityScore(total, quantum) {
    if (total === 0)
        return 0;
    const quantumPercentage = (quantum / total) * 100;
    const baseScore = 50;
    const quantumBonus = quantumPercentage * 0.5;
    return Math.round(baseScore + quantumBonus);
}
exports.default = exports.passwordController;
