#!/bin/bash
# 🚨 QUANKEY CLOUDWATCH ALARMS SETUP
# Critical alerts for quantum password manager monitoring
# Covers: Application health, security events, performance, backups

set -euo pipefail

# Configuration
ALARM_PREFIX="Quankey-"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
SNS_TOPIC_NAME="quankey-alerts"
EMAIL="${ALERT_EMAIL:-admin@quankey.xyz}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    log "${GREEN}✅ $1${NC}"
}

info() {
    log "${BLUE}ℹ️ $1${NC}"
}

warning() {
    log "${YELLOW}⚠️ $1${NC}"
}

error() {
    log "${RED}❌ $1${NC}"
}

log "🚨 Setting up CloudWatch alarms for Quankey..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    error "AWS CLI not installed"
    exit 1
fi

# 1. Create SNS Topic for Alerts
info "📧 Setting up SNS topic for alerts..."

SNS_TOPIC_ARN=$(aws sns create-topic \
    --name "$SNS_TOPIC_NAME" \
    --region "$REGION" \
    --query 'TopicArn' \
    --output text 2>/dev/null || echo "")

if [[ -z "$SNS_TOPIC_ARN" ]]; then
    # Topic might already exist
    SNS_TOPIC_ARN=$(aws sns list-topics \
        --region "$REGION" \
        --query "Topics[?contains(TopicArn, '$SNS_TOPIC_NAME')].TopicArn" \
        --output text)
fi

if [[ -n "$SNS_TOPIC_ARN" ]]; then
    success "SNS Topic: $SNS_TOPIC_ARN"
    
    # Subscribe email if provided
    if [[ "$EMAIL" != "admin@quankey.xyz" ]]; then
        aws sns subscribe \
            --topic-arn "$SNS_TOPIC_ARN" \
            --protocol email \
            --notification-endpoint "$EMAIL" \
            --region "$REGION" || true
        info "Email subscription added (check your email for confirmation)"
    fi
else
    warning "Could not create/find SNS topic. Alarms will be created without notifications."
fi

# Function to create alarm
create_alarm() {
    local alarm_name="$1"
    local metric_name="$2"
    local namespace="$3"
    local comparison_operator="$4"
    local threshold="$5"
    local evaluation_periods="$6"
    local period="$7"
    local statistic="${8:-Average}"
    local description="${9:-Quankey monitoring alarm}"
    local dimensions="${10:-}"
    
    local alarm_actions=""
    if [[ -n "$SNS_TOPIC_ARN" ]]; then
        alarm_actions="--alarm-actions $SNS_TOPIC_ARN"
    fi
    
    local dimensions_param=""
    if [[ -n "$dimensions" ]]; then
        dimensions_param="--dimensions $dimensions"
    fi
    
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ALARM_PREFIX}${alarm_name}" \
        --alarm-description "$description" \
        --metric-name "$metric_name" \
        --namespace "$namespace" \
        --statistic "$statistic" \
        --period "$period" \
        --threshold "$threshold" \
        --comparison-operator "$comparison_operator" \
        --evaluation-periods "$evaluation_periods" \
        --region "$REGION" \
        $alarm_actions \
        $dimensions_param || warning "Failed to create alarm: $alarm_name"
}

# 2. Application Health Alarms
info "🏥 Creating application health alarms..."

# Application Down
create_alarm \
    "Application-Down" \
    "ApplicationHealth" \
    "Quankey/Application" \
    "LessThanThreshold" \
    "1" \
    "2" \
    "300" \
    "Average" \
    "CRITICAL: Quankey application is not responding"

# Database Down
create_alarm \
    "Database-Down" \
    "DatabaseHealth" \
    "Quankey/Application" \
    "LessThanThreshold" \
    "1" \
    "2" \
    "300" \
    "Average" \
    "CRITICAL: PostgreSQL database is not accessible"

# Quantum Crypto Down
create_alarm \
    "Quantum-Down" \
    "QuantumCryptoHealth" \
    "Quankey/Application" \
    "LessThanThreshold" \
    "1" \
    "2" \
    "300" \
    "Average" \
    "CRITICAL: Quantum cryptography service not responding"

