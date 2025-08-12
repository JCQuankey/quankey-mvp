#!/bin/bash
# QUANKEY AWS DEPLOYMENT SCRIPT v7.0
# Passkeys + PQC Architecture Complete Deployment

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🚀 QUANKEY DEPLOYMENT - PASSKEYS + PQC ARCHITECTURE       ║"
echo "║                    Version 7.0 - PRODUCTION                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    print_error "This script must be run as the ubuntu user"
    exit 1
fi

# 1. SYSTEM UPDATE
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl wget git

# 2. NODE.JS 20 LTS
print_status "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node_version=$(node -v)
print_status "Node.js installed: $node_version"

# 3. POSTGRESQL 15
print_status "Installing PostgreSQL 15..."
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15
sudo systemctl start postgresql
sudo systemctl enable postgresql
print_status "PostgreSQL 15 installed and running"

# 4. PM2 Process Manager
print_status "Installing PM2 globally..."
sudo npm install -g pm2
pm2_version=$(pm2 -v)
print_status "PM2 installed: v$pm2_version"

# 5. NGINX Web Server
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_status "Nginx installed and running"

# 6. CERTBOT for SSL
print_status "Installing Certbot for SSL certificates..."
sudo apt install -y certbot python3-certbot-nginx
print_status "Certbot installed"

# 7. CLONE REPOSITORY
print_status "Cloning Quankey repository..."
cd /home/ubuntu
if [ -d "quankey-mvp" ]; then
    print_warning "Repository already exists. Pulling latest changes..."
    cd quankey-mvp
    git pull origin main
else
    git clone https://github.com/JCQuankey/quankey-mvp.git
    cd quankey-mvp
fi

# 8. INSTALL DEPENDENCIES
print_status "Installing backend dependencies..."
cd backend
npm install

print_status "Installing frontend dependencies..."
cd ../frontend
npm install

# 9. GENERATE SECURE KEYS
print_status "Generating secure cryptographic keys..."
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
DB_ENCRYPTION_KEY=$(openssl rand -hex 32)$(openssl rand -hex 32)  # 128 chars
QUANTUM_SALT=$(openssl rand -base64 32 | tr -d '\n')

# Generate Ed25519 keypair for JWT
print_status "Generating Ed25519 keypair for JWT..."
cd /home/ubuntu/quankey-mvp
mkdir -p keys
openssl genpkey -algorithm ED25519 -out keys/jwt-private.pem
openssl pkey -in keys/jwt-private.pem -pubout -out keys/jwt-public.pem
JWT_PRIVATE_KEY=$(cat keys/jwt-private.pem | base64 -w 0)
JWT_PUBLIC_KEY=$(cat keys/jwt-public.pem | base64 -w 0)

# 10. SETUP ENVIRONMENT
print_status "Creating production environment configuration..."
cat > /home/ubuntu/quankey-mvp/backend/.env << EOF
# Quankey Production Environment
NODE_ENV=production

# Database
DATABASE_URL="postgresql://quankey:QuankeySecurePass2025!@localhost:5432/quankey?sslmode=require"

# Cryptography
JWT_SECRET="$JWT_SECRET"
JWT_PRIVATE_KEY="$JWT_PRIVATE_KEY"
JWT_PUBLIC_KEY="$JWT_PUBLIC_KEY"
DB_ENCRYPTION_KEY="$DB_ENCRYPTION_KEY"
QUANTUM_SALT="$QUANTUM_SALT"

# WebAuthn Configuration
WEBAUTHN_RP_ID=quankey.xyz
WEBAUTHN_RP_NAME="Quankey - Quantum Password Manager"
WEBAUTHN_ORIGIN=https://quankey.xyz

# Server Ports
PORT=5000
FRONTEND_URL=https://quankey.xyz

# Security Headers
CORS_ORIGIN=https://quankey.xyz
SESSION_SECRET="$JWT_SECRET"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
EOF

# Frontend environment
cat > /home/ubuntu/quankey-mvp/frontend/.env.production << EOF
REACT_APP_API_URL=https://quankey.xyz/api
REACT_APP_WEBAUTHN_RP_ID=quankey.xyz
REACT_APP_WEBAUTHN_RP_NAME="Quankey - Quantum Password Manager"
REACT_APP_ENVIRONMENT=production
EOF

# 11. DATABASE SETUP
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
-- Drop existing user/database if exists
DROP DATABASE IF EXISTS quankey;
DROP USER IF EXISTS quankey;

-- Create user and database
CREATE USER quankey WITH PASSWORD 'QuankeySecurePass2025!';
CREATE DATABASE quankey OWNER quankey;
GRANT ALL PRIVILEGES ON DATABASE quankey TO quankey;
ALTER USER quankey CREATEDB;

-- Enable required extensions
\c quankey
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

# 12. PRISMA MIGRATIONS
print_status "Running Prisma migrations..."
cd /home/ubuntu/quankey-mvp/backend
npx prisma generate
npx prisma migrate deploy

