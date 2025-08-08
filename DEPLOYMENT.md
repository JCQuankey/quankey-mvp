# 🔐 QUANKEY PRODUCTION DEPLOYMENT GUIDE

**Military-Grade Docker Deployment for Enterprise Environments**

This guide covers the complete production deployment of Quankey using Docker containers with enterprise-grade security hardening.

---

## 🚀 QUICK START

### 1. **Environment Setup**

```bash
# Clone the repository
git clone https://github.com/JCQuankey/quankey-mvp.git
cd quankey-mvp

# Copy and configure production environment
cp .env.production.example .env.production
nano .env.production  # Configure all required variables

# Ensure secure permissions
chmod 600 .env.production
```

### 2. **Security Configuration**

Before deployment, complete the security checklist in `.env.production`:

- [ ] **Strong passwords** (32+ characters for DB, 16+ for Redis)
- [ ] **Ed25519 JWT keys** properly generated
- [ ] **Database encryption key** (64 hex characters)
- [ ] **CORS origins** correctly configured
- [ ] **SSL certificates** installed and configured
- [ ] **All development flags disabled**

### 3. **Deploy to Production**

```bash
# Run the automated deployment script
./scripts/deploy-production.sh

# Or manually with Docker Compose
docker-compose -f docker-compose.production.yml up -d
```

### 4. **Verify Deployment**

```bash
# Run comprehensive security scan
./scripts/security-scan.sh

# Check service health
curl http://localhost:5000/api/health
curl http://localhost:80
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### **Production Stack**

```mermaid
graph TB
    A[Internet] --> B[Nginx Frontend]
    B --> C[React App]
    B --> D[Backend API]
    D --> E[PostgreSQL]
    D --> F[Redis]
    
    subgraph "Security Layers"
        G[Rate Limiting]
        H[DDoS Protection]
        I[JWT Ed25519]
        J[ML-KEM-768]
        K[AES-256-GCM]
    end
```

### **Container Structure**

| Container | Purpose | Ports | Security |
|-----------|---------|-------|----------|
| `quankey-frontend` | Nginx + React | 80, 443 | CSP, HSTS, Security Headers |
| `quankey-backend` | Node.js API | 5000 | Rate Limiting, JWT, Audit |
| `quankey-postgres` | Database | 5432 | RLS, SSL, Encryption |
| `quankey-redis` | Cache/Sessions | 6379 | Auth, Memory Limits |

---

## 🔐 SECURITY FEATURES

### **Network Security**
- ✅ **Internal networks** with no external access for databases
- ✅ **Port restrictions** - only necessary ports exposed
- ✅ **Container isolation** with security-opt configurations

### **Application Security**
- ✅ **Non-root users** in all containers
- ✅ **Capability dropping** - minimal required permissions
- ✅ **Read-only filesystems** where possible
- ✅ **Security headers** (CSP, HSTS, X-Frame-Options)

### **Data Security**
- ✅ **Database encryption** - Field-level AES-256-GCM
- ✅ **Transport encryption** - SSL/TLS for all connections
- ✅ **Quantum-resistant** - Real ML-KEM-768 + ML-DSA-65
- ✅ **Audit logging** - Tamper-proof with hash integrity

---

## 🔧 CONFIGURATION GUIDE

### **Environment Variables**

#### **Critical Security Variables**
```bash
# Database Security
POSTGRES_PASSWORD="ultra-secure-64-char-password-for-production-deployment"
DB_ENCRYPTION_KEY="64-character-hex-key-for-aes-256-gcm-field-encryption-security"

# Authentication
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Ed25519-Private-Key\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nYour-Ed25519-Public-Key\n-----END PUBLIC KEY-----"

# Redis Cache
REDIS_PASSWORD="secure-redis-password-32-chars-min"
```

#### **Generate Secure Keys**
```bash
# Generate Ed25519 key pair for JWT
openssl genpkey -algorithm Ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem

# Generate database encryption key (64 hex chars)
openssl rand -hex 32

# Generate secure passwords
openssl rand -base64 48  # For database
openssl rand -base64 32  # For Redis
```

### **SSL/TLS Configuration**

#### **Certificate Setup**
```bash
# For Let's Encrypt (recommended for production)
certbot --nginx -d quankey.xyz -d www.quankey.xyz

# Or use existing certificates
cp your-cert.crt /etc/ssl/certs/quankey.crt
cp your-key.key /etc/ssl/private/quankey.key
chmod 600 /etc/ssl/private/quankey.key
```

#### **Nginx SSL Configuration**
The production nginx.conf includes:
- TLS 1.3 enforcement
- Perfect Forward Secrecy
- HSTS headers
- Certificate pinning ready

---

## 📊 MONITORING & MAINTENANCE

### **Health Checks**

All containers include built-in health checks:

```bash
# Check all services
docker-compose -f docker-compose.production.yml ps

# Individual health checks
curl http://localhost:5000/api/health  # Backend
curl http://localhost:80              # Frontend
docker exec quankey-postgres pg_isready  # Database
docker exec quankey-redis redis-cli ping  # Redis
```

### **Log Management**

```bash
# View application logs
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend

# Security audit logs
docker exec quankey-backend cat /app/logs/security-audit.log

# Database logs
docker exec quankey-postgres tail -f /var/log/postgresql/postgresql.log
```

### **Backup Strategy**

```bash
# Database backup (automated in deployment script)
docker exec quankey-postgres pg_dumpall -U quankey_admin > backup.sql

