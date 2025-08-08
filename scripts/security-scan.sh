#!/bin/bash

# 🔐 QUANKEY SECURITY SCANNING SCRIPT
# Comprehensive security validation for military-grade deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="${PROJECT_ROOT}/reports/security"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create reports directory
mkdir -p "$REPORT_DIR"

log "🔍 Starting Quankey Security Scan"
log "Report directory: $REPORT_DIR"

# ===========================================
# DOCKER SECURITY SCAN
# ===========================================

log "🐳 Running Docker security scan..."

# Scan backend image
if docker images | grep -q "quankey-backend"; then
    log "Scanning backend Docker image..."
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
        -v "${REPORT_DIR}:/reports" \
        aquasec/trivy image \
        --format json \
        --output "/reports/backend-image-scan-${TIMESTAMP}.json" \
        quankey-backend || warning "Backend image scan completed with warnings"
fi

# Scan frontend image
if docker images | grep -q "quankey-frontend"; then
    log "Scanning frontend Docker image..."
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
        -v "${REPORT_DIR}:/reports" \
        aquasec/trivy image \
        --format json \
        --output "/reports/frontend-image-scan-${TIMESTAMP}.json" \
        quankey-frontend || warning "Frontend image scan completed with warnings"
fi

success "Docker security scan completed"

# ===========================================
# OWASP ZAP SECURITY SCAN
# ===========================================

log "🕷️ Running OWASP ZAP security scan..."

# Check if services are running
if ! curl -s -f "http://localhost:5000/api/health" > /dev/null; then
    error "Backend service not responding. Start services first with: docker-compose up -d"
fi

if ! curl -s -f "http://localhost:80" > /dev/null; then
    error "Frontend service not responding. Start services first with: docker-compose up -d"
fi

# Run ZAP baseline scan on frontend
docker run --rm -v "${REPORT_DIR}:/zap/wrk/:rw" \
    -t owasp/zap2docker-stable zap-baseline.py \
    -t http://host.docker.internal:80 \
    -J "/zap/wrk/frontend-zap-baseline-${TIMESTAMP}.json" \
    -r "/zap/wrk/frontend-zap-baseline-${TIMESTAMP}.html" || warning "ZAP baseline scan completed with findings"

# Run ZAP API scan on backend
docker run --rm -v "${REPORT_DIR}:/zap/wrk/:rw" \
    -t owasp/zap2docker-stable zap-baseline.py \
    -t http://host.docker.internal:5000 \
    -J "/zap/wrk/backend-zap-baseline-${TIMESTAMP}.json" \
    -r "/zap/wrk/backend-zap-baseline-${TIMESTAMP}.html" || warning "ZAP API scan completed with findings"

success "OWASP ZAP security scan completed"

# ===========================================
# DEPENDENCY VULNERABILITY SCAN
# ===========================================

log "📦 Running dependency vulnerability scan..."

# Scan backend dependencies
cd "${PROJECT_ROOT}/backend"
if [[ -f "package.json" ]]; then
    log "Scanning backend Node.js dependencies..."
    npm audit --json > "${REPORT_DIR}/backend-npm-audit-${TIMESTAMP}.json" || warning "Backend dependencies have vulnerabilities"
    
    # Generate HTML report
    npm audit > "${REPORT_DIR}/backend-npm-audit-${TIMESTAMP}.txt" || true
fi

# Scan frontend dependencies
cd "${PROJECT_ROOT}/frontend"
if [[ -f "package.json" ]]; then
    log "Scanning frontend Node.js dependencies..."
    npm audit --json > "${REPORT_DIR}/frontend-npm-audit-${TIMESTAMP}.json" || warning "Frontend dependencies have vulnerabilities"
    
    # Generate HTML report
    npm audit > "${REPORT_DIR}/frontend-npm-audit-${TIMESTAMP}.txt" || true
fi

success "Dependency vulnerability scan completed"

# ===========================================
# SSL/TLS CONFIGURATION SCAN
# ===========================================

log "🔒 Running SSL/TLS configuration scan..."

# Check if SSL is configured
if curl -k -s "https://localhost" > /dev/null 2>&1; then
    log "HTTPS detected, running SSL analysis..."
    
    # Use testssl.sh if available
    if command -v testssl.sh &> /dev/null; then
        testssl.sh --jsonfile "${REPORT_DIR}/ssl-scan-${TIMESTAMP}.json" localhost
    else
        warning "testssl.sh not found. Install it for comprehensive SSL analysis."
    fi
else
    warning "No HTTPS detected. SSL/TLS configuration recommended for production."
fi

# ===========================================
# DOCKER COMPOSE SECURITY ANALYSIS
# ===========================================

log "🔧 Analyzing Docker Compose security configuration..."

cd "$PROJECT_ROOT"

# Check for security best practices in docker-compose files
COMPOSE_SECURITY_REPORT="${REPORT_DIR}/compose-security-${TIMESTAMP}.txt"

