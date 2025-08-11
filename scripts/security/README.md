# 🛡️ Quankey Military-Grade Security System

Ultra-strict firewall and comprehensive security hardening for the quantum password manager production environment.

## 🚀 Quick Deployment

```bash
# 1. Setup military-grade firewall
chmod +x scripts/security/firewall-setup.sh
sudo TRUSTED_IPS="YOUR_IP_HERE" ./scripts/security/firewall-setup.sh

# 2. Run comprehensive security audit
chmod +x scripts/security/security-audit.sh
sudo ./scripts/security/security-audit.sh

# 3. Manage firewall ongoing
sudo quankey-firewall status
```

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `firewall-setup.sh` | Military-grade UFW + iptables + Fail2Ban configuration |
| `security-audit.sh` | 50+ security tests with compliance scoring |
| `quankey-firewall` | Daily firewall management tool (auto-installed) |

## 🛡️ Firewall Protection

### 🔴 **Zero-Trust Default Policy**
- **Default**: DENY ALL incoming, outgoing, and forwarded traffic
- **Principle**: Only explicitly allowed connections permitted
- **Approach**: Minimal attack surface with maximum security

### ✅ **Allowed Traffic**
```bash
# Essential Services
HTTPS (443)     ✅ Global access for users
HTTP (80)       ✅ Let's Encrypt SSL renewal only  
SSH (22)        ✅ Trusted IPs only
DNS (53)        ✅ Outbound for domain resolution

# AWS Services (Outbound Only)
S3 Endpoints    ✅ Backup operations
CloudWatch      ✅ Monitoring & logging

# System Services
Loopback        ✅ Internal system communication
```

### ❌ **Blocked Traffic**
```bash
# Application Ports (External Access Blocked)
Backend (5000)   ❌ Only Nginx can access
PostgreSQL (5432) ❌ Database protected
Redis (6379)     ❌ Cache protected

# Attack Vectors
Telnet (23)      ❌ Insecure protocol
SMB (445)        ❌ Windows file sharing
RDP (3389)       ❌ Remote desktop
VNC (5900)       ❌ Remote access
MSSQL (1433)     ❌ Database attacks
All ICMP         ❌ Stealth mode (no ping)

# Geographic/Network
Private IPs      ❌ Reserved ranges from internet
Multicast        ❌ Broadcast attacks
Reserved         ❌ Invalid internet ranges
```

## 🚔 Attack Protection

### **Fail2Ban Integration**
- **SSH Brute Force**: 3 failed attempts = 1 hour ban
- **Nginx Auth**: 3 failed attempts = 1 hour ban  
- **Quankey Auth**: 5 failed attempts = 2 hour ban
- **Auto-recovery**: Automatic unban after timeout

### **Rate Limiting**
```bash
SSH Connections: Max 4 per minute per IP
HTTPS Connections: Max 50 concurrent per IP
HTTP Connections: Max 25 concurrent per IP
```

### **DDoS Protection**
- Connection state tracking
- Concurrent connection limits
- Automatic blocking of excessive requests
- Geographic IP range blocking

## 🔧 Management Commands

### **Daily Operations**
```bash
# Check firewall status
sudo quankey-firewall status

# View recent blocks
sudo quankey-firewall logs

# Test connectivity
sudo quankey-firewall test

# Unblock specific IP
sudo quankey-firewall unblock 192.168.1.100

# Whitelist trusted IP
sudo quankey-firewall whitelist 203.0.113.1
```

### **Emergency Procedures**
```bash
# Emergency disable (10 minutes only)
sudo quankey-firewall emergency-disable

# Manual UFW management
sudo ufw status verbose
sudo ufw allow from TRUSTED_IP
sudo ufw delete allow from BAD_IP
```

## 🔍 Security Audit System

### **Comprehensive Testing**
The security audit runs **50+ security tests** across 9 categories:

1. **🛡️ Firewall & Network** (7 tests)
   - UFW enabled and configured
   - Critical ports properly blocked
   - Rate limiting active
   - Fail2Ban monitoring

2. **🔒 SSL/TLS Security** (4 tests)
   - Valid SSL certificates
   - Strong cipher configuration
   - HSTS headers present
   - Certificate expiration check

3. **🔐 Application Security** (5 tests)
   - Security headers (CSP, etc.)
   - Input validation tests
   - Rate limiting configured
   - No debug mode in production

4. **🔬 Quantum Cryptography** (5 tests)
   - ML-KEM-768/ML-DSA-65 active
   - No AES usage in encryption
   - Golden rule compliance
   - Quantum tests passing

