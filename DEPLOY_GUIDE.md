# 🚀 QUANKEY LOCAL DEVELOPMENT DEPLOYMENT GUIDE

**CONFIDENCIAL**: Instrucciones para deploy local en localhost para desarrollo confidencial antes del lanzamiento público

---

## 📋 PRE-REQUISITOS COMPLETADOS

### ✅ Recursos que necesitas crear:

**EMAILS CRÍTICOS**:
```
✅ beta1@quankey.xyz hasta beta10@quankey.xyz
✅ support@quankey.xyz
✅ security@quankey.xyz  
✅ noreply@quankey.xyz
✅ recovery@quankey.xyz
✅ admin@quankey.xyz
✅ investors@quankey.xyz
```

**SUBDOMINIOS**:
```
✅ www.quankey.xyz (landing page)
✅ app.quankey.xyz (frontend React)
✅ api.quankey.xyz (backend Node.js)
✅ recovery.quankey.xyz (recovery page)  
✅ beta.quankey.xyz (beta program)
✅ status.quankey.xyz (status page)
```

**CERTIFICADOS SSL**: Wildcard `*.quankey.xyz` + `quankey.xyz`

---

## 🌐 PASO 1: LANDING PAGE DEPLOY LOCAL

### Servir en localhost:3000:
```bash
# Opción 1: Usando un servidor HTTP simple
cd landing
python -m http.server 3000

# Opción 2: Usando Node.js http-server
npx http-server . -p 3000 -o

# Files served:
# /landing/index.html -> http://localhost:3000/index.html
```

### SMTP Configuration (Opcional para desarrollo):
```env
# Para desarrollo, los emails se loggean en consola
SMTP_HOST=localhost
SMTP_USER=dev@localhost
SMTP_PASS=development
```

---

## 🎯 PASO 2: BACKEND DEPLOY (localhost:5000)

### Environment Variables para Desarrollo:
```env
# Database (Local PostgreSQL)
DATABASE_URL=postgresql://quankey_user:quankey_pass@localhost:5432/quankey_dev

# Security (Development keys)
JWT_SECRET=dev-jwt-secret-key-for-local-testing-only
AUDIT_SECRET_KEY=dev-audit-signature-key-for-local

# SMTP Configuration (Development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=dev@localhost
SMTP_PASS=development

# Local URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5000
RECOVERY_URL=http://localhost:3001

# Node Environment
NODE_ENV=development
PORT=5000
```

### Deploy Steps:
```bash
# 1. Install dependencies
cd backend
npm ci --production

# 2. Build TypeScript
npm run build

# 3. Database migration
npx prisma migrate deploy

# 4. Start development server
npm run dev

# 5. Verify health
curl http://localhost:5000/api/health
```

---

## 🎨 PASO 3: FRONTEND DEPLOY (localhost:3001)

### Environment Variables:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RECOVERY_URL=http://localhost:3001
REACT_APP_ENVIRONMENT=development
```

### Deploy Steps:
```bash
# 1. Install and start development server
cd frontend
npm ci
npm start

# Frontend will be available at http://localhost:3001
# React will proxy API calls to localhost:5000
```

---

## 👥 PASO 4: CREATE REAL BETA USERS

### Add to Prisma Schema:
```prisma
model WaitlistUser {
  id          String   @id @default(cuid())
  email       String   @unique
  position    Int      @unique
  ipAddress   String?
  userAgent   String?
  source      String   @default("landing_page")
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  notified    Boolean  @default(false)
  
  @@index([position])
  @@index([createdAt])
  @@map("waitlist_users")
}
```

### Run Beta User Creation:
```bash
cd backend
node scripts/createBetaUsers.js
```
*This creates 10 beta users with real emails and quantum passwords*

---

## 📊 PASO 5: MONITORING & METRICS

### Health Endpoints:
```bash
# API Health
https://api.quankey.xyz/api/health

# Security Metrics  
https://api.quankey.xyz/api/security/metrics

# Audit Logs
https://api.quankey.xyz/api/security/audit
```

### Real-Time Monitoring:
```bash
# Backend logs
tail -f /var/log/quankey/backend.log

