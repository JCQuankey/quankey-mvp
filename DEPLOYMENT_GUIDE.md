# 🚀 QUANKEY DEPLOYMENT GUIDE v7.0

**Passkeys + PQC Architecture - Production Deployment**

---

## 📋 OVERVIEW

Este documento contiene las instrucciones completas para desplegar Quankey en producción usando la arquitectura v7.0 con:
- ✅ **Passkeys WebAuthn REALES**
- ✅ **Post-Quantum Cryptography (ML-KEM-768 + ML-DSA-65)**
- ✅ **Security hardening militar**
- ✅ **Deployment automatizado**

---

## 🎯 DEPLOYMENT METHODS

### 🚀 Method 1: AUTOMATED DEPLOYMENT (Recomendado)

**Deployment completamente automatizado con un script:**

```bash
# 1. Conectar a servidor AWS
ssh ubuntu@your-server-ip

# 2. Descargar y ejecutar script
wget https://raw.githubusercontent.com/JCQuankey/quankey-mvp/main/scripts/deploy-aws-fresh.sh
chmod +x deploy-aws-fresh.sh
./deploy-aws-fresh.sh
```

**⏱️ Tiempo estimado: 15-20 minutos**

---

### ⚙️ Method 2: MANUAL DEPLOYMENT

Si prefieres instalación manual o necesitas customización:

#### **STEP 1: System Preparation**

```bash
# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl wget git

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15

# Install PM2 and Nginx
sudo npm install -g pm2
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### **STEP 2: Clone Repository**

```bash
cd /home/ubuntu
git clone https://github.com/JCQuankey/quankey-mvp.git
cd quankey-mvp
```

#### **STEP 3: Install Dependencies**

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies  
cd ../frontend
npm install
```

#### **STEP 4: Database Setup**

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE USER quankey WITH PASSWORD 'YourSecurePassword';
CREATE DATABASE quankey OWNER quankey;
GRANT ALL PRIVILEGES ON DATABASE quankey TO quankey;
ALTER USER quankey CREATEDB;
EOF

# Enable extensions
sudo -u postgres psql -d quankey << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF
```

#### **STEP 5: Environment Configuration**

```bash
# Generate secure keys
JWT_SECRET=$(openssl rand -base64 64)
DB_ENCRYPTION_KEY=$(openssl rand -hex 64)
QUANTUM_SALT=$(openssl rand -base64 32)

# Create .env file
cat > backend/.env << EOF
NODE_ENV=production
DATABASE_URL="postgresql://quankey:YourSecurePassword@localhost:5432/quankey?sslmode=require"
JWT_SECRET="$JWT_SECRET"
DB_ENCRYPTION_KEY="$DB_ENCRYPTION_KEY"
QUANTUM_SALT="$QUANTUM_SALT"
WEBAUTHN_RP_ID=your-domain.com
WEBAUTHN_RP_NAME="Quankey"
WEBAUTHN_ORIGIN=https://your-domain.com
PORT=5000
EOF
```

#### **STEP 6: Build Applications**

```bash
# Build backend
cd backend
npx prisma generate
npx prisma migrate deploy
npm run build

# Build frontend
cd ../frontend
npm run build
```

#### **STEP 7: PM2 Configuration**

```bash
# Copy ecosystem config
cp ecosystem.config.js /home/ubuntu/quankey-mvp/

# Start applications
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

#### **STEP 8: Nginx Configuration**

```bash
# Create Nginx config (see full config in scripts/deploy-aws-fresh.sh)
sudo cp /path/to/nginx-config /etc/nginx/sites-available/quankey
sudo ln -s /etc/nginx/sites-available/quankey /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

#### **STEP 9: SSL Certificate**

```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### **STEP 10: Firewall**

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp  
sudo ufw allow 443/tcp
sudo ufw --force enable
```

---

## 🔧 POST-DEPLOYMENT SETUP

### **1. Verify Deployment**

```bash
# Check service status
./scripts/health-check.sh

# Check PM2 status
pm2 status

# Check logs
pm2 logs
```

### **2. Setup Backups**

```bash
# Make backup script executable
chmod +x scripts/backup-system.sh

# Setup daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/quankey-mvp/scripts/backup-system.sh
```

### **3. Monitor System**

```bash
# Setup monitoring script
chmod +x scripts/health-check.sh

# Add to crontab for regular checks
# Add: */15 * * * * /home/ubuntu/quankey-mvp/scripts/health-check.sh quick
```

---

## 🌐 DOMAIN CONFIGURATION

### **DNS Settings Required:**

```
A Record: your-domain.com → YOUR_SERVER_IP
A Record: www.your-domain.com → YOUR_SERVER_IP
```

### **Environment Variables to Update:**

```bash
# Backend .env
WEBAUTHN_RP_ID=your-domain.com
WEBAUTHN_ORIGIN=https://your-domain.com

# Frontend .env.production  
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_WEBAUTHN_RP_ID=your-domain.com
```

---

## 🔒 SECURITY CHECKLIST

### **✅ Pre-Production Security:**

- [ ] Change default database passwords
- [ ] Update admin email for SSL certificates
- [ ] Enable firewall (UFW)
- [ ] Set strong JWT secrets
- [ ] Configure proper CORS origins
- [ ] Enable SSL/TLS encryption
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Enable fail2ban (optional)
- [ ] Set up monitoring alerts

### **✅ WebAuthn Configuration:**

- [ ] Verify WEBAUTHN_RP_ID matches domain
- [ ] Confirm WEBAUTHN_ORIGIN uses HTTPS
- [ ] Test passkey registration flow
- [ ] Verify biometric authentication
- [ ] Test cross-platform compatibility

### **✅ Quantum Cryptography:**

- [ ] Verify ML-KEM-768 is working
- [ ] Test ML-DSA-65 signatures
- [ ] Confirm @noble/post-quantum library
- [ ] Validate encryption/decryption flow
- [ ] Test key generation

---

## 📊 MONITORING & MAINTENANCE

### **Health Checks:**

```bash
# Comprehensive health check
/home/ubuntu/quankey-mvp/scripts/health-check.sh

