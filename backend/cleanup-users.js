#!/usr/bin/env node
/**
 * 🗑️ QUANKEY DATABASE CLEANUP SCRIPT
 * Safely removes all test users and associated data
 * ⚠️ WARNING: This will delete ALL users and passwords
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

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
  const prisma = new PrismaClient();
  
  try {
    log('🔍 Connecting to database...', 'blue');
    
    // Check current data counts
    const userCount = await prisma.users.count();
    const passwordCount = await prisma.passwords.count();
    const sessionCount = await prisma.user_sessions.count();
    
    log('\n📊 Current Database Status:', 'magenta');
    log(`   Users: ${userCount}`, 'yellow');
    log(`   Passwords: ${passwordCount}`, 'yellow');
    log(`   Sessions: ${sessionCount}`, 'yellow');
    
    if (userCount === 0) {
      log('\n✅ Database is already clean - no users to remove', 'green');
      return;
    }
    
    // Show sample users
    log('\n👥 Sample users that will be deleted:', 'magenta');
    const sampleUsers = await prisma.users.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
        _count: {
          select: { passwords: true }
        }
      }
    });
    
    sampleUsers.forEach(user => {
      log(`   📧 ${user.email || 'No email'} (${user._count.passwords} passwords)`, 'yellow');
    });
    
    if (userCount > 10) {
      log(`   ... and ${userCount - 10} more users`, 'yellow');
    }
    
    // Confirmation prompt
    log('\n⚠️ WARNING: This will DELETE ALL users and their data!', 'red');
    log('This action cannot be undone.', 'red');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('\nAre you sure you want to proceed? (type "yes" to confirm): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      log('\n❌ Cleanup cancelled by user', 'red');
      return;
    }
    
    log('\n🗑️ Starting database cleanup...', 'blue');
    
    // Step 1: Delete passwords (foreign key dependency)
    log('   Deleting passwords...', 'yellow');
    const deletedPasswords = await prisma.passwords.deleteMany({});
    log(`   ✅ Deleted ${deletedPasswords.count} passwords`, 'green');
    
    // Step 2: Delete user sessions
    log('   Deleting user sessions...', 'yellow');
    const deletedSessions = await prisma.user_sessions.deleteMany({});
    log(`   ✅ Deleted ${deletedSessions.count} sessions`, 'green');
    
    // Step 3: Delete users
    log('   Deleting users...', 'yellow');
    const deletedUsers = await prisma.users.deleteMany({});
    log(`   ✅ Deleted ${deletedUsers.count} users`, 'green');
    
    // Verify cleanup
    const finalUserCount = await prisma.users.count();
    const finalPasswordCount = await prisma.passwords.count();
    const finalSessionCount = await prisma.user_sessions.count();
    
    log('\n📊 Final Database Status:', 'magenta');
    log(`   Users: ${finalUserCount}`, finalUserCount === 0 ? 'green' : 'red');
    log(`   Passwords: ${finalPasswordCount}`, finalPasswordCount === 0 ? 'green' : 'red');
    log(`   Sessions: ${finalSessionCount}`, finalSessionCount === 0 ? 'green' : 'red');
    
    if (finalUserCount === 0 && finalPasswordCount === 0 && finalSessionCount === 0) {
      log('\n🎉 Database cleanup completed successfully!', 'green');
      log('The database is now clean and ready for fresh users.', 'green');
    } else {
      log('\n❌ Cleanup may not have completed successfully', 'red');
      log('Please check the database manually.', 'red');
    }
    
  } catch (error) {
    log('\n❌ Error during cleanup:', 'red');
    log(error.message, 'red');
    
    if (error.code === 'P2002') {
      log('\nThis might be due to foreign key constraints.', 'yellow');
      log('Try running the cleanup again.', 'yellow');
    }
    
    if (error.code === 'ECONNREFUSED') {
      log('\nDatabase connection failed.', 'yellow');
      log('Make sure PostgreSQL is running and DATABASE_URL is correct.', 'yellow');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n❌ Cleanup interrupted by user', 'red');
  process.exit(0);
});

// Run the cleanup
main()
  .catch(console.error);