# Database connections
psql -h localhost -U user quankey_prod -c "SELECT * FROM pg_stat_activity;"

# System resources
htop
```

---

## 🛡️ PASO 6: SECURITY CONFIGURATION

### SSL/TLS Setup:
```nginx
server {
    listen 443 ssl http2;
    server_name api.quankey.xyz;
    
    ssl_certificate /path/to/quankey.xyz.crt;
    ssl_certificate_key /path/to/quankey.xyz.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Firewall Rules:
```bash
# Allow only necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (redirect to HTTPS)
ufw allow 443/tcp  # HTTPS
ufw allow 5432/tcp # PostgreSQL (if remote)
```

---

## 📈 PASO 7: ANALYTICS & TRACKING

### Google Analytics Setup:
Replace in landing/index.html:
```javascript
gtag('config', 'GA_MEASUREMENT_ID'); // Your GA4 ID
```

### Conversion Tracking:
```javascript
// Waitlist signup conversion
gtag('event', 'conversion', {
    'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL'
});
```

---

## 🚨 PASO 8: ALERTS & NOTIFICATIONS

### Setup Email Alerts:
```bash
# Install and configure sendmail/postfix
# Route security alerts to security@quankey.xyz
# Route system alerts to admin@quankey.xyz
```

### Monitor Critical Metrics:
```bash
# Database connections
# Memory usage
# Disk space
# SSL certificate expiry
# Domain expiry
```

---

## ✅ PASO 9: FINAL VERIFICATION

### Checklist Before Development Testing:
```bash
# ✅ Landing page loads at http://localhost:3000
# ✅ Waitlist form captures emails (logged to console)
# ✅ Backend API responds at http://localhost:5000/api/health
# ✅ Frontend loads at http://localhost:3001
# ✅ 10 beta users created successfully in local database
# ✅ Email sending works (development mode - console logs)
# ✅ Local database connection working
# ✅ All services running on different ports
# ✅ CORS configured for localhost
```

### Test Local User Journey:
```bash
1. Visit http://localhost:3000 (landing page)
2. Sign up for waitlist -> check console logs
3. Visit http://localhost:3001 (app)
4. Login as beta1@quankey.xyz -> should work locally
5. Generate quantum password -> should work
6. View security metrics -> should show local test data
```

---

## 🎯 EXPECTED RESULTS WEEK 1

### Landing Page Metrics:
- **100+ waitlist signups** (goal)
- **<3s page load time**
- **>95% uptime**

### Beta User Activity:
- **10/10 beta users active**
- **50+ quantum passwords generated**
- **20+ vault operations daily**

### System Performance:
- **<100ms API response times**
- **Zero security incidents**
- **80%+ test coverage maintained**

---

## 📞 SUPPORT CONTACTS

**Technical Issues**: support@quankey.xyz  
**Security Alerts**: security@quankey.xyz  
**Investor Updates**: investors@quankey.xyz  

---

# 🚀 READY FOR REAL USERS!

Una vez completado este deployment, tendrás:
- ✅ Landing page capturando leads reales
- ✅ 10 beta users usando el producto real  
- ✅ Métricas de rendimiento en vivo
- ✅ Sistema de alertas funcionando
- ✅ Preparado para Product Hunt launch

**¡Desarrollo confidencial completado, listo para migración a quankey.xyz cuando estés preparado para el lanzamiento público!**

---

## 🔄 MIGRACIÓN A PRODUCCIÓN (FUTURO)

Cuando estés listo para el lanzamiento público:

1. **Actualizar URLs**: Cambiar todos los `localhost` por `quankey.xyz` en:
   - `landing/index.html` (API endpoints)
   - Variables de entorno del backend
   - Variables de entorno del frontend

2. **Configurar Dominio Real**:
   - DNS para quankey.xyz
   - SSL certificates para *.quankey.xyz
   - Emails @quankey.xyz

3. **Deploy a Producción**:
   - Backend → api.quankey.xyz
   - Frontend → app.quankey.xyz  
   - Landing → www.quankey.xyz

4. **Migrar Base de Datos**:
   - PostgreSQL producción
   - Migrar usuarios beta existentes
   - Configurar backups automáticos