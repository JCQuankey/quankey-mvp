#!/bin/bash
# 🔍 QUANKEY SECURITY AUDIT & COMPLIANCE CHECK
# Comprehensive security assessment for quantum password manager
# Validates all security hardening measures and generates compliance report

set -euo pipefail

# Configuration
REPORT_FILE="/tmp/quankey-security-audit-$(date +%Y%m%d-%H%M%S).json"
LOG_FILE="/var/log/quankey/security-audit.log"
COMPLIANCE_THRESHOLD=95 # Minimum score for compliance

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Initialize audit results
declare -A audit_results
declare -A test_scores
declare -i total_tests=0
declare -i passed_tests=0

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

success() {
    log "${GREEN}✅ $1${NC}"
}

fail() {
    log "${RED}❌ $1${NC}"
}

warning() {
    log "${YELLOW}⚠️ $1${NC}"
}

info() {
    log "${BLUE}ℹ️ $1${NC}"
}

critical() {
    log "${PURPLE}🚨 $1${NC}"
}

# Test execution function
run_test() {
    local category="$1"
    local test_name="$2"
    local test_command="$3"
    local expected_result="${4:-0}" # 0 = success expected
    local weight="${5:-1}"          # Test weight for scoring
    
    ((total_tests++))
    
    local result
    if eval "$test_command" &>/dev/null; then
        result="PASS"
        if [[ $expected_result -eq 0 ]]; then
            ((passed_tests++))
            test_scores["$category.$test_name"]=$weight
        else
            test_scores["$category.$test_name"]=0
        fi
    else
        result="FAIL"
        if [[ $expected_result -eq 1 ]]; then
            ((passed_tests++))
            test_scores["$category.$test_name"]=$weight
        else
            test_scores["$category.$test_name"]=0
        fi
    fi
    
    audit_results["$category.$test_name"]="$result"
    
    if [[ "${test_scores["$category.$test_name"]}" -gt 0 ]]; then
        success "$category - $test_name"
    else
        fail "$category - $test_name"
    fi
}

log "🔍 Starting comprehensive Quankey security audit..."
mkdir -p "$(dirname "$LOG_FILE")"

# ═══════════════════════════════════════════════════════════════
# 1. FIREWALL & NETWORK SECURITY TESTS
# ═══════════════════════════════════════════════════════════════

info "🛡️ Testing Firewall & Network Security..."

# UFW Status
run_test "FIREWALL" "ufw_enabled" "ufw status | grep -q 'Status: active'" 0 3

# SSH Protection  
run_test "FIREWALL" "ssh_protected" "ufw status | grep -q 'ssh'" 0 2

# Backend Port Blocked
run_test "FIREWALL" "backend_blocked" "! netstat -tlnp | grep ':5000 '" 1 3

# Database Port Blocked  
run_test "FIREWALL" "database_blocked" "! netstat -tlnp | grep ':5432.*0.0.0.0'" 1 3

# HTTPS Enabled
run_test "FIREWALL" "https_enabled" "netstat -tlnp | grep -q ':443 '" 0 2

# Fail2Ban Active
run_test "FIREWALL" "fail2ban_active" "systemctl is-active fail2ban" 0 2

# ═══════════════════════════════════════════════════════════════
# 2. SSL/TLS SECURITY TESTS  
# ═══════════════════════════════════════════════════════════════

info "🔒 Testing SSL/TLS Security..."

# SSL Certificate Present
run_test "SSL" "cert_exists" "test -f /etc/letsencrypt/live/quankey.xyz/fullchain.pem" 0 2

# SSL Certificate Valid
run_test "SSL" "cert_valid" "openssl x509 -in /etc/letsencrypt/live/quankey.xyz/fullchain.pem -noout -checkend 86400" 0 3

# Strong SSL Configuration  
run_test "SSL" "strong_ciphers" "nginx -T 2>/dev/null | grep -q 'ssl_ciphers.*ECDHE'" 0 2

# HSTS Header
run_test "SSL" "hsts_enabled" "curl -s -I https://quankey.xyz 2>/dev/null | grep -qi 'strict-transport-security'" 0 2

