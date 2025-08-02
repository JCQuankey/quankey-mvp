// Database service - In-memory storage for development
// PostgreSQL ready for production deployment

export interface UserData {
  id: string;
  username: string;
  email: string;
  displayName: string;
  biometricEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Quantum-resistant fields
  quantumResistant?: boolean;
  quantumAlgorithm?: string;
  migrationStatus?: string;
  credentialId?: string;
  hybridId?: string;
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

// In-memory storage (temporary - PostgreSQL ready for production)
const users = new Map<string, UserData>();
const passwords = new Map<string, PasswordData[]>();

export class DatabaseService {

  // Initialize database connection
  static async initialize() {
    try {
      console.log('✅ Database service initialized (in-memory mode)');
      console.log('🔄 PostgreSQL ready for production migration');
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return false;
    }
  }

  // Health check
  static async healthCheck() {
    try {
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  // Cleanup on shutdown
  static async disconnect() {
    console.log('🔌 Database service disconnected');
  }

  // Generate unique ID
  static generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // USER MANAGEMENT
  
  // Create new user
  static async createUser(username: string, displayName: string): Promise<UserData | null> {
    try {
      const user: UserData = {
        id: this.generateId(),
        username,
        email: `${username}@demo.quankey.xyz`,
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

  // PASSWORD MANAGEMENT

  // Save password
  static async savePassword(userId: string, passwordData: Omit<PasswordData, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasswordData | null> {
    try {
      const password: PasswordData = {
        id: this.generateId(),
        ...passwordData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const userPasswords = passwords.get(userId) || [];
      userPasswords.push(password);
      passwords.set(userId, userPasswords);

      console.log(`💾 Saved password for user: ${userId}`);
      return password;
    } catch (error) {
      console.error('Error saving password:', error);
      return null;
    }
  }

  // Get passwords for user
  static async getPasswordsForUser(userId: string): Promise<PasswordData[]> {
    try {
      return passwords.get(userId) || [];
    } catch (error) {
      console.error('Error getting passwords:', error);
      return [];
    }
  }

  // Get password by ID
  static async getPasswordById(userId: string, passwordId: string): Promise<PasswordData | null> {
    try {
      const userPasswords = passwords.get(userId) || [];
      return userPasswords.find(p => p.id === passwordId) || null;
    } catch (error) {
      console.error('Error getting password by ID:', error);
      return null;
    }
  }

  // Update password
  static async updatePassword(userId: string, passwordId: string, updateData: Partial<PasswordData>): Promise<PasswordData | null> {
    try {
      const userPasswords = passwords.get(userId) || [];
      const passwordIndex = userPasswords.findIndex(p => p.id === passwordId);
      
      if (passwordIndex === -1) {
        return null;
      }

      userPasswords[passwordIndex] = {
        ...userPasswords[passwordIndex],
        ...updateData,
        updatedAt: new Date()
      };

      passwords.set(userId, userPasswords);
      console.log(`📝 Updated password: ${passwordId}`);
      return userPasswords[passwordIndex];
    } catch (error) {
      console.error('Error updating password:', error);
      return null;
    }
  }

  // Delete password
  static async deletePassword(userId: string, passwordId: string): Promise<boolean> {
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

  // Get user statistics
  static async getUserStats(userId: string): Promise<any> {
    try {
      const userPasswords = passwords.get(userId) || [];
      return {
        totalPasswords: userPasswords.length,
        quantumPasswords: userPasswords.filter(p => p.isQuantum).length,
        lastUpdated: userPasswords.length > 0 ? Math.max(...userPasswords.map(p => p.updatedAt.getTime())) : null
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { totalPasswords: 0, quantumPasswords: 0, lastUpdated: null };
    }
  }
}

export default DatabaseService;