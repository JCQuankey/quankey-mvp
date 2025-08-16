#!/bin/bash

echo "🧬 Setting up PostgreSQL for Quankey Quantum Biometric System..."
echo "⚠️  IMPORTANT: This is a PASSWORDLESS system - no password fields will be created"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not installed. Installing..."
    
    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install postgresql
        brew services start postgresql
    else
        echo "❌ Unsupported OS. Please install PostgreSQL manually."
        exit 1
    fi
fi

# Start PostgreSQL service (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo "🔐 Setting up quantum-secure database credentials..."

# Setup database with simpler password for compatibility
sudo -u postgres psql << EOF
-- Terminate existing connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'quankey_db' AND pid <> pg_backend_pid();

-- Drop existing database and user
DROP DATABASE IF EXISTS quankey_db;
DROP USER IF EXISTS quankey_user;

-- Create user with simpler password (no special chars that cause issues)
CREATE USER quankey_user WITH PASSWORD 'QuantumBiometric2024PQC';

-- Create database
CREATE DATABASE quankey_db OWNER quankey_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE quankey_db TO quankey_user;

-- Verify setup
\l
\du

EOF

echo "✅ PostgreSQL setup complete!"

# Test connection
PGPASSWORD='QuantumBiometric2024PQC' psql -U quankey_user -d quankey_db -h localhost -c "SELECT 'PostgreSQL connection successful!' as status;" || echo "⚠️ Connection test failed - may need to configure pg_hba.conf"