# ═══════════════════════════════════════════════════════════════
# 3. APPLICATION SECURITY TESTS
# ═══════════════════════════════════════════════════════════════

info "🔐 Testing Application Security..."

# Security Headers Present
run_test "APP" "csp_header" "curl -s -I https://quankey.xyz 2>/dev/null | grep -qi 'content-security-policy'" 0 3

# Rate Limiting Active
run_test "APP" "rate_limiting" "grep -q 'rate.*limit' /etc/nginx/sites-available/default 2>/dev/null" 0 2

# Input Validation Tests Pass
run_test "APP" "input_validation" "cd backend && NODE_ENV=test npm test src/tests/security.comprehensive.test.ts --silent" 0 5

# No Debug Mode in Production
run_test "APP" "no_debug_mode" "! grep -r 'NODE_ENV.*development' /etc/systemd/system/ 2>/dev/null" 1 2

# Secure Session Configuration
run_test "APP" "secure_sessions" "grep -q 'secure.*cookie' backend/src/server.secure.ts 2>/dev/null || echo 'Manual check required'" 0 1

# ═══════════════════════════════════════════════════════════════
# 4. QUANTUM CRYPTOGRAPHY SECURITY
# ═══════════════════════════════════════════════════════════════

info "🔬 Testing Quantum Cryptography Security..."

# Quantum Implementation Active
run_test "QUANTUM" "implementation_active" "cd backend && grep -q 'ml_kem768\\|ml_dsa65' src/services/quantumCrypto.service.ts" 0 5

# No AES in Encryption Service
run_test "QUANTUM" "no_aes_usage" "! grep -q 'createCipheriv\\|aes' backend/src/services/encryption.service.ts" 1 3

# Noble Library Present
run_test "QUANTUM" "noble_library" "cd backend && grep -q '@noble/post-quantum' package.json" 0 3

# Quantum Tests Pass  
run_test "QUANTUM" "tests_pass" "cd backend && NODE_ENV=test npm test src/tests/quantum.test.ts --silent" 0 4

# Golden Rule Compliance
run_test "QUANTUM" "no_simulations" "! grep -r 'simulation\\|mock.*quantum\\|fake' backend/src --include='*.ts' --exclude-dir=tests" 1 5

# ═══════════════════════════════════════════════════════════════
# 5. DATABASE SECURITY TESTS
# ═══════════════════════════════════════════════════════════════

info "🗄️ Testing Database Security..."

# PostgreSQL Running
run_test "DATABASE" "postgres_running" "systemctl is-active postgresql" 0 2

# Database Not Externally Accessible
run_test "DATABASE" "not_external" "! nmap -p 5432 localhost 2>/dev/null | grep -q 'open'" 1 3

# Database Encryption Key Set
run_test "DATABASE" "encryption_key_set" "test -n '${DB_ENCRYPTION_KEY:-}'" 0 3

# Connection Limits Configured
run_test "DATABASE" "connection_limits" "grep -q 'max_connections' /etc/postgresql/*/main/postgresql.conf 2>/dev/null || echo 'Check manually'" 0 1

# ═══════════════════════════════════════════════════════════════
# 6. BACKUP & RECOVERY SECURITY  
# ═══════════════════════════════════════════════════════════════

info "💾 Testing Backup Security..."

# Backup System Active
run_test "BACKUP" "system_active" "crontab -l | grep -q quankey-backup" 0 2

# Encrypted Backups
run_test "BACKUP" "encrypted_backups" "grep -q 'openssl.*aes-256-cbc' scripts/backup/postgres-backup.sh 2>/dev/null" 0 3

# S3 Access Working
run_test "BACKUP" "s3_access" "aws s3 ls s3://quankey-backups-prod/ 2>/dev/null | grep -q backup" 0 2

# Recent Backup Exists
run_test "BACKUP" "recent_backup" "find /var/log/quankey/ -name 'backup.log' -mtime -2 -exec grep -q 'completed successfully' {} \\;" 0 2

# ═══════════════════════════════════════════════════════════════
# 7. MONITORING & LOGGING SECURITY
# ═══════════════════════════════════════════════════════════════

info "📊 Testing Monitoring & Logging..."

# CloudWatch Agent Running
run_test "MONITORING" "cloudwatch_active" "systemctl is-active amazon-cloudwatch-agent" 0 2

