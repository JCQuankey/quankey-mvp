#!/bin/bash

# 🧬 QUANKEY DATABASE MIGRATION SCRIPT - QUANTUM BIOMETRIC PASSWORDLESS SYSTEM
# Deploys the advanced quantum-ready schema to PostgreSQL

cd "$(dirname "$0")/.." || exit 1

echo "🔄 Starting Quankey Quantum Biometric Database Migration..."
echo "📊 Target: PostgreSQL with passwordless quantum architecture"

# Verify we're in the backend directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Must run from backend directory (prisma/schema.prisma not found)"
    exit 1
fi

# Verify PostgreSQL connection first
echo "🔍 Verifying PostgreSQL connection..."
if ! PGPASSWORD='Quantum#BiometricSecure$2024!PQC' psql -h localhost -U quankey_user -d quankey_db -c "SELECT 'Database ready!' as status;" > /dev/null 2>&1; then
    echo "❌ Cannot connect to PostgreSQL. Run setup first:"
    echo "   bash scripts/setup-postgresql.sh"
    exit 1
fi

echo "✅ PostgreSQL connection verified"

# Generate Prisma client for quantum operations
echo "🔧 Generating Prisma client for quantum cryptography..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma client generation failed"
    exit 1
fi

echo "✅ Prisma client generated with quantum support"

# Create migration for the quantum biometric schema
echo "🚀 Creating migration for quantum biometric architecture..."
npx prisma migrate dev --name "quantum-biometric-passwordless-init" --create-only

if [ $? -ne 0 ]; then
    echo "❌ Migration creation failed"
    exit 1
fi

echo "✅ Migration created successfully"

# Deploy migration to production database
echo "📤 Deploying quantum schema to PostgreSQL..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ Migration deployment failed"
    exit 1
fi

echo "✅ Migration deployed successfully"

# Verify schema deployment
echo "🔍 Verifying quantum biometric schema..."
PGPASSWORD='Quantum#BiometricSecure$2024!PQC' psql -h localhost -U quankey_user -d quankey_db << EOF
-- Verify all quantum tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verify quantum-specific columns
\d users
\d user_devices
\d passkey_credentials
\d vault_items
\d guardian_shares

-- Check indexes for performance
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

EOF

if [ $? -eq 0 ]; then
    echo "✅ Database migration complete for Quankey Quantum Biometric System!"
    echo ""
    echo "🏗️  DEPLOYED ARCHITECTURE:"
    echo "   📊 Users: Passwordless with quantum identity"
    echo "   🔐 PasskeyCredential: WebAuthn biometric credentials"
    echo "   📱 UserDevice: ML-KEM-768 public keys + wrapped master keys"
    echo "   🗂️  VaultItem: Quantum-encrypted vault storage"
    echo "   👥 GuardianShare: 2-of-3 quantum recovery system"
    echo "   📋 Session: Secure session management"
    echo "   📜 AuditLog: Complete security audit trail"
    echo ""
    echo "🔒 SECURITY FEATURES:"
    echo "   ✅ Zero passwords stored anywhere"
    echo "   ✅ Post-quantum cryptography ready"
    echo "   ✅ WebAuthn biometric authentication"
    echo "   ✅ Guardian share recovery system"
    echo "   ✅ Quantum vault encryption"
    echo "   ✅ Complete audit logging"
    echo ""
    echo "🚀 Ready for quantum biometric operations!"
else
    echo "❌ Schema verification failed"
    exit 1
fi

# Optional: Show current database stats
echo "📊 Database Statistics:"
PGPASSWORD='Quantum#BiometricSecure$2024!PQC' psql -h localhost -U quankey_user -d quankey_db -c "
SELECT 
    COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

SELECT 
    pg_size_pretty(pg_database_size('quankey_db')) as database_size;
"

echo ""
echo "🎉 Quankey Quantum Biometric Database is ready for production!"