# Quick status
/home/ubuntu/quankey-mvp/scripts/health-check.sh quick

# PM2 monitoring
pm2 monit
```

### **Log Locations:**

```
Application Logs:
- Backend: /home/ubuntu/quankey-mvp/logs/backend-*.log
- Frontend: /home/ubuntu/quankey-mvp/logs/frontend-*.log

System Logs:
- Nginx: /var/log/nginx/
- PostgreSQL: /var/log/postgresql/
- System: journalctl -f
```

### **Backup Management:**

```bash
# Create backup
/home/ubuntu/quankey-mvp/scripts/backup-system.sh backup

# List backups
/home/ubuntu/quankey-mvp/scripts/backup-system.sh list

# Verify backup
/home/ubuntu/quankey-mvp/scripts/backup-system.sh verify BACKUP_ID

# Restore backup (DANGEROUS!)
/home/ubuntu/quankey-mvp/scripts/backup-system.sh restore BACKUP_ID
```

---

## 🚨 TROUBLESHOOTING

### **Common Issues:**

#### **1. PM2 Services Not Starting**
```bash
# Check PM2 logs
pm2 logs

# Restart all services
pm2 restart all

# Check environment variables
cat backend/.env
```

#### **2. Database Connection Issues**
```bash
# Test PostgreSQL connection
pg_isready -h localhost -p 5432 -U quankey

# Check database status
sudo systemctl status postgresql

# Check Prisma migrations
cd backend && npx prisma migrate status
```

#### **3. SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test Nginx config
sudo nginx -t
```

#### **4. WebAuthn/Passkeys Not Working**
```bash
# Check domain configuration
echo $WEBAUTHN_RP_ID
echo $WEBAUTHN_ORIGIN

# Verify HTTPS is working
curl -I https://your-domain.com

# Check browser console for errors
```

#### **5. Quantum Crypto Errors**
```bash
# Check if @noble/post-quantum is installed
cd backend && npm list @noble/post-quantum

# Test quantum operations
npm test src/tests/quantum.test.ts

# Check encryption key
echo $DB_ENCRYPTION_KEY | wc -c  # Should be 129 characters
```

---

## 🔄 UPDATE PROCEDURES

### **Application Updates:**

```bash
# Stop services
pm2 stop all

# Pull latest code
git pull origin main

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run migrations
cd backend && npx prisma migrate deploy

# Build applications
cd backend && npm run build
cd ../frontend && npm run build

# Start services
pm2 start all

# Verify deployment
./scripts/health-check.sh
```

### **System Updates:**

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Update Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Update PM2
sudo npm update -g pm2

# Restart services
pm2 restart all
```

---

## 📈 PERFORMANCE OPTIMIZATION

### **Production Optimizations:**

1. **Database Indexing:**
```sql
-- Add indexes for common queries
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_vault_items_user_id ON vault_items(user_id);
CREATE INDEX idx_passkey_credentials_user_id ON passkey_credentials(user_id);
```

2. **Nginx Caching:**
```nginx
# Add to Nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

3. **PM2 Clustering:**
```javascript
// ecosystem.config.js
instances: 'max', // Use all CPU cores
```

### **Resource Monitoring:**

```bash
# Monitor resource usage
htop
iotop
netstat -tulpn

# Check database performance
sudo -u postgres psql -d quankey -c "SELECT * FROM pg_stat_activity;"
```

---

## 📞 SUPPORT & MAINTENANCE

### **Regular Maintenance Tasks:**

- **Daily:** Check health status
- **Weekly:** Review logs and performance
- **Monthly:** Update dependencies and system packages
- **Quarterly:** Security audit and backup testing

### **Emergency Procedures:**

1. **Service Down:** Use health-check script to diagnose
2. **Database Issues:** Check PostgreSQL logs and connections
3. **SSL Expiry:** Renew certificates with certbot
4. **High Load:** Scale PM2 instances or upgrade server
5. **Security Breach:** Rotate all secrets and audit logs

### **Contact Information:**

```
Emergency: Check system logs first
Logs: PM2 logs and system journals
Documentation: This guide and code comments
Backup: Use backup-system.sh for data recovery
```

---

## ✅ DEPLOYMENT VERIFICATION

### **Final Checklist:**

- [ ] ✅ Application loads at https://your-domain.com
- [ ] ✅ Passkey registration works
- [ ] ✅ Biometric authentication functional
- [ ] ✅ Vault encryption/decryption working
- [ ] ✅ SSL certificate valid and auto-renewing
- [ ] ✅ Database connections stable
- [ ] ✅ Backups configured and tested
- [ ] ✅ Health monitoring active
- [ ] ✅ Firewall properly configured
- [ ] ✅ All tests passing
- [ ] ✅ Performance acceptable
- [ ] ✅ Logs are being written correctly

### **Success Indicators:**

1. **Health Check:** `./scripts/health-check.sh` shows 100% success rate
2. **PM2 Status:** All processes show "online" status
3. **User Flow:** Complete passkey registration → vault access → logout cycle works
4. **Security:** All security tests pass with 98+ score
5. **Performance:** Page load times < 2 seconds, API responses < 500ms

---

**🎉 CONGRATULATIONS! QUANKEY IS NOW DEPLOYED IN PRODUCTION**

**Your users now have access to the world's first Passkeys + Post-Quantum Cryptography password manager!**

---

**© 2025 Quankey - World's First Passkeys + PQC Architecture™**