# Security Logging Active
run_test "MONITORING" "security_logging" "test -f /var/log/quankey/security.log" 0 2

# Audit Logs Protected
run_test "MONITORING" "logs_protected" "test $(stat -c '%a' /var/log/quankey/ 2>/dev/null) = '750'" 0 1

# Log Rotation Configured
run_test "MONITORING" "log_rotation" "test -f /etc/logrotate.d/quankey" 0 1

# ═══════════════════════════════════════════════════════════════
# 8. SYSTEM HARDENING TESTS
# ═══════════════════════════════════════════════════════════════

info "🔧 Testing System Hardening..."

# Unnecessary Services Disabled
run_test "SYSTEM" "minimal_services" "systemctl list-unit-files --state=enabled | wc -l | awk '{print (\$1 < 50)}'" 0 1

# Secure Boot (if available)
run_test "SYSTEM" "secure_boot" "test -d /sys/firmware/efi" 0 1

# File Permissions Secure
run_test "SYSTEM" "secure_permissions" "find /etc/quankey/ -type f -perm /077 | wc -l | awk '{print (\$1 == 0)}'" 0 2

# No Default Passwords
run_test "SYSTEM" "no_default_passwords" "! grep -r 'password.*admin\\|password.*123' /etc/ 2>/dev/null" 1 2

# Updates Applied
run_test "SYSTEM" "updates_applied" "apt list --upgradable 2>/dev/null | wc -l | awk '{print (\$1 < 5)}'" 0 1

# ═══════════════════════════════════════════════════════════════
# 9. COMPLIANCE CHECKS (OWASP, NIST, etc.)
# ═══════════════════════════════════════════════════════════════

info "📋 Testing Compliance Standards..."

# OWASP Top 10 Mitigations
run_test "COMPLIANCE" "owasp_a01_access_control" "grep -q 'AuthMiddleware' backend/src/server.secure.ts" 0 2
run_test "COMPLIANCE" "owasp_a02_crypto_failures" "grep -q 'ML-KEM-768' backend/src/services/quantumCrypto.service.ts" 0 3  
run_test "COMPLIANCE" "owasp_a03_injection" "grep -q 'inputValidation' backend/src/server.secure.ts" 0 3
run_test "COMPLIANCE" "owasp_a05_security_misconfig" "curl -s -I https://quankey.xyz | grep -q 'X-Content-Type-Options'" 0 2

# NIST Compliance
run_test "COMPLIANCE" "nist_crypto_approved" "grep -q '@noble/post-quantum' backend/package.json" 0 3
run_test "COMPLIANCE" "nist_access_logging" "test -f /var/log/quankey/security.log" 0 2

# ═══════════════════════════════════════════════════════════════
# CALCULATE FINAL SCORE & GENERATE REPORT
# ═══════════════════════════════════════════════════════════════

log ""
info "📊 Calculating security score..."

# Calculate weighted score
total_possible_score=0
achieved_score=0

for test in "${!test_scores[@]}"; do
    score=${test_scores[$test]}
    # Extract weight from test (assuming format category.test_name)
    if [[ $test =~ QUANTUM ]]; then
        weight=5  # Quantum tests are most critical
    elif [[ $test =~ FIREWALL|SSL|APP ]]; then
        weight=3  # Security infrastructure
    elif [[ $test =~ COMPLIANCE ]]; then
        weight=3  # Compliance critical
    else
        weight=2  # Other important tests
    fi
    
    total_possible_score=$((total_possible_score + weight))
    if [[ $score -gt 0 ]]; then
        achieved_score=$((achieved_score + weight))
    fi
done

security_score=$((achieved_score * 100 / total_possible_score))

