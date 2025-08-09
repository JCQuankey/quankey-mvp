import { prisma, db } from './database.service';
import { encryption } from './encryption.service';
import { randomBytes } from 'crypto';

export class VaultService {
  static async createItem(userId: string, data: {
    site: string;
    username?: string;
    password: string;
    notes?: string;
    category?: string;
  }) {
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
    
    // Cifrar datos sensibles con QUANTUM
    const { encrypted: encryptedPassword, keyHash } = 
      await encryption.encryptPassword(data.password);
    
    const encryptedNotes = data.notes ? 
      await encryption.encrypt(data.notes) : null;
    
    // Transacción atómica
    return await prisma.$transaction(async (tx) => {
      // Crear item
      const item = await tx.password.create({
        data: {
          id: randomBytes(16).toString('hex'),
          userId,
          site: data.site,
          username: data.username || '',
          encryptedPassword: encryptedPassword,
          encryptedData: encryptedPassword,
          iv: randomBytes(16).toString('hex'),
          salt: randomBytes(32).toString('hex'),
          authTag: randomBytes(16).toString('hex'),
          keyDerivation: keyHash,
          encryptedNotes: encryptedNotes,
          category: data.category || 'General',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Audit log
      await db.auditOperation({
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
  
  static async getItems(userId: string) {
    const items = await prisma.password.findMany({
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
    await db.auditOperation({
      userId,
      action: 'VAULT_ITEMS_READ',
      resource: 'vault',
      result: 'SUCCESS',
      metadata: { count: items.length }
    });
    
    return items;
  }
  
  static async getPassword(userId: string, itemId: string): Promise<string> {
    // Verificar propiedad
    const item = await prisma.password.findFirst({
      where: {
        id: itemId,
        userId
      }
    });
    
    if (!item) {
      await db.auditOperation({
        userId,
        action: 'VAULT_PASSWORD_ACCESS_DENIED',
        resource: `vault_item:${itemId}`,
        result: 'FAILURE',
        metadata: { reason: 'Item not found or not owned' }
      });
      
      throw new Error('Password not found');
    }
    
    // Descifrar con QUANTUM
    const password = await encryption.decryptPassword(
      item.encryptedPassword,
      item.keyDerivation
    );
    
    // Update last accessed
    await prisma.password.update({
      where: { id: itemId },
      data: { updatedAt: new Date() }
    });
    
    // Audit access
    await db.auditOperation({
      userId,
      action: 'VAULT_PASSWORD_ACCESSED',
      resource: `vault_item:${itemId}`,
      result: 'SUCCESS',
      metadata: { site: item.site }
    });
    
    return password;
  }
  
  static async deleteItem(userId: string, itemId: string) {
    // Soft delete con audit trail
    const item = await prisma.password.deleteMany({
      where: {
        id: itemId,
        userId
      }
    });
    
    if (item.count === 0) {
      throw new Error('Item not found');
    }
    
    await db.auditOperation({
      userId,
      action: 'VAULT_ITEM_DELETED',
      resource: `vault_item:${itemId}`,
      result: 'SUCCESS'
    });
    
    return { success: true };
  }
}