# Volume backup
docker run --rm -v quankey_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup-$(date +%Y%m%d).tar.gz -C /data .
```

---

## 🔍 SECURITY MONITORING

### **Automated Security Scanning**

```bash
# Run comprehensive security scan
./scripts/security-scan.sh

# OWASP ZAP scan only
docker-compose --profile security up security-scanner

# Dependency vulnerability scan
cd backend && npm audit
cd frontend && npm audit
```

### **Real-time Monitoring**

The deployment includes:
- **Rate limiting metrics** via Redis
- **Security event logging** with structured JSON
- **Performance monitoring** with health checks
- **Audit trail** with tamper-proof hashing

### **Security Alerts**

Configure webhook alerts for:
- Failed authentication attempts (>5 in 15 min)
- Database connection failures
- SSL certificate expiration
- Unusual traffic patterns

---

## 🚨 INCIDENT RESPONSE

### **Security Incident Checklist**

1. **Immediate Response**
   ```bash
   # Stop all services
   docker-compose -f docker-compose.production.yml down
   
   # Preserve logs
   cp -r logs/ incident-$(date +%Y%m%d-%H%M%S)/
   
   # Review audit logs
   grep "SECURITY_VIOLATION\|FAILED_AUTH" logs/audit.log
   ```

2. **Investigation**
   ```bash
   # Check for unauthorized access
   docker exec quankey-postgres \
     psql -U quankey_admin -c "SELECT * FROM audit_logs WHERE action LIKE '%UNAUTHORIZED%';"
   
   # Review network connections
   docker exec quankey-backend netstat -tulpn
   ```

3. **Recovery**
   ```bash
   # Restore from backup
   ./scripts/restore-backup.sh /var/backups/quankey/YYYYMMDD_HHMMSS/
   
   # Update all credentials
   # Regenerate JWT keys, database passwords, etc.
   
   # Redeploy with new credentials
   ./scripts/deploy-production.sh
   ```

---

## 🎯 PERFORMANCE OPTIMIZATION

### **Database Optimization**

```sql
-- Enable PostgreSQL performance extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_buffercache;

-- Optimize for password manager workload
SET shared_preload_libraries = 'pg_stat_statements';
SET max_connections = 200;
SET shared_buffers = '256MB';
```

### **Redis Optimization**

```bash
# Configure Redis for session storage
redis-cli CONFIG SET maxmemory-policy volatile-lru
redis-cli CONFIG SET timeout 300
redis-cli CONFIG SET tcp-keepalive 300
```

### **Application Scaling**

For high-availability deployment:

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
    
  frontend:
    deploy:
      replicas: 2
      
# Load balancer configuration
nginx:
  upstream backend {
    server backend_1:5000;
    server backend_2:5000;
    server backend_3:5000;
  }
```

---

## 🔗 EXTERNAL INTEGRATIONS

### **Domain Configuration**

DNS records for production:
```
A     quankey.xyz        → YOUR_SERVER_IP
CNAME www.quankey.xyz    → quankey.xyz
A     api.quankey.xyz    → YOUR_SERVER_IP
TXT   quankey.xyz        → "v=spf1 include:_spf.google.com ~all"
```

### **CDN Setup (Optional)**

For global performance:
```bash
# CloudFlare configuration
- SSL/TLS: Full (strict)
- Security Level: High
- Bot Fight Mode: On
- DDoS Protection: Enabled
```

---

## 📋 PRODUCTION CHECKLIST

Before going live, verify:

### **Security Checklist**
- [ ] SSL/TLS certificates installed and valid
- [ ] All default passwords changed
- [ ] Firewall configured (only ports 80, 443, 22)
- [ ] SSH key-based authentication only
- [ ] Security headers configured
- [ ] Rate limiting tested
- [ ] Backup system operational
- [ ] Monitoring alerts configured

### **Performance Checklist**
- [ ] Database indexes optimized
- [ ] Redis memory limits set
- [ ] Nginx caching configured
- [ ] Health checks passing
- [ ] Load testing completed

### **Compliance Checklist**
- [ ] Audit logging enabled
- [ ] Data retention policies set
- [ ] Privacy policy updated
- [ ] Security documentation complete

---

## 🆘 TROUBLESHOOTING

### **Common Issues**

#### **Container Won't Start**
```bash
# Check logs for specific error
docker-compose -f docker-compose.production.yml logs backend

# Verify environment variables
docker-compose config

# Check resource usage
docker stats
```

#### **Database Connection Failed**
```bash
# Test database connectivity
docker exec quankey-postgres pg_isready -U quankey_admin

# Check database logs
docker exec quankey-postgres tail -f /var/log/postgresql/postgresql.log

# Verify credentials
echo $DATABASE_URL
```

#### **SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/quankey.crt -text -noout

# Verify certificate chain
openssl verify -CApath /etc/ssl/certs/ /etc/ssl/certs/quankey.crt

# Test SSL connection
openssl s_client -connect quankey.xyz:443
```

### **Emergency Contacts**

For critical security incidents:
- **Security Team**: security@quankey.xyz
- **Infrastructure**: ops@quankey.xyz  
- **Incident Response**: incident@quankey.xyz

---

## 📚 ADDITIONAL RESOURCES

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Nginx Security Hardening](https://nginx.org/en/docs/http/ngx_http_secure_link_module.html)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [OWASP Container Security](https://owasp.org/www-project-container-security/)

---

**© 2024 Cainmani Resources, S.L. - A Quankey Company** 🔐

*"Military-grade deployment for the world's most secure password manager"*