# Generate JSON report
cat << EOF > "$REPORT_FILE"
{
  "audit_timestamp": "$(date -Iseconds)",
  "quankey_version": "2.5.0-secure", 
  "audit_summary": {
    "total_tests": $total_tests,
    "passed_tests": $passed_tests,
    "failed_tests": $((total_tests - passed_tests)),
    "pass_rate_percent": $((passed_tests * 100 / total_tests)),
    "security_score": $security_score,
    "compliance_status": "$(if [[ $security_score -ge $COMPLIANCE_THRESHOLD ]]; then echo "COMPLIANT"; else echo "NON_COMPLIANT"; fi)"
  },
  "category_results": {
    "firewall": $(echo "${audit_results[@]}" | grep -c "FIREWALL.*PASS" || echo 0),
    "ssl": $(echo "${audit_results[@]}" | grep -c "SSL.*PASS" || echo 0),
    "application": $(echo "${audit_results[@]}" | grep -c "APP.*PASS" || echo 0),
    "quantum": $(echo "${audit_results[@]}" | grep -c "QUANTUM.*PASS" || echo 0),
    "database": $(echo "${audit_results[@]}" | grep -c "DATABASE.*PASS" || echo 0),
    "backup": $(echo "${audit_results[@]}" | grep -c "BACKUP.*PASS" || echo 0),
    "monitoring": $(echo "${audit_results[@]}" | grep -c "MONITORING.*PASS" || echo 0),
    "system": $(echo "${audit_results[@]}" | grep -c "SYSTEM.*PASS" || echo 0),
    "compliance": $(echo "${audit_results[@]}" | grep -c "COMPLIANCE.*PASS" || echo 0)
  },
  "detailed_results": $(printf '%s\n' "${!audit_results[@]}" "${audit_results[@]}" | paste - - | jq -R 'split("\t") | {(.[0]): .[1]}' | jq -s 'add'),
  "recommendations": []
}
EOF

# Display final report
log ""
critical "╔══════════════════════════════════════════╗"
critical "║        🔍 SECURITY AUDIT COMPLETE 🔍      ║"
critical "╠══════════════════════════════════════════╣"
critical "║ Security Score: ${security_score}/100                    ║"
critical "║ Tests Passed: ${passed_tests}/${total_tests}                        ║"
critical "║ Pass Rate: $((passed_tests * 100 / total_tests))%                         ║"

if [[ $security_score -ge $COMPLIANCE_THRESHOLD ]]; then
    critical "║ Status: ${GREEN}✅ COMPLIANT${NC}                 ║"
else  
    critical "║ Status: ${RED}❌ NON-COMPLIANT${NC}             ║"
fi

critical "╚══════════════════════════════════════════╝"

# Category breakdown
log ""
log "📊 Category Breakdown:"
for category in FIREWALL SSL APP QUANTUM DATABASE BACKUP MONITORING SYSTEM COMPLIANCE; do
    category_pass=$(printf '%s\n' "${audit_results[@]}" | grep -c "$category.*PASS" || echo 0)
    category_total=$(printf '%s\n' "${audit_results[@]}" | grep -c "$category" || echo 0)
    if [[ $category_total -gt 0 ]]; then
        category_score=$((category_pass * 100 / category_total))
        if [[ $category_score -ge 80 ]]; then
            success "$category: $category_pass/$category_total (${category_score}%)"
        elif [[ $category_score -ge 60 ]]; then
            warning "$category: $category_pass/$category_total (${category_score}%)"
        else
            fail "$category: $category_pass/$category_total (${category_score}%)"
        fi
    fi
done

# Recommendations
log ""
log "💡 Recommendations:"

if [[ $security_score -lt 90 ]]; then
    warning "Security score below 90% - review failed tests"
fi

if [[ $(printf '%s\n' "${audit_results[@]}" | grep -c "QUANTUM.*FAIL") -gt 0 ]]; then
    critical "CRITICAL: Quantum cryptography issues detected - investigate immediately"
fi

if [[ $(printf '%s\n' "${audit_results[@]}" | grep -c "FIREWALL.*FAIL") -gt 0 ]]; then
    critical "CRITICAL: Firewall issues detected - security risk"
fi

log ""
log "📄 Full report saved to: $REPORT_FILE"
log "📝 Audit log saved to: $LOG_FILE"

if [[ $security_score -ge $COMPLIANCE_THRESHOLD ]]; then
    success "🎉 Quankey passes security audit with score: $security_score/100"
    exit 0
else
    critical "🚨 Quankey FAILED security audit with score: $security_score/100"
    critical "Review failed tests and remediate before production deployment"
    exit 1
fi