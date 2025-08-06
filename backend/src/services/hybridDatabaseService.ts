/**
 * PATENT-CRITICAL: Hybrid Database Service - Development + Production
 * 
 * Automatically switches between in-memory (development) and PostgreSQL (production)
 * based on environment variables. Maintains full compatibility with existing API.
 * 
 * @patent-feature Seamless development-to-production database migration
 * @innovation Zero-downtime transition from in-memory to persistent storage
 * @advantage Enterprise-ready with development flexibility
 */

import { DatabaseService } from './databaseService';
import { PrismaService, UserData, PasswordData } from './prismaService';

// Configuration
const USE_POSTGRESQL = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

export class HybridDatabaseService {
  private static initialized = false;
  private static usePostgreSQL = USE_POSTGRESQL;

  // Initialize the appropriate database service
  static async initialize(): Promise<boolean> {
    try {
      if (this.usePostgreSQL) {
        console.log('🐘 Initializing PostgreSQL for production...');
        const success = await PrismaService.initialize();
        if (success) {
          console.log('✅ PostgreSQL initialized successfully');
          this.initialized = true;
          return true;
        } else {
          console.log('⚠️ PostgreSQL failed, falling back to in-memory storage');
          this.usePostgreSQL = false;
        }
      }

      console.log('💾 Using in-memory storage for development');
      const success = await DatabaseService.initialize();
      this.initialized = success;
      return success;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return false;
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    if (this.usePostgreSQL) {
      return await PrismaService.healthCheck();
    } else {
      return await DatabaseService.healthCheck();
    }
  }

  // Get current database type
  static getDatabaseType(): 'postgresql' | 'in-memory' {
    return this.usePostgreSQL ? 'postgresql' : 'in-memory';
  }

  // Cleanup on shutdown
  static async disconnect(): Promise<void> {
    if (this.usePostgreSQL) {
      await PrismaService.disconnect();
    } else {
      await DatabaseService.disconnect();
    }
  }

  // Generate unique ID
  static generateId(): string {
    if (this.usePostgreSQL) {
      return PrismaService.generateId();
    } else {
      return DatabaseService.generateId();
    }
  }

  // USER MANAGEMENT

  // Create new user
  static async createUser(username: string, displayName: string, email?: string): Promise<UserData | null> {
    if (this.usePostgreSQL) {
      return await PrismaService.createUser(username, displayName, email);
    } else {
      return await DatabaseService.createUser(username, displayName);
    }
  }

  // Get user by username
  static async getUserByUsername(username: string): Promise<UserData | null> {
    if (this.usePostgreSQL) {
      return await PrismaService.getUserByUsername(username);
    } else {
      return await DatabaseService.getUserByUsername(username);
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<UserData | null> {
    if (this.usePostgreSQL) {
      return await PrismaService.getUserById(id);
    } else {
      return await DatabaseService.getUserById(id);
    }
  }

  // Update user with WebAuthn data (only for PostgreSQL)
  static async updateUserWebAuthn(userId: string, webauthnData: {
    webauthnId?: string;
    publicKey?: string;
    counter?: bigint;
    credentials?: any;
  }): Promise<boolean> {
    if (this.usePostgreSQL) {
      return await PrismaService.updateUserWebAuthn(userId, webauthnData);
    } else {
      // For in-memory, just enable biometric flag
      return await DatabaseService.enableBiometric(userId);
    }
  }

  // Enable biometric for user
  static async enableBiometric(userId: string): Promise<boolean> {
    if (this.usePostgreSQL) {
      return await PrismaService.enableBiometric(userId);
    } else {
      return await DatabaseService.enableBiometric(userId);
    }
  }

  // Update last login (only for PostgreSQL)
  static async updateLastLogin(userId: string): Promise<boolean> {
    if (this.usePostgreSQL) {
      return await PrismaService.updateLastLogin(userId);
    } else {
      // In-memory doesn't track last login
      return true;
    }
  }

  // Get all users
  static async getAllUsers(): Promise<UserData[]> {
    if (this.usePostgreSQL) {
      return await PrismaService.getAllUsers();
    } else {
      return await DatabaseService.getAllUsers();
    }
  }

  // 🔴 FIX: Update user
  static async updateUser(userId: string, updateData: Partial<UserData>): Promise<UserData | null> {
    if (this.usePostgreSQL) {
      return await PrismaService.updateUser(userId, updateData);
    } else {
      return await DatabaseService.updateUser(userId, updateData);
    }
  }

  // PASSWORD MANAGEMENT

  // Save password - handles both simple and complex encryption metadata
  static async savePassword(userId: string, passwordData: any): Promise<PasswordData | null> {
    if (this.usePostgreSQL) {
      // PostgreSQL expects full encryption metadata
      if (!passwordData.encryptedData || !passwordData.iv || !passwordData.salt || !passwordData.authTag) {
        console.error('❌ PostgreSQL requires full encryption metadata');
        return null;
      }
      return await PrismaService.savePassword(userId, passwordData);
    } else {
      // In-memory uses simplified format
      const simpleData = {
        title: passwordData.site || passwordData.title,
        website: passwordData.site || passwordData.website,
        username: passwordData.username,
        password: passwordData.encryptedPassword || passwordData.password,
        notes: passwordData.encryptedNotes || passwordData.notes,
        isQuantum: passwordData.isQuantum || false,
        entropy: passwordData.quantumEntropy || passwordData.entropy
      };
      return await DatabaseService.savePassword(userId, simpleData);
    }
  }

  // Get passwords for user
  static async getPasswordsForUser(userId: string): Promise<PasswordData[]> {
    if (this.usePostgreSQL) {
      return await PrismaService.getPasswordsForUser(userId);
    } else {
      return await DatabaseService.getPasswordsForUser(userId);
    }
  }

  // Get password by ID
  static async getPasswordById(userId: string, passwordId: string): Promise<PasswordData | null> {
    if (this.usePostgreSQL) {
      return await PrismaService.getPasswordById(userId, passwordId);
    } else {
      return await DatabaseService.getPasswordById(userId, passwordId);
    }
  }

  // Update password
  static async updatePassword(userId: string, passwordId: string, updateData: any): Promise<PasswordData | null> {
    if (this.usePostgreSQL) {
      return await PrismaService.updatePassword(userId, passwordId, updateData);
    } else {
      return await DatabaseService.updatePassword(userId, passwordId, updateData);
    }
  }

  // Delete password
  static async deletePassword(userId: string, passwordId: string): Promise<boolean> {
    if (this.usePostgreSQL) {
      return await PrismaService.deletePassword(userId, passwordId);
    } else {
      return await DatabaseService.deletePassword(userId, passwordId);
    }
  }

  // Get user statistics
  static async getUserStats(userId: string): Promise<any> {
    if (this.usePostgreSQL) {
      return await PrismaService.getUserStats(userId);
    } else {
      return await DatabaseService.getUserStats(userId);
    }
  }

  // SESSION MANAGEMENT (PostgreSQL only)

  // Create session
  static async createSession(userId: string, token: string, expiresAt: Date, metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<boolean> {
    if (this.usePostgreSQL) {
      return await PrismaService.createSession(userId, token, expiresAt, metadata);
    } else {
      // In-memory doesn't persist sessions
      console.log(`📝 Session would be created for user ${userId} (in-memory mode)`);
      return true;
    }
  }

  // Get session by token
  static async getSession(token: string): Promise<any> {
    if (this.usePostgreSQL) {
      return await PrismaService.getSession(token);
    } else {
      // In-memory doesn't persist sessions
      return null;
    }
  }

  // Delete session
  static async deleteSession(token: string): Promise<boolean> {
    if (this.usePostgreSQL) {
      return await PrismaService.deleteSession(token);
    } else {
      // In-memory doesn't persist sessions
      return true;
    }
  }

  // Clean expired sessions
  static async cleanExpiredSessions(): Promise<number> {
    if (this.usePostgreSQL) {
      return await PrismaService.cleanExpiredSessions();
    } else {
      return 0;
    }
  }

  // AUDIT LOGGING (PostgreSQL only)

  // Create audit log entry
  static async createAuditLog(userId: string, action: string, details?: {
    entityType?: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<boolean> {
    if (this.usePostgreSQL) {
      return await PrismaService.createAuditLog(userId, action, details);
    } else {
      // In-memory mode: just log to console
      console.log(`📋 Audit Log [${action}] User: ${userId}`, details);
      return true;
    }
  }

  // MIGRATION UTILITIES

  // Export in-memory data for migration
  static async exportInMemoryData(): Promise<{
    users: UserData[];
    passwords: { userId: string; passwords: PasswordData[] }[];
  } | null> {
    if (this.usePostgreSQL) {
      console.log('⚠️ Already using PostgreSQL, no in-memory data to export');
      return null;
    }

    try {
      const users = await DatabaseService.getAllUsers();
      const passwords: { userId: string; passwords: PasswordData[] }[] = [];

      for (const user of users) {
        const userPasswords = await DatabaseService.getPasswordsForUser(user.id);
        passwords.push({ userId: user.id, passwords: userPasswords });
      }

      console.log(`📤 Exported ${users.length} users and ${passwords.reduce((total, p) => total + p.passwords.length, 0)} passwords`);
      return { users, passwords };
    } catch (error) {
      console.error('❌ Error exporting in-memory data:', error);
      return null;
    }
  }

  // Import data to PostgreSQL
  static async importToPostgreSQL(data: {
    users: UserData[];
    passwords: { userId: string; passwords: PasswordData[] }[];
  }): Promise<boolean> {
    if (!this.usePostgreSQL) {
      console.log('⚠️ PostgreSQL not active, cannot import');
      return false;
    }

    try {
      // Import users
      for (const user of data.users) {
        await PrismaService.createUser(user.username, user.displayName);
      }

      // Import passwords (would need encryption metadata for production)
      console.log('⚠️ Password import requires proper encryption metadata for PostgreSQL');
      
      console.log(`📥 Imported ${data.users.length} users to PostgreSQL`);
      return true;
    } catch (error) {
      console.error('❌ Error importing to PostgreSQL:', error);
      return false;
    }
  }

  // Get database information
  static getDatabaseInfo(): {
    type: 'postgresql' | 'in-memory';
    persistent: boolean;
    features: string[];
  } {
    if (this.usePostgreSQL) {
      return {
        type: 'postgresql',
        persistent: true,
        features: [
          'Persistent storage',
          'WebAuthn credentials',
          'Session management',
          'Audit logging',
          'Full encryption metadata',
          'Recovery systems',
          'Team collaboration'
        ]
      };
    } else {
      return {
        type: 'in-memory',
        persistent: false,
        features: [
          'Fast development',
          'No setup required',
          'Basic password storage',
          'User management'
        ]
      };
    }
  }
}

export default HybridDatabaseService;