# 13. BUILD APPLICATIONS
print_status "Building backend..."
cd /home/ubuntu/quankey-mvp/backend
npm run build

print_status "Building frontend..."
cd /home/ubuntu/quankey-mvp/frontend
npm run build

# 14. CREATE PM2 ECOSYSTEM FILE
print_status "Creating PM2 ecosystem configuration..."
cat > /home/ubuntu/quankey-mvp/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'quankey-backend',
      script: './backend/dist/server.js',
      cwd: '/home/ubuntu/quankey-mvp',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    },
    {
      name: 'quankey-frontend',
      script: 'npx',
      args: 'serve -s build -l 3000',
      cwd: '/home/ubuntu/quankey-mvp/frontend',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false
    }
  ]
};
EOF

# 15. CREATE LOG DIRECTORY
mkdir -p /home/ubuntu/quankey-mvp/logs

# 16. START PM2 SERVICES
print_status "Starting applications with PM2..."
cd /home/ubuntu/quankey-mvp
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 17. NGINX CONFIGURATION
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/quankey << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

# Upstream servers
upstream backend {
    least_conn;
    server localhost:5000 max_fails=3 fail_timeout=30s;
}

upstream frontend {
    server localhost:3000 max_fails=3 fail_timeout=30s;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name quankey.xyz www.quankey.xyz;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name quankey.xyz www.quankey.xyz;

    # SSL configuration (will be updated by Certbot)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.quankey.xyz;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype;

    # API endpoints
    location /api {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "https://quankey.xyz" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }

    # Auth endpoints with stricter rate limiting
    location /api/auth {
        limit_req zone=auth_limit burst=5 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend application
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ /\.env {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/quankey /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    print_status "Nginx configured successfully"
else
    print_error "Nginx configuration error. Please check manually."
fi

# 18. SSL CERTIFICATE WITH CERTBOT
print_status "Setting up SSL certificate with Let's Encrypt..."
print_warning "Make sure your domain (quankey.xyz) is pointing to this server's IP!"
read -p "Press Enter when DNS is configured, or Ctrl+C to skip SSL setup..."

sudo certbot --nginx -d quankey.xyz -d www.quankey.xyz --non-interactive --agree-tos -m admin@quankey.xyz

# 19. FIREWALL CONFIGURATION
print_status "Configuring UFW firewall..."
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 5432/tcp comment 'PostgreSQL'
echo "y" | sudo ufw enable
sudo ufw status verbose

# 20. CREATE BACKUP SCRIPT
print_status "Creating backup script..."
cat > /home/ubuntu/backup-quankey.sh << 'EOF'
#!/bin/bash
# Quankey Backup Script

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/quankey_db_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD="QuankeySecurePass2025!" pg_dump -h localhost -U quankey -d quankey > $DB_BACKUP

# Compress backup
gzip $DB_BACKUP

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${DB_BACKUP}.gz"
EOF

chmod +x /home/ubuntu/backup-quankey.sh

# 21. ADD BACKUP TO CRONTAB
print_status "Setting up automated daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup-quankey.sh") | crontab -

# 22. SYSTEM MONITORING
print_status "Setting up system monitoring..."
cat > /home/ubuntu/check-quankey.sh << 'EOF'
#!/bin/bash
# Quankey Health Check Script

echo "=== QUANKEY SYSTEM STATUS ==="
echo ""

# Check PM2 processes
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🔍 Service Health:"

# Check backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend: Running"
else
    echo "❌ Backend: Down"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Down"
fi

# Check PostgreSQL
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Running"
else
    echo "❌ PostgreSQL: Down"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Down"
fi

echo ""
echo "💾 Disk Usage:"
df -h /

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "📈 CPU Load:"
uptime

echo ""
echo "🔒 SSL Certificate Status:"
sudo certbot certificates
EOF

chmod +x /home/ubuntu/check-quankey.sh

# 23. FINAL STATUS CHECK
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ DEPLOYMENT COMPLETE!                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
print_status "Running final system check..."
/home/ubuntu/check-quankey.sh

echo ""
echo "📋 Important Information:"
echo "========================="
echo "🌐 Website URL: https://quankey.xyz"
echo "🔑 Database: PostgreSQL on localhost:5432"
echo "📊 Monitor: pm2 monit"
echo "📝 Logs: pm2 logs"
echo "🔄 Restart: pm2 restart all"
echo "💾 Backup: /home/ubuntu/backup-quankey.sh"
echo "🔍 Health: /home/ubuntu/check-quankey.sh"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "1. Change the database password in .env and PostgreSQL"
echo "2. Update the admin email for SSL certificates"
echo "3. Review and adjust firewall rules as needed"
echo "4. Set up monitoring alerts for production"
echo ""
echo "🚀 Your Quankey deployment is ready for production!"