5. **🗄️ Database Security** (4 tests)
   - PostgreSQL not externally accessible
   - Encryption keys configured
   - Connection limits set
   - Service running properly

6. **💾 Backup Security** (4 tests)
   - Backup system active
   - Encrypted backups
   - S3 access working
   - Recent backup exists

7. **📊 Monitoring & Logging** (4 tests)
   - CloudWatch agent running
   - Security logging active
   - Log permissions secure
   - Log rotation configured

8. **🔧 System Hardening** (5 tests)
   - Minimal services enabled
   - Secure file permissions
   - No default passwords
   - Updates applied

9. **📋 Compliance** (12+ tests)
   - OWASP Top 10 mitigations
   - NIST cryptography standards
   - Access control implementation
   - Security configuration validation

### **Scoring System**
```bash
# Weighted Scoring
Quantum Tests:    5 points each (most critical)
Security/Firewall: 3 points each (high priority)  
Compliance:       3 points each (regulatory)
System/Backup:    2 points each (important)

# Compliance Threshold: 95/100
Score ≥95: ✅ COMPLIANT
Score <95:  ❌ NON-COMPLIANT
```

### **Sample Audit Output**
```
╔══════════════════════════════════════════╗
║        🔍 SECURITY AUDIT COMPLETE 🔍      ║
╠══════════════════════════════════════════╣
║ Security Score: 98/100                   ║
║ Tests Passed: 47/50                      ║
║ Pass Rate: 94%                           ║
║ Status: ✅ COMPLIANT                     ║
╚══════════════════════════════════════════╝

📊 Category Breakdown:
✅ FIREWALL: 7/7 (100%)
✅ SSL: 4/4 (100%)
✅ APP: 5/5 (100%)
✅ QUANTUM: 5/5 (100%)
✅ DATABASE: 4/4 (100%)
✅ BACKUP: 4/4 (100%)
✅ MONITORING: 4/4 (100%)
⚠️ SYSTEM: 3/4 (75%)
✅ COMPLIANCE: 11/12 (92%)
```

## ⚙️ Configuration

### **Environment Variables**
```bash
# Required for firewall setup
export SSH_PORT=22                    # SSH port (default: 22)
export TRUSTED_IPS="203.0.113.1"    # Your admin IP addresses
export BACKUP_SERVER_IP=""            # S3/backup server IP
export CDN_IPS=""                     # CDN IP ranges if used

# Audit configuration  
export COMPLIANCE_THRESHOLD=95        # Minimum score for compliance
```

### **Network Requirements**
```bash
# Inbound (from internet)
443/tcp  - HTTPS (user access)
80/tcp   - HTTP (Let's Encrypt only)
22/tcp   - SSH (trusted IPs only)

# Outbound (to internet)  
443/tcp  - HTTPS (updates, AWS APIs)
80/tcp   - HTTP (package updates)
53/udp   - DNS (domain resolution)

# Internal (localhost only)
5000/tcp - Backend API (Nginx → Backend)
5432/tcp - PostgreSQL (Backend → DB)
```

## 🚨 Security Levels

### **Level 1: Basic Protection** (Default)
- UFW enabled with deny-all default
- Essential ports only
- Basic Fail2Ban rules
- SSL/TLS configured

### **Level 2: Hardened Protection** (Recommended)
```bash
# Additional hardening
sudo sysctl -w net.ipv4.conf.all.send_redirects=0
sudo sysctl -w net.ipv4.conf.all.accept_redirects=0
sudo sysctl -w net.ipv4.icmp_echo_ignore_all=1

# Kernel parameter tuning
echo "net.ipv4.tcp_syncookies = 1" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 2048" >> /etc/sysctl.conf
```

### **Level 3: Military-Grade** (Maximum Security)
```bash
# Additional restrictions
- Disable USB ports
- Implement file integrity monitoring  
- Enable kernel module signing
- Configure mandatory access control (SELinux/AppArmor)
- Implement network segmentation
```

## 📊 Monitoring & Alerting

### **Real-time Monitoring**
```bash
# Firewall logs (live)
sudo tail -f /var/log/ufw.log

# Fail2Ban actions (live) 
sudo tail -f /var/log/fail2ban.log

# System authentication (live)
sudo tail -f /var/log/auth.log

# Quankey security events (live)
sudo tail -f /var/log/quankey/security.log
```