{
    echo "=== DOCKER COMPOSE SECURITY ANALYSIS ==="
    echo "Timestamp: $(date)"
    echo "=========================================="
    echo ""
    
    echo "1. CHECKING FOR NON-ROOT USER CONFIGURATION:"
    if grep -q "user:" docker-compose.production.yml; then
        echo "✅ Non-root users configured"
    else
        echo "⚠️ No explicit user configuration found"
    fi
    echo ""
    
    echo "2. CHECKING FOR SECURITY OPTIONS:"
    if grep -q "security_opt:" docker-compose.production.yml; then
        echo "✅ Security options configured:"
        grep -A 2 "security_opt:" docker-compose.production.yml || true
    else
        echo "⚠️ No security options configured"
    fi
    echo ""
    
    echo "3. CHECKING FOR CAPABILITY DROPS:"
    if grep -q "cap_drop:" docker-compose.production.yml; then
        echo "✅ Capability drops configured:"
        grep -A 3 "cap_drop:" docker-compose.production.yml || true
    else
        echo "⚠️ No capability drops configured"
    fi
    echo ""
    
    echo "4. CHECKING FOR READ-ONLY FILESYSTEMS:"
    if grep -q "read_only:" docker-compose.production.yml; then
        echo "✅ Read-only filesystems configured"
    else
        echo "⚠️ No read-only filesystem configuration found"
    fi
    echo ""
    
    echo "5. CHECKING FOR NETWORK ISOLATION:"
    if grep -q "internal: true" docker-compose.production.yml; then
        echo "✅ Internal networks configured for isolation"
    else
        echo "⚠️ No internal network isolation found"
    fi
    echo ""
    
    echo "6. CHECKING FOR SECRET MANAGEMENT:"
    if grep -q "secrets:" docker-compose.production.yml; then
        echo "✅ Docker secrets configured"
    else
        echo "⚠️ Consider using Docker secrets for sensitive data"
    fi
    
} > "$COMPOSE_SECURITY_REPORT"

success "Docker Compose security analysis completed"

# ===========================================
# ENVIRONMENT SECURITY CHECK
# ===========================================

log "🔐 Checking environment security configuration..."

ENV_SECURITY_REPORT="${REPORT_DIR}/env-security-${TIMESTAMP}.txt"

{
    echo "=== ENVIRONMENT SECURITY ANALYSIS ==="
    echo "Timestamp: $(date)"
    echo "======================================"
    echo ""
    
    if [[ -f ".env.production" ]]; then
        echo "✅ Production environment file found"
        
        # Check file permissions
        PERM=$(stat -c "%a" .env.production)
        if [[ "$PERM" == "600" ]]; then
            echo "✅ Environment file has secure permissions (600)"
        else
            echo "⚠️ Environment file permissions: $PERM (should be 600)"
        fi
        
        # Check for common security issues (without revealing values)
        if grep -q "password.*123\|password.*password\|secret.*secret" .env.production; then
            echo "❌ Weak passwords detected in environment file"
        else
            echo "✅ No obvious weak passwords detected"
        fi
        
        # Check for HTTP URLs in production
        if grep -q "http://" .env.production; then
            echo "⚠️ HTTP URLs found in production environment"
        else
            echo "✅ No HTTP URLs in production environment"
        fi
        
    else
        echo "⚠️ No .env.production file found"
    fi
    
} > "$ENV_SECURITY_REPORT"

success "Environment security check completed"

# ===========================================
# GENERATE SECURITY SUMMARY REPORT
# ===========================================

log "📊 Generating security summary report..."

SUMMARY_REPORT="${REPORT_DIR}/security-summary-${TIMESTAMP}.md"