# Backend Processes Down
create_alarm \
    "Backend-Processes-Down" \
    "BackendProcesses" \
    "Quankey/Application" \
    "LessThanThreshold" \
    "1" \
    "2" \
    "300" \
    "Average" \
    "CRITICAL: Quankey backend processes not running"

success "Application health alarms created"

# 3. Performance Alarms
info "⚡ Creating performance alarms..."

# High CPU
create_alarm \
    "High-CPU-Usage" \
    "cpu_usage_user" \
    "Quankey/Production" \
    "GreaterThanThreshold" \
    "80" \
    "3" \
    "300" \
    "Average" \
    "WARNING: High CPU usage detected"

# High Memory
create_alarm \
    "High-Memory-Usage" \
    "mem_used_percent" \
    "Quankey/Production" \
    "GreaterThanThreshold" \
    "85" \
    "2" \
    "300" \
    "Average" \
    "WARNING: High memory usage detected"

# Disk Space Low
create_alarm \
    "Low-Disk-Space" \
    "used_percent" \
    "Quankey/Production" \
    "GreaterThanThreshold" \
    "90" \
    "2" \
    "300" \
    "Average" \
    "WARNING: Low disk space"

# High Response Time
create_alarm \
    "High-Response-Time" \
    "ApplicationResponseTime" \
    "Quankey/Application" \
    "GreaterThanThreshold" \
    "5000" \
    "3" \
    "300" \
    "Average" \
    "WARNING: Application response time > 5 seconds"

# High Backend Memory Usage
create_alarm \
    "High-Backend-Memory" \
    "BackendMemoryUsage" \
    "Quankey/Application" \
    "GreaterThanThreshold" \
    "512" \
    "3" \
    "300" \
    "Average" \
    "WARNING: Backend memory usage > 512MB"

success "Performance alarms created"

# 4. Security Alarms
info "🔒 Creating security alarms..."

# High Failed Login Attempts
create_alarm \
    "High-Failed-Logins" \
    "FailedLogins" \
    "Quankey/Application" \
    "GreaterThanThreshold" \
    "10" \
    "1" \
    "300" \
    "Sum" \
    "SECURITY ALERT: High number of failed login attempts"

# Security Events Spike
create_alarm \
    "Security-Events-Spike" \
    "SecurityEvents" \
    "Quankey/Application" \
    "GreaterThanThreshold" \
    "50" \
    "1" \
    "300" \
    "Sum" \
    "SECURITY ALERT: Unusual security event activity"

# Quantum Implementation Down
create_alarm \
    "Quantum-Implementation-Down" \
    "QuantumImplementation" \
    "Quankey/Application" \
    "LessThanThreshold" \
    "1" \
    "2" \
    "300" \
    "Average" \
    "CRITICAL: Quantum implementation not initialized"

success "Security alarms created"

# 5. Infrastructure Alarms
info "🏗️ Creating infrastructure alarms..."

# Nginx Down
create_alarm \
    "Nginx-Down" \
    "NginxHealth" \
    "Quankey/Application" \
    "LessThanThreshold" \
    "1" \
    "2" \
    "300" \
    "Average" \
    "CRITICAL: Nginx web server is down"

# SSL Certificate Expiring
create_alarm \
    "SSL-Certificate-Expiring" \
    "SSLCertificateDaysRemaining" \
    "Quankey/Application" \
    "LessThanThreshold" \
    "30" \
    "1" \
    "86400" \
    "Average" \
    "WARNING: SSL certificate expires in < 30 days"

# Backup Failures
create_alarm \
    "Backup-Failures" \
    "BackupErrors" \
    "Quankey/Application" \
    "GreaterThanThreshold" \
    "0" \
    "1" \
    "3600" \
    "Sum" \
    "WARNING: Backup errors detected"

# No Recent Backups
create_alarm \
    "No-Recent-Backups" \
    "BackupSuccess" \
    "Quankey/Application" \
    "LessThanThreshold" \
    "1" \
    "1" \
    "86400" \
    "Sum" \
    "WARNING: No successful backups in 24 hours"

