#!/bin/bash
# QUANKEY COMPREHENSIVE HEALTH CHECK SCRIPT
# Monitors all critical components of the Passkeys + PQC architecture

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Status tracking
OVERALL_STATUS=0
CHECKS_PASSED=0
CHECKS_TOTAL=0

# Helper functions
print_header() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    QUANKEY HEALTH CHECK v7.0                     ║${NC}"
    echo -e "${BLUE}║                 Passkeys + PQC Architecture                      ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_status() {
    local service=$1
    local status=$2
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    if [ $status -eq 0 ]; then
        echo -e "  ${GREEN}✅ $service: HEALTHY${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "  ${RED}❌ $service: FAILED${NC}"
        OVERALL_STATUS=1
    fi
}

check_warning() {
    local service=$1
    local message=$2
    echo -e "  ${YELLOW}⚠️  $service: $message${NC}"
}

print_section() {
    echo -e "\n${CYAN}$1${NC}"
    echo "═══════════════════════════════════════"
}

# Main health check function
main_health_check() {
    print_header
    
    # System Information
    print_section "📊 SYSTEM OVERVIEW"
    echo "🕐 Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')"
    echo "🖥️  Hostname: $(hostname)"
    echo "🔧 Uptime: $(uptime -p)"
    echo "👤 User: $(whoami)"
    echo "📍 PWD: $(pwd)"
    
    # 1. PM2 Process Status
    print_section "🔄 PM2 PROCESS MANAGER"
    if command -v pm2 >/dev/null 2>&1; then
        pm2 status --no-color
        
        # Check individual processes
        backend_status=$(pm2 jlist | jq -r '.[] | select(.name=="quankey-backend") | .pm2_env.status' 2>/dev/null || echo "stopped")
        frontend_status=$(pm2 jlist | jq -r '.[] | select(.name=="quankey-frontend") | .pm2_env.status' 2>/dev/null || echo "stopped")
        
        if [ "$backend_status" = "online" ]; then
            check_status "Backend Process" 0
        else
            check_status "Backend Process" 1
        fi
        
        if [ "$frontend_status" = "online" ]; then
            check_status "Frontend Process" 0
        else
            check_status "Frontend Process" 1
        fi
    else
        echo -e "  ${RED}❌ PM2 not installed${NC}"
        OVERALL_STATUS=1
    fi
    
    # 2. Application Health Endpoints
    print_section "🌐 APPLICATION HEALTH"
    
    # Backend health check
    if curl -f -s --max-time 10 http://localhost:5000/health >/dev/null 2>&1; then
        check_status "Backend HTTP (Port 5000)" 0
    else
        check_status "Backend HTTP (Port 5000)" 1
    fi
    
    # Frontend availability
    if curl -f -s --max-time 10 http://localhost:3000 >/dev/null 2>&1; then
        check_status "Frontend HTTP (Port 3000)" 0
    else
        check_status "Frontend HTTP (Port 3000)" 1
    fi
    
    # API endpoints test
    api_response=$(curl -s --max-time 10 -w "%{http_code}" http://localhost:5000/api/health -o /dev/null 2>/dev/null)
    if [ "$api_response" = "200" ]; then
        check_status "API Health Endpoint" 0
    else
        check_status "API Health Endpoint" 1
    fi
    
    # 3. Database Connectivity
    print_section "🗄️ DATABASE STATUS"
    
    # PostgreSQL service
    if systemctl is-active --quiet postgresql; then
        check_status "PostgreSQL Service" 0
    else
        check_status "PostgreSQL Service" 1
    fi
    
    # Database connection test
    if pg_isready -h localhost -p 5432 -U quankey >/dev/null 2>&1; then
        check_status "Database Connection" 0
        
        # Test actual database access
        if PGPASSWORD="QuankeySecurePass2025!" psql -h localhost -U quankey -d quankey -c "SELECT 1;" >/dev/null 2>&1; then
            check_status "Database Access" 0
        else
            check_status "Database Access" 1
        fi
    else
        check_status "Database Connection" 1
    fi
    
    # 4. Web Server Status
    print_section "🌍 NGINX WEB SERVER"
    
    if systemctl is-active --quiet nginx; then
        check_status "Nginx Service" 0
        
        # Test Nginx configuration
        if nginx -t >/dev/null 2>&1; then
            check_status "Nginx Configuration" 0
        else
            check_status "Nginx Configuration" 1
        fi
        
        # Test external HTTP access
        if curl -f -s --max-time 10 http://localhost >/dev/null 2>&1; then
            check_status "HTTP Access (Port 80)" 0
        else
            check_status "HTTP Access (Port 80)" 1
        fi
        
        # Test HTTPS if certificate exists
        if [ -f /etc/letsencrypt/live/quankey.xyz/fullchain.pem ]; then
            if curl -f -s --max-time 10 https://localhost >/dev/null 2>&1; then
                check_status "HTTPS Access (Port 443)" 0
            else
                check_status "HTTPS Access (Port 443)" 1
            fi
        else
            check_warning "HTTPS Certificate" "Not found or not configured"
        fi
    else
        check_status "Nginx Service" 1
    fi
    
    # 5. Security & SSL
    print_section "🔒 SECURITY STATUS"
    
    # Firewall status
    if ufw status | grep -q "Status: active"; then
        check_status "UFW Firewall" 0
    else
        check_status "UFW Firewall" 1
    fi
    
    # SSL Certificate validation
    if [ -f /etc/letsencrypt/live/quankey.xyz/fullchain.pem ]; then
        cert_expiry=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/quankey.xyz/fullchain.pem 2>/dev/null | cut -d= -f2)
        if [ $? -eq 0 ]; then
            check_status "SSL Certificate Valid" 0
            echo "    📅 Expires: $cert_expiry"
        else
            check_status "SSL Certificate Valid" 1
        fi
    else
        check_warning "SSL Certificate" "Not found"
    fi
    
    # 6. File System & Resources
    print_section "💾 SYSTEM RESOURCES"
    
    # Disk space check (warn if >80% full)
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        check_status "Disk Space (<80%)" 0
        echo "    📊 Usage: ${disk_usage}%"
    else
        check_status "Disk Space (<80%)" 1
        echo "    📊 Usage: ${disk_usage}% (WARNING: High usage)"
    fi
    
    # Memory check (warn if >85% used)
    mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$mem_usage" -lt 85 ]; then
        check_status "Memory Usage (<85%)" 0
        echo "    🧠 Usage: ${mem_usage}%"
    else
        check_status "Memory Usage (<85%)" 1
        echo "    🧠 Usage: ${mem_usage}% (WARNING: High usage)"
    fi
    
    # Check critical directories exist
    critical_dirs=(
        "/home/ubuntu/quankey-mvp"
        "/home/ubuntu/quankey-mvp/backend"
        "/home/ubuntu/quankey-mvp/frontend"
        "/home/ubuntu/quankey-mvp/logs"
    )
    
    for dir in "${critical_dirs[@]}"; do
        if [ -d "$dir" ]; then
            check_status "Directory: $dir" 0
        else
            check_status "Directory: $dir" 1
        fi
    done
    
    # 7. Application-specific Checks
    print_section "🔐 QUANKEY SPECIFIC CHECKS"
    
    # Environment file exists
    if [ -f "/home/ubuntu/quankey-mvp/backend/.env" ]; then
        check_status "Backend .env File" 0
        
        # Check critical environment variables
        env_vars=("DATABASE_URL" "JWT_SECRET" "DB_ENCRYPTION_KEY" "WEBAUTHN_RP_ID")
        for var in "${env_vars[@]}"; do
            if grep -q "^$var=" /home/ubuntu/quankey-mvp/backend/.env 2>/dev/null; then
                check_status "Env Var: $var" 0
            else
                check_status "Env Var: $var" 1
            fi
        done
    else
        check_status "Backend .env File" 1
    fi
    
    # Check if quantum crypto is working (if backend is running)
    if [ "$backend_status" = "online" ]; then
        quantum_test=$(curl -s --max-time 5 http://localhost:5000/api/health/quantum 2>/dev/null || echo "failed")
        if [[ "$quantum_test" =~ "quantum" ]] || [[ "$quantum_test" =~ "ML-KEM" ]]; then
            check_status "Quantum Crypto Available" 0
        else
            check_status "Quantum Crypto Available" 1
        fi
    fi
    
    # 8. Log Analysis
    print_section "📋 LOG ANALYSIS"
    
    # Check for recent errors in PM2 logs
    if [ -f "/home/ubuntu/quankey-mvp/logs/backend-error.log" ]; then
        recent_errors=$(tail -n 100 /home/ubuntu/quankey-mvp/logs/backend-error.log 2>/dev/null | grep -i "error\|exception\|fatal" | wc -l)
        if [ "$recent_errors" -lt 5 ]; then
            check_status "Backend Error Rate (<5 recent)" 0
        else
            check_status "Backend Error Rate (<5 recent)" 1
            echo "    ⚠️  Found $recent_errors recent errors"
        fi
    else
        check_warning "Backend Error Log" "Log file not found"
    fi
    
    # Check system log for critical issues
    critical_system_errors=$(journalctl --since "1 hour ago" --priority=err --no-pager 2>/dev/null | wc -l)
    if [ "$critical_system_errors" -lt 5 ]; then
        check_status "System Error Rate (<5/hour)" 0
    else
        check_status "System Error Rate (<5/hour)" 1
        echo "    ⚠️  Found $critical_system_errors critical system errors in last hour"
    fi
    
    # 9. Performance Metrics
    print_section "📈 PERFORMANCE METRICS"
    
    # Load average
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    cpu_cores=$(nproc)
    load_threshold=$(echo "$cpu_cores * 0.8" | bc -l | cut -d. -f1)
    
    if (( $(echo "$load_avg < $load_threshold" | bc -l) )); then
        check_status "CPU Load Average" 0
        echo "    📊 Load: $load_avg (${cpu_cores} cores)"
    else
        check_status "CPU Load Average" 1
        echo "    📊 Load: $load_avg (${cpu_cores} cores) - HIGH"
    fi
    
    # Network connectivity
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        check_status "Internet Connectivity" 0
    else
        check_status "Internet Connectivity" 1
    fi
    
    # 10. Backup Status
    print_section "💾 BACKUP STATUS"
    
    if [ -f "/home/ubuntu/backup-quankey.sh" ]; then
        check_status "Backup Script Exists" 0
        
        # Check if backup directory exists and has recent backups
        if [ -d "/home/ubuntu/backups" ]; then
            recent_backups=$(find /home/ubuntu/backups -name "*.sql.gz" -mtime -1 | wc -l)
            if [ "$recent_backups" -gt 0 ]; then
                check_status "Recent Backup Available" 0
                echo "    💾 Found $recent_backups backup(s) from last 24 hours"
            else
                check_warning "Recent Backup" "No backups found from last 24 hours"
            fi
        else
            check_warning "Backup Directory" "Directory /home/ubuntu/backups not found"
        fi
    else
        check_status "Backup Script Exists" 1
    fi
    
    # Final Summary
    print_section "📊 HEALTH CHECK SUMMARY"
    
    success_rate=$(echo "scale=1; $CHECKS_PASSED * 100 / $CHECKS_TOTAL" | bc -l)
    
    echo "Total Checks: $CHECKS_TOTAL"
    echo "Checks Passed: $CHECKS_PASSED"
    echo "Success Rate: ${success_rate}%"
    echo ""
    
    if [ $OVERALL_STATUS -eq 0 ]; then
        echo -e "${GREEN}🎉 OVERALL STATUS: HEALTHY${NC}"
        echo -e "${GREEN}✅ All critical systems are operational${NC}"
    else
        echo -e "${RED}🚨 OVERALL STATUS: ISSUES DETECTED${NC}"
        echo -e "${RED}❌ Some systems require attention${NC}"
        echo ""
        echo "🔧 Recommended actions:"
        echo "  • Check failed services with: systemctl status <service>"
        echo "  • Review PM2 logs with: pm2 logs"
        echo "  • Check system logs with: journalctl -xe"
        echo "  • Restart failed processes with: pm2 restart <app>"
    fi
    
    echo ""
    echo "🔍 For detailed logs:"
    echo "  • Backend logs: tail -f /home/ubuntu/quankey-mvp/logs/backend-*.log"
    echo "  • Frontend logs: tail -f /home/ubuntu/quankey-mvp/logs/frontend-*.log"
    echo "  • PM2 monitor: pm2 monit"
    echo "  • System logs: journalctl -f"
    
    exit $OVERALL_STATUS
}

# Additional utility functions
quick_status() {
    echo "🚀 Quankey Quick Status:"
    pm2 status --no-color | grep -E "(quankey-backend|quankey-frontend)"
    systemctl is-active postgresql nginx | xargs -I {} echo "📦 Service {}: ACTIVE"
}

restart_all() {
    echo "🔄 Restarting all Quankey services..."
    pm2 restart all
    sudo systemctl reload nginx
    echo "✅ All services restarted"
}

# Command line options
case "${1:-full}" in
    "quick"|"-q"|"--quick")
        quick_status
        ;;
    "restart"|"-r"|"--restart")
        restart_all
        ;;
    "full"|""|"-f"|"--full")
        main_health_check
        ;;
    "help"|"-h"|"--help")
        echo "Quankey Health Check Script"
        echo ""
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  full, -f, --full    Complete health check (default)"
        echo "  quick, -q, --quick  Quick status check"
        echo "  restart, -r, --restart  Restart all services"
        echo "  help, -h, --help    Show this help message"
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use '$0 help' for available options"
        exit 1
        ;;
esac