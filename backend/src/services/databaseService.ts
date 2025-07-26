// Simplified database service to avoid TypeScript issues
// This uses in-memory storage for now, will be upgraded to real DB later

export interface UserData {
  id: string;
  username: string;
  displayName: string;
  biometricEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordData {
  id: string;
  title: string;
  website: string;
  username: string;
  password: string;
  notes?: string;
  isQuantum: boolean;
  entropy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage (temporary)
const users = new Map<string, UserData>();
const passwords = new Map<string, PasswordData[]>();

export class DatabaseService {

  // Initialize database connection
  static async initialize() {
    try {
      console.log('✅ Database service initialized (in-memory mode)');
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return false;
    }
  }

  // Cleanup on shutdown
  static async disconnect() {
    console.log('🔌 Database service disconnected');
  }

  // USER MANAGEMENT
  
  // Create new user
  static async createUser(username: string, displayName: string): Promise<UserData | null> {
    try {
      const user: UserData = {
        id: this.generateId(),
        username,
        displayName,
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      users.set(username, user);
      passwords.set(user.id, []);

      console.log(`👤 Created user: ${username}`);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  // Get user by username
  static async getUserByUsername(username: string): Promise<UserData | null> {
    try {
      return users.get(username) || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<UserData | null> {
    try {
      for (const user of users.values()) {
        if (user.id === id) {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Enable biometric for user
  static async enableBiometric(userId: string): Promise<boolean> {
    try {
      for (const [username, user] of users.entries()) {
        if (user.id === userId) {
          user.biometricEnabled = true;
          user.updatedAt = new Date();
          users.set(username, user);
          console.log(`🔐 Enabled biometric for user: ${userId}`);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }

  // Get all users
  static async getAllUsers(): Promise<UserData[]> {
    try {
      return Array.from(users.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // PASSWORD VAULT MANAGEMENT

  // Add password to vault
  static async addPassword(
    userId: string,
    data: {
      title: string;
      website: string;
      username: string;
      password: string;
      notes?: string;
      isQuantum: boolean;
      entropy?: string;
    }
  ): Promise<PasswordData | null> {
    try {
      const passwordEntry: PasswordData = {
        id: this.generateId(),
        title: data.title,
        website: data.website,
        username: data.username,
        password: data.password,
        notes: data.notes,
        isQuantum: data.isQuantum,
        entropy: data.entropy,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const userPasswords = passwords.get(userId) || [];
      userPasswords.push(passwordEntry);
      passwords.set(userId, userPasswords);

      console.log(`🔑 Added password: ${data.title} for user: ${userId}`);
      return passwordEntry;
    } catch (error) {
      console.error('Error adding password:', error);
      return null;
    }
  }

  // Get all passwords for user
  static async getUserPasswords(userId: string): Promise<PasswordData[]> {
    try {
      const userPasswords = passwords.get(userId) || [];
      return userPasswords.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error getting user passwords:', error);
      return [];
    }
  }

  // Update password
  static async updatePassword(
    passwordId: string,
    userId: string,
    updates: Partial<{
      title: string;
      website: string;
      username: string;
      password: string;
      notes: string;
    }>
  ): Promise<boolean> {
    try {
      const userPasswords = passwords.get(userId) || [];
      const passwordIndex = userPasswords.findIndex(p => p.id === passwordId);
      
      if (passwordIndex === -1) {
        return false;
      }

      userPasswords[passwordIndex] = {
        ...userPasswords[passwordIndex],
        ...updates,
        updatedAt: new Date()
      };

      passwords.set(userId, userPasswords);
      console.log(`📝 Updated password: ${passwordId}`);
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }

  // Delete password
  static async deletePassword(passwordId: string, userId: string): Promise<boolean> {
    try {
      const userPasswords = passwords.get(userId) || [];
      const filteredPasswords = userPasswords.filter(p => p.id !== passwordId);
      
      if (filteredPasswords.length === userPasswords.length) {
        return false; // Password not found
      }

      passwords.set(userId, filteredPasswords);
      console.log(`🗑️ Deleted password: ${passwordId}`);
      return true;
    } catch (error) {
      console.error('Error deleting password:', error);
      return false;
    }
  }

  // Search passwords
  static async searchPasswords(userId: string, query: string): Promise<PasswordData[]> {
    try {
      const userPasswords = passwords.get(userId) || [];
      const lowercaseQuery = query.toLowerCase();
      
      return userPasswords.filter(password =>
        password.title.toLowerCase().includes(lowercaseQuery) ||
        password.website.toLowerCase().includes(lowercaseQuery) ||
        password.username.toLowerCase().includes(lowercaseQuery) ||
        (password.notes && password.notes.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('Error searching passwords:', error);
      return [];
    }
  }

  // Get vault statistics
  static async getVaultStats(userId: string) {
    try {
      const userPasswords = passwords.get(userId) || [];
      const quantumPasswords = userPasswords.filter(p => p.isQuantum).length;

      return {
        totalEntries: userPasswords.length,
        quantumPasswords,
        classicPasswords: userPasswords.length - quantumPasswords,
        lastSync: new Date(),
        encryptionVersion: '1.0'
      };
    } catch (error) {
      console.error('Error getting vault stats:', error);
      return {
        totalEntries: 0,
        quantumPasswords: 0,
        classicPasswords: 0,
        lastSync: new Date(),
        encryptionVersion: '1.0'
      };
    }
  }

  // UTILITY METHODS
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Database health check
  static async healthCheck(): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}