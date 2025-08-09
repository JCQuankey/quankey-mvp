"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultService = void 0;
const database_service_1 = require("./database.service");
const encryption_service_1 = require("./encryption.service");
const crypto_1 = require("crypto");
class VaultService {
    static async createItem(userId, data) {
        // Validación estricta
        if (!data.site || !data.password) {
            throw new Error('Site and password are required');
        }
        if (data.site.length > 100) {
            throw new Error('Site name too long');
        }
        if (data.password.length > 500) {
            throw new Error('Password too long');
        }
        // Cifrar datos sensibles
        const { encrypted: encryptedPassword, keyHash } = encryption_service_1.encryption.encryptPassword(data.password);
        const encryptedNotes = data.notes ?
            encryption_service_1.encryption.encrypt(data.notes) : null;
        // Transacción atómica
        return await database_service_1.prisma.$transaction(async (tx) => {
            // Crear item
            const item = await tx.password.create({
                data: {
                    id: (0, crypto_1.randomBytes)(16).toString('hex'),
                    userId,
                    site: data.site,
                    username: data.username || '',
                    encryptedPassword: encryptedPassword,
                    encryptedData: encryptedPassword,
                    iv: (0, crypto_1.randomBytes)(16).toString('hex'),
                    salt: (0, crypto_1.randomBytes)(32).toString('hex'),
                    authTag: (0, crypto_1.randomBytes)(16).toString('hex'),
                    keyDerivation: keyHash,
                    encryptedNotes: encryptedNotes,
                    category: data.category || 'General',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            // Audit log
            await database_service_1.db.auditOperation({
                userId,
                action: 'VAULT_ITEM_CREATED',
                resource: `vault_item:${item.id}`,
                result: 'SUCCESS',
                metadata: {
                    category: data.category,
                    hasNotes: !!data.notes
                }
            });
            return {
                id: item.id,
                site: item.site,
                username: item.username,
                category: item.category,
                createdAt: item.createdAt
                // NUNCA devolver password en respuesta
            };
        });
    }
    static async getItems(userId) {
        const items = await database_service_1.prisma.password.findMany({
            where: {
                userId
            },
            select: {
                id: true,
                site: true,
                username: true,
                category: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        // Audit read operation
        await database_service_1.db.auditOperation({
            userId,
            action: 'VAULT_ITEMS_READ',
            resource: 'vault',
            result: 'SUCCESS',
            metadata: { count: items.length }
        });
        return items;
    }
    static async getPassword(userId, itemId) {
        // Verificar propiedad
        const item = await database_service_1.prisma.password.findFirst({
            where: {
                id: itemId,
                userId
            }
        });
        if (!item) {
            await database_service_1.db.auditOperation({
                userId,
                action: 'VAULT_PASSWORD_ACCESS_DENIED',
                resource: `vault_item:${itemId}`,
                result: 'FAILURE',
                metadata: { reason: 'Item not found or not owned' }
            });
            throw new Error('Password not found');
        }
        // Descifrar
        const password = encryption_service_1.encryption.decryptPassword(item.encryptedPassword, item.keyDerivation);
        // Update last accessed
        await database_service_1.prisma.password.update({
            where: { id: itemId },
            data: { updatedAt: new Date() }
        });
        // Audit access
        await database_service_1.db.auditOperation({
            userId,
            action: 'VAULT_PASSWORD_ACCESSED',
            resource: `vault_item:${itemId}`,
            result: 'SUCCESS',
            metadata: { site: item.site }
        });
        return password;
    }
    static async deleteItem(userId, itemId) {
        // Soft delete con audit trail
        const item = await database_service_1.prisma.password.deleteMany({
            where: {
                id: itemId,
                userId
            }
        });
        if (item.count === 0) {
            throw new Error('Item not found');
        }
        await database_service_1.db.auditOperation({
            userId,
            action: 'VAULT_ITEM_DELETED',
            resource: `vault_item:${itemId}`,
            result: 'SUCCESS'
        });
        return { success: true };
    }
}
exports.VaultService = VaultService;