### **CloudWatch Integration**
- UFW blocks → CloudWatch metrics
- Fail2Ban bans → CloudWatch alerts  
- Security score → Daily reports
- Attack patterns → Automated analysis

## 🔧 Maintenance

### **Daily Tasks**
```bash
# Security status check
sudo quankey-firewall status

# Review blocked connections
sudo quankey-firewall logs | tail -20

# Quick audit
sudo ./scripts/security/security-audit.sh | grep "Security Score"
```

### **Weekly Tasks**  
```bash
# Full security audit
sudo ./scripts/security/security-audit.sh

# Review Fail2Ban statistics
sudo fail2ban-client status --all

# Update firewall rules if needed
sudo ufw --force reload
```

### **Monthly Tasks**
```bash
# Security configuration backup
sudo tar -czf quankey-security-backup-$(date +%Y%m%d).tar.gz \
  /etc/ufw/ /etc/fail2ban/ /etc/quankey/ \
  /usr/local/bin/quankey-firewall

# Review and rotate logs
sudo logrotate -f /etc/logrotate.d/quankey

# Update trusted IP list if needed
sudo quankey-firewall whitelist NEW_TRUSTED_IP
```

## 🚨 Troubleshooting

### **Common Issues**

#### ❌ **"Cannot connect via SSH"**
```bash
# Check if SSH is allowed
sudo ufw status | grep ssh

# Check current IP
curl -s https://ipinfo.io/ip

# Emergency access (if you have console access)
sudo ufw allow from YOUR_CURRENT_IP to any port 22
```

#### ❌ **"Website not accessible"**
```bash
# Check if HTTPS is allowed
sudo ufw status | grep 443

# Check Nginx status
sudo systemctl status nginx

# Test firewall rules
sudo quankey-firewall test
```

#### ❌ **"Blocked by Fail2Ban"**
```bash
# Check ban status
sudo fail2ban-client status

# Unblock specific IP
sudo quankey-firewall unblock YOUR_IP

# Whitelist permanently  
sudo quankey-firewall whitelist YOUR_IP
```

#### ❌ **"Security audit failing"**
```bash
# Run audit in verbose mode
sudo bash -x ./scripts/security/security-audit.sh

# Check specific category
sudo ./scripts/security/security-audit.sh | grep "QUANTUM\|FIREWALL"

# Fix and re-run
sudo ./scripts/security/firewall-setup.sh
sudo ./scripts/security/security-audit.sh
```

## 📈 Performance Impact

### **Resource Usage**
- **UFW**: ~5MB RAM, minimal CPU
- **Fail2Ban**: ~10MB RAM, minimal CPU  
- **iptables**: ~2MB RAM, minimal CPU
- **Total Impact**: <1% system resources

### **Network Latency**
- **Connection Filtering**: <1ms additional latency
- **Rate Limiting**: Only applies when thresholds exceeded
- **Logging**: Minimal performance impact

### **Optimization Tips**
1. **Reduce logging verbosity** if disk I/O is concern
2. **Adjust rate limits** based on legitimate traffic patterns
3. **Fine-tune Fail2Ban** detection windows
4. **Use connection state tracking** for better performance

## 💰 Cost Implications

### **CloudWatch Costs** (Additional)
- **Firewall Metrics**: ~$2/month
- **Security Logs**: ~$5/month (estimated 5GB)
- **Custom Alarms**: ~$1/month (10 additional alarms)

### **Performance Benefits**
- **DDoS Protection**: Saves bandwidth costs
- **Attack Prevention**: Reduces incident response costs  
- **Compliance**: Meets regulatory requirements
- **Insurance**: May reduce cybersecurity premiums

## 📞 Support

### **Emergency Contacts**
```bash
# If locked out of server
1. Use AWS Console → EC2 → Connect (if available)
2. Contact hosting provider for console access
3. Use emergency disable: quankey-firewall emergency-disable

# If under attack
1. Check logs: sudo quankey-firewall logs
2. Run audit: sudo ./scripts/security/security-audit.sh
3. Enable additional protection if needed
```

### **Useful Commands**
```bash
# Firewall status
sudo ufw status numbered

# Active connections
sudo netstat -tulpn | grep LISTEN

# Recent attacks
sudo grep "UFW-BLOCK" /var/log/syslog | tail -10

# System security
sudo lynis audit system --quick
```

---

🔐 **Maximum Security Promise**: This firewall configuration implements military-grade security appropriate for a quantum password manager handling sensitive cryptographic operations. Every rule has been designed with the principle of least privilege and zero-trust networking.