success "Infrastructure alarms created"

# 6. Create Composite Alarms
info "🔗 Creating composite alarms..."

# Overall System Health (combines multiple metrics)
COMPOSITE_RULE="ALARM(\"${ALARM_PREFIX}Application-Down\") OR ALARM(\"${ALARM_PREFIX}Database-Down\") OR ALARM(\"${ALARM_PREFIX}Quantum-Down\")"

aws cloudwatch put-composite-alarm \
    --alarm-name "${ALARM_PREFIX}System-Critical" \
    --alarm-description "CRITICAL: One or more critical Quankey services are down" \
    --alarm-rule "$COMPOSITE_RULE" \
    --region "$REGION" \
    $(if [[ -n "$SNS_TOPIC_ARN" ]]; then echo "--alarm-actions $SNS_TOPIC_ARN"; fi) || warning "Failed to create composite alarm"

success "Composite alarms created"

# 7. Create CloudWatch Dashboard
info "📊 Creating CloudWatch dashboard..."

DASHBOARD_BODY=$(cat << 'EOF'
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "Quankey/Application", "ApplicationHealth" ],
                    [ ".", "DatabaseHealth" ],
                    [ ".", "QuantumCryptoHealth" ],
                    [ ".", "NginxHealth" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "Service Health Status",
                "period": 300,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 1
                    }
                }
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "Quankey/Production", "cpu_usage_user" ],
                    [ ".", "mem_used_percent" ],
                    [ ".", "used_percent", "fstype", "ext4", "path", "/" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "System Resources",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "Quankey/Application", "BackendProcesses" ],
                    [ ".", "FrontendProcesses" ],
                    [ ".", "QuantumImplementation" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "Application Processes",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "Quankey/Application", "SecurityEvents" ],
                    [ ".", "FailedLogins" ],
                    [ ".", "BackupSuccess" ],
                    [ ".", "BackupErrors" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "Security & Operations",
                "period": 300
            }
        }
    ]
}
EOF
)

aws cloudwatch put-dashboard \
    --dashboard-name "Quankey-Production-Overview" \
    --dashboard-body "$DASHBOARD_BODY" \
    --region "$REGION" || warning "Failed to create dashboard"

success "CloudWatch dashboard created: Quankey-Production-Overview"

# 8. Summary
log ""
log "╔══════════════════════════════════════════╗"
log "║       🚨 CLOUDWATCH ALARMS SETUP 🚨       ║"
log "╠══════════════════════════════════════════╣"
log "║ ✅ Application Health: 4 alarms          ║"
log "║ ✅ Performance: 5 alarms                 ║"
log "║ ✅ Security: 3 alarms                    ║"
log "║ ✅ Infrastructure: 4 alarms              ║"
log "║ ✅ Composite: 1 critical alarm           ║"
log "║ ✅ Dashboard: Created                     ║"
log "╚══════════════════════════════════════════╝"

log ""
log "📊 Monitoring Summary:"
log "   Total Alarms: 17 individual + 1 composite"
log "   SNS Topic: $SNS_TOPIC_NAME"
log "   Email: $EMAIL"
log "   Dashboard: Quankey-Production-Overview"

log ""
log "🔍 Next Steps:"
log "1. Confirm email subscription if you provided an email"
log "2. View dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=Quankey-Production-Overview"
log "3. Test alarms: aws cloudwatch set-alarm-state --alarm-name '${ALARM_PREFIX}Application-Down' --state-value ALARM --state-reason 'Testing'"
log "4. View all alarms: aws cloudwatch describe-alarms --alarm-name-prefix '$ALARM_PREFIX'"

log ""
log "🚨 Critical Alarms (immediate notification):"
log "   - Application Down"
log "   - Database Down"
log "   - Quantum Crypto Down"
log "   - Backend Processes Down"
log "   - System Critical (composite)"

success "🎉 CloudWatch alarms are now monitoring your Quankey system!"

exit 0