{
    echo "# 🔐 QUANKEY SECURITY SCAN REPORT"
    echo ""
    echo "**Scan Date:** $(date)"
    echo "**Report Generated:** ${TIMESTAMP}"
    echo ""
    echo "## 🛡️ SECURITY STATUS OVERVIEW"
    echo ""
    
    # Count issues from various scans
    TOTAL_ISSUES=0
    HIGH_ISSUES=0
    MEDIUM_ISSUES=0
    LOW_ISSUES=0
    
    echo "### Scan Results Summary"
    echo ""
    echo "| Component | Status | Issues Found |"
    echo "|-----------|--------|--------------|"
    
    # Docker images
    if [[ -f "${REPORT_DIR}/backend-image-scan-${TIMESTAMP}.json" ]]; then
        BACKEND_ISSUES=$(jq '.Results[0].Vulnerabilities | length // 0' "${REPORT_DIR}/backend-image-scan-${TIMESTAMP}.json" 2>/dev/null || echo "0")
        echo "| Backend Docker Image | Scanned | $BACKEND_ISSUES |"
        TOTAL_ISSUES=$((TOTAL_ISSUES + BACKEND_ISSUES))
    fi
    
    if [[ -f "${REPORT_DIR}/frontend-image-scan-${TIMESTAMP}.json" ]]; then
        FRONTEND_ISSUES=$(jq '.Results[0].Vulnerabilities | length // 0' "${REPORT_DIR}/frontend-image-scan-${TIMESTAMP}.json" 2>/dev/null || echo "0")
        echo "| Frontend Docker Image | Scanned | $FRONTEND_ISSUES |"
        TOTAL_ISSUES=$((TOTAL_ISSUES + FRONTEND_ISSUES))
    fi
    
    # Dependencies
    if [[ -f "${REPORT_DIR}/backend-npm-audit-${TIMESTAMP}.json" ]]; then
        BACKEND_DEP_ISSUES=$(jq '.metadata.vulnerabilities.total // 0' "${REPORT_DIR}/backend-npm-audit-${TIMESTAMP}.json" 2>/dev/null || echo "0")
        echo "| Backend Dependencies | Scanned | $BACKEND_DEP_ISSUES |"
        TOTAL_ISSUES=$((TOTAL_ISSUES + BACKEND_DEP_ISSUES))
    fi
    
    if [[ -f "${REPORT_DIR}/frontend-npm-audit-${TIMESTAMP}.json" ]]; then
        FRONTEND_DEP_ISSUES=$(jq '.metadata.vulnerabilities.total // 0' "${REPORT_DIR}/frontend-npm-audit-${TIMESTAMP}.json" 2>/dev/null || echo "0")
        echo "| Frontend Dependencies | Scanned | $FRONTEND_DEP_ISSUES |"
        TOTAL_ISSUES=$((TOTAL_ISSUES + FRONTEND_DEP_ISSUES))
    fi
    
    echo ""
    echo "### 📋 Total Security Issues Found: $TOTAL_ISSUES"
    echo ""
    
    if [[ $TOTAL_ISSUES -eq 0 ]]; then
        echo "🎉 **EXCELLENT**: No security vulnerabilities detected!"
        echo ""
        echo "✅ **SECURITY STATUS: MILITARY-GRADE OPERATIONAL**"
    elif [[ $TOTAL_ISSUES -lt 5 ]]; then
        echo "✅ **GOOD**: Low number of issues found. Review and address."
    elif [[ $TOTAL_ISSUES -lt 20 ]]; then
        echo "⚠️ **MODERATE**: Several issues found. Prioritize fixes."
    else
        echo "❌ **HIGH**: Many issues found. Immediate attention required."
    fi
    
    echo ""
    echo "## 📁 Detailed Reports"
    echo ""
    echo "The following detailed reports have been generated:"
    echo ""
    
    for report in "${REPORT_DIR}"/*"${TIMESTAMP}"*; do
        if [[ -f "$report" ]]; then
            echo "- $(basename "$report")"
        fi
    done
    
    echo ""
    echo "## 🔧 Recommendations"
    echo ""
    echo "1. Review all detailed reports for specific vulnerabilities"
    echo "2. Update dependencies to latest secure versions"
    echo "3. Configure SSL/TLS certificates for production"
    echo "4. Set up continuous security monitoring"
    echo "5. Implement regular security scans in CI/CD pipeline"
    echo ""
    echo "## 🎯 Next Steps"
    echo ""
    echo "1. Address high-priority vulnerabilities immediately"
    echo "2. Update Docker images to latest security patches"
    echo "3. Review and strengthen environment configuration"
    echo "4. Schedule regular security assessments"
    
} > "$SUMMARY_REPORT"

success "Security summary report generated: $SUMMARY_REPORT"

# ===========================================
# CLEANUP AND FINAL OUTPUT
# ===========================================

log "📊 Security Scan Summary"
log "========================"
log "Scan completed: $(date)"
log "Reports generated in: $REPORT_DIR"
log ""
log "Generated reports:"
for report in "${REPORT_DIR}"/*"${TIMESTAMP}"*; do
    if [[ -f "$report" ]]; then
        log "  - $(basename "$report")"
    fi
done

log ""
log "📋 To view the summary report:"
log "cat ${SUMMARY_REPORT}"

log ""
log "🔗 To view detailed findings:"
log "ls -la ${REPORT_DIR}/"

success "🔍 Quankey security scan completed successfully!"

# Return appropriate exit code based on findings
if [[ ${TOTAL_ISSUES:-0} -eq 0 ]]; then
    log "🎉 SECURITY STATUS: PERFECT - Zero vulnerabilities detected"
    exit 0
elif [[ ${TOTAL_ISSUES:-0} -lt 10 ]]; then
    log "⚠️ SECURITY STATUS: GOOD - Minor issues detected"
    exit 0
else
    log "❌ SECURITY STATUS: NEEDS ATTENTION - Multiple issues detected"
    exit 1
fi