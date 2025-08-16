#!/bin/bash

echo "🔧 Fixing PostgreSQL authentication..."

# Backup current pg_hba.conf
sudo cp /etc/postgresql/*/main/pg_hba.conf /etc/postgresql/*/main/pg_hba.conf.backup

# Update pg_hba.conf to use md5 authentication
sudo bash -c "cat > /tmp/pg_hba_fix.conf << 'EOF'
# Database administrative login by Unix domain socket
local   all             postgres                                peer

# TYPE  DATABASE        USER            ADDRESS                 METHOD
# Local connections
local   all             all                                     md5
# IPv4 local connections
host    all             all             127.0.0.1/32            md5
# IPv6 local connections
host    all             all             ::1/128                 md5

# Allow replication connections from localhost
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5
EOF"

# Find PostgreSQL version and update config
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+' | head -1)
sudo cp /tmp/pg_hba_fix.conf /etc/postgresql/$PG_VERSION/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

echo "✅ PostgreSQL authentication fixed!"
echo "🔍 Testing connection..."

# Test connection
PGPASSWORD='QuantumBiometric2024PQC' psql -U quankey_user -d quankey_db -h localhost -c "SELECT 'Connection successful!' as status;"