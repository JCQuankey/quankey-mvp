#!/usr/bin/env node
/**
 * 🔐 SECURE ADMIN CLEANUP CLIENT
 * Calls the secure admin endpoint to clean test users
 */

const axios = require('axios');
const readline = require('readline');
require('dotenv').config();

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function main() {
  try {
    // Configuration
    const API_URL = process.env.API_URL || 'http://localhost:5000';
    const ADMIN_TOKEN = process.env.ADMIN_CLEANUP_TOKEN;
    const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;
    const ADMIN_PASSWORD = process.env.ADMIN_MASTER_PASSWORD;
    
    if (!ADMIN_TOKEN || !ADMIN_SECRET) {
      log('❌ Missing admin credentials in environment', 'red');
      log('Required: ADMIN_CLEANUP_TOKEN, ADMIN_SECRET_KEY', 'yellow');
      process.exit(1);
    }
    
    log('🔐 Quankey Secure Admin Cleanup', 'magenta');
    log('================================', 'magenta');
    
    // First, check database status
    log('\n📊 Checking database status...', 'blue');
    
    try {
      const statusResponse = await axios.get(`${API_URL}/api/admin/database-status`, {
        headers: {
          'x-admin-token': ADMIN_TOKEN,
          'x-admin-secret': ADMIN_SECRET
        }
      });
      
      const status = statusResponse.data;
      log(`\nCurrent database state:`, 'yellow');
      log(`  Users: ${status.counts.users}`, 'yellow');
      log(`  Passwords: ${status.counts.passwords}`, 'yellow');
      log(`  Sessions: ${status.counts.sessions}`, 'yellow');
      
      if (status.counts.users === 0) {
        log('\n✅ Database is already clean!', 'green');
        return;
      }
      
      if (status.sampleUsers && status.sampleUsers.length > 0) {
        log('\nSample users:', 'yellow');
        status.sampleUsers.forEach(u => {
          log(`  - ${u.email} (${u.passwordCount} passwords)`, 'yellow');
        });
      }
      
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        log('❌ Admin authentication failed', 'red');
        log('Check your admin credentials', 'yellow');
        process.exit(1);
      }
      throw error;
    }
    
    // Confirmation
    log('\n⚠️  WARNING: This will DELETE ALL users!', 'red');
    log('This action cannot be undone.', 'red');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('\nType "DELETE" to confirm: ', resolve);
    });
    
    rl.close();
    
    if (answer !== 'DELETE') {
      log('\n❌ Cleanup cancelled', 'red');
      return;
    }
    
    // Perform cleanup
    log('\n🗑️ Initiating secure cleanup...', 'blue');
    
    const cleanupResponse = await axios.post(`${API_URL}/api/admin/cleanup-test-users`, {
      confirmation: 'DELETE_ALL_TEST_USERS',
      adminPassword: ADMIN_PASSWORD || 'quantum-secure-2024'
    }, {
      headers: {
        'x-admin-token': ADMIN_TOKEN,
        'x-admin-secret': ADMIN_SECRET,
        'Content-Type': 'application/json'
      }
    });
    
    const result = cleanupResponse.data;
    
    if (result.success) {
      log('\n✅ Cleanup completed successfully!', 'green');
      log(`\nDeleted:`, 'green');
      log(`  Users: ${result.deleted.deletedUsers}`, 'green');
      log(`  Passwords: ${result.deleted.deletedPasswords}`, 'green');
      log(`  Sessions: ${result.deleted.deletedSessions}`, 'green');
      
      log(`\nFinal state:`, 'blue');
      log(`  Users: ${result.after.users}`, 'blue');
      log(`  Passwords: ${result.after.passwords}`, 'blue');
    } else {
      log('\n❌ Cleanup failed', 'red');
      log(result.error || 'Unknown error', 'red');
    }
    
  } catch (error) {
    log('\n❌ Error:', 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Message: ${error.response.data.error || error.response.data}`, 'red');
    } else if (error.code === 'ECONNREFUSED') {
      log('Cannot connect to backend server', 'red');
      log('Make sure the backend is running on port 5000', 'yellow');
    } else {
      log(error.message, 'red');
    }
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\n\n❌ Interrupted by user', 'red');
  process.exit(0);
});

// Run
main().catch(console.error);