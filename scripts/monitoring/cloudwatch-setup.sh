#!/bin/bash
# ☁️ QUANKEY CLOUDWATCH MONITORING SETUP
# Comprehensive monitoring for quantum password manager
# Tracks: Application health, quantum crypto, security events, performance

set -euo pipefail

# Configuration
APP_NAME="quankey"
ENVIRONMENT="${ENVIRONMENT:-production}"
LOG_GROUP_PREFIX="/aws/ec2/quankey"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

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

log "🚀 Setting up CloudWatch monitoring for Quankey..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    error "AWS CLI not installed. Please install AWS CLI v2"
    exit 1
fi

# Test AWS credentials
if ! aws sts get-caller-identity &>/dev/null; then
    error "AWS credentials not configured. Run 'aws configure'"
    exit 1
fi

success "AWS CLI configured and credentials verified"

# 1. Create CloudWatch Log Groups
info "📋 Creating CloudWatch log groups..."

LOG_GROUPS=(
    "${LOG_GROUP_PREFIX}/application"      # Application logs
    "${LOG_GROUP_PREFIX}/security"        # Security events
    "${LOG_GROUP_PREFIX}/quantum"         # Quantum crypto metrics
    "${LOG_GROUP_PREFIX}/backup"          # Backup operations
    "${LOG_GROUP_PREFIX}/nginx"          # Nginx access/error logs
    "${LOG_GROUP_PREFIX}/system"         # System metrics
)

for log_group in "${LOG_GROUPS[@]}"; do
    if aws logs describe-log-groups --log-group-name-prefix "$log_group" --region "$REGION" | grep -q "logGroupName"; then
        success "Log group exists: $log_group"
    else
        aws logs create-log-group \
            --log-group-name "$log_group" \
            --region "$REGION" \
            --tags "Application=quankey,Environment=$ENVIRONMENT,Purpose=monitoring"
        
        # Set retention policy (90 days)
        aws logs put-retention-policy \
            --log-group-name "$log_group" \
            --retention-in-days 90 \
            --region "$REGION"
        
        success "Created log group: $log_group"
    fi
done

# 2. Install CloudWatch Agent
info "📦 Installing CloudWatch Agent..."

if ! command -v /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl &> /dev/null; then
    # Download and install CloudWatch Agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb
    sudo dpkg -i -E /tmp/amazon-cloudwatch-agent.deb
    rm /tmp/amazon-cloudwatch-agent.deb
    success "CloudWatch Agent installed"
else
    success "CloudWatch Agent already installed"
fi

# 3. Create CloudWatch Agent Configuration
info "⚙️ Creating CloudWatch Agent configuration..."

AGENT_CONFIG="/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"

cat << EOF | sudo tee "$AGENT_CONFIG" > /dev/null
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "metrics": {
    "namespace": "Quankey/Production",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60,
        "totalcpu": true
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "diskio": {
        "measurement": [
          "io_time",
          "read_bytes",
          "write_bytes",
          "reads",
          "writes"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent",
          "mem_available_percent"
        ],
        "metrics_collection_interval": 60
      },
      "netstat": {
        "measurement": [
          "tcp_established",
          "tcp_time_wait"
        ],
        "metrics_collection_interval": 60
      },
      "swap": {
        "measurement": [
          "swap_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/quankey/application.log",
            "log_group_name": "${LOG_GROUP_PREFIX}/application",
            "log_stream_name": "{instance_id}-application",
            "retention_in_days": 90,
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/quankey/security.log",
            "log_group_name": "${LOG_GROUP_PREFIX}/security",
            "log_stream_name": "{instance_id}-security",
            "retention_in_days": 90,
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/quankey/backup.log",
            "log_group_name": "${LOG_GROUP_PREFIX}/backup",
            "log_stream_name": "{instance_id}-backup",
            "retention_in_days": 90,
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "${LOG_GROUP_PREFIX}/nginx",
            "log_stream_name": "{instance_id}-nginx-access",
            "retention_in_days": 90,
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "${LOG_GROUP_PREFIX}/nginx",
            "log_stream_name": "{instance_id}-nginx-error",
            "retention_in_days": 90,
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "${LOG_GROUP_PREFIX}/system",
            "log_stream_name": "{instance_id}-syslog",
            "retention_in_days": 30,
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
EOF

success "CloudWatch Agent configuration created"

# 4. Create custom metrics script
info "📊 Creating custom metrics collection script..."

METRICS_SCRIPT="/usr/local/bin/quankey-metrics"
cat << 'EOF' | sudo tee "$METRICS_SCRIPT" > /dev/null
#!/bin/bash
# Quankey Custom Metrics Collection
# Sends application-specific metrics to CloudWatch

set -euo pipefail

NAMESPACE="Quankey/Application"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

# Function to send metric
send_metric() {
    local metric_name="$1"
    local value="$2"
    local unit="${3:-Count}"
    local dimensions="${4:-}"
    
    if [[ -n "$dimensions" ]]; then
        aws cloudwatch put-metric-data \
            --namespace "$NAMESPACE" \
            --region "$REGION" \
            --metric-data \
                MetricName="$metric_name",Value="$value",Unit="$unit",Dimensions="$dimensions" \
            &>/dev/null
    else
        aws cloudwatch put-metric-data \
            --namespace "$NAMESPACE" \
            --region "$REGION" \
            --metric-data \
                MetricName="$metric_name",Value="$value",Unit="$unit" \
            &>/dev/null
    fi
}

# 1. Application Health Check
if curl -sf http://localhost:5000/health &>/dev/null; then
    send_metric "ApplicationHealth" 1 "Count"
    send_metric "ApplicationResponseTime" "$(curl -w '%{time_total}' -s -o /dev/null http://localhost:5000/health | cut -d. -f1)" "Milliseconds"
else
    send_metric "ApplicationHealth" 0 "Count"
fi

# 2. Database Connection Check
if pg_isready -h localhost -p 5432 &>/dev/null; then
    send_metric "DatabaseHealth" 1 "Count"
else
    send_metric "DatabaseHealth" 0 "Count"
fi

# 3. PM2 Process Check
if command -v pm2 &>/dev/null; then
    QUANKEY_PROCESSES=$(pm2 jlist | jq -r '.[] | select(.name=="quankey") | .pm2_env.status' | grep -c "online" || echo 0)
    FRONTEND_PROCESSES=$(pm2 jlist | jq -r '.[] | select(.name=="quankey-frontend") | .pm2_env.status' | grep -c "online" || echo 0)
    
    send_metric "BackendProcesses" "$QUANKEY_PROCESSES" "Count"
    send_metric "FrontendProcesses" "$FRONTEND_PROCESSES" "Count"
    
    # Memory usage
    if [[ $QUANKEY_PROCESSES -gt 0 ]]; then
        MEMORY_USAGE=$(pm2 jlist | jq -r '.[] | select(.name=="quankey") | .pm2_env.axm_monitor.memory.value' | head -1)
        if [[ -n "$MEMORY_USAGE" && "$MEMORY_USAGE" != "null" ]]; then
            send_metric "BackendMemoryUsage" "$((MEMORY_USAGE / 1024 / 1024))" "Megabytes"
        fi
    fi
fi

# 4. Nginx Status
if systemctl is-active nginx &>/dev/null; then
    send_metric "NginxHealth" 1 "Count"
else
    send_metric "NginxHealth" 0 "Count"
fi

# 5. SSL Certificate Check
if command -v openssl &>/dev/null; then
    CERT_DAYS=$(echo | openssl s_client -servername quankey.xyz -connect quankey.xyz:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2 | xargs -I {} date -d "{}" +%s)
    if [[ -n "$CERT_DAYS" ]]; then
        CURRENT_TIME=$(date +%s)
        DAYS_REMAINING=$(( (CERT_DAYS - CURRENT_TIME) / 86400 ))
        send_metric "SSLCertificateDaysRemaining" "$DAYS_REMAINING" "Count"
    fi
fi

# 6. Backup Status
if [[ -f "/var/log/quankey/backup.log" ]]; then
    RECENT_BACKUPS=$(grep -c "✅ Backup completed successfully" /var/log/quankey/backup.log | tail -1 || echo 0)
    BACKUP_ERRORS=$(grep -c "❌" /var/log/quankey/backup.log | tail -1 || echo 0)
    
    send_metric "BackupSuccess" "$RECENT_BACKUPS" "Count"
    send_metric "BackupErrors" "$BACKUP_ERRORS" "Count"
fi

# 7. Quantum Crypto Metrics (if quantum service responds)
if curl -sf http://localhost:5000/api/quantum/status &>/dev/null; then
    send_metric "QuantumCryptoHealth" 1 "Count"
    
    # Extract quantum status
    QUANTUM_STATUS=$(curl -s http://localhost:5000/api/quantum/status | jq -r '.data.validation.initialized // false')
    if [[ "$QUANTUM_STATUS" == "true" ]]; then
        send_metric "QuantumImplementation" 1 "Count"
    else
        send_metric "QuantumImplementation" 0 "Count"
    fi
else
    send_metric "QuantumCryptoHealth" 0 "Count"
fi

# 8. Security Events (from audit logs)
if [[ -f "/var/log/quankey/security.log" ]]; then
    # Count recent security events (last hour)
    RECENT_EVENTS=$(grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" /var/log/quankey/security.log | wc -l || echo 0)
    send_metric "SecurityEvents" "$RECENT_EVENTS" "Count"
    
    # Failed login attempts
    FAILED_LOGINS=$(grep -c "AUTHENTICATION_FAILURE" /var/log/quankey/security.log | tail -1 || echo 0)
    send_metric "FailedLogins" "$FAILED_LOGINS" "Count"
fi

exit 0
EOF

sudo chmod +x "$METRICS_SCRIPT"
success "Custom metrics script created: $METRICS_SCRIPT"

# 5. Start CloudWatch Agent
info "🚀 Starting CloudWatch Agent..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c "file:$AGENT_CONFIG" \
    -s

success "CloudWatch Agent started successfully"

# 6. Setup cron for custom metrics
info "⏰ Setting up custom metrics collection..."
CRON_ENTRY="*/5 * * * * /usr/local/bin/quankey-metrics"

# Remove existing entries
crontab -l 2>/dev/null | grep -v "quankey-metrics" | crontab - 2>/dev/null || true

# Add new entry
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

success "Custom metrics collection scheduled (every 5 minutes)"

# 7. Test metrics collection
info "🧪 Testing metrics collection..."
if sudo -u $(whoami) /usr/local/bin/quankey-metrics; then
    success "Metrics collection test successful"
else
    warning "Metrics collection test failed (may work after application starts)"
fi

# 8. Summary
log ""
log "╔══════════════════════════════════════════╗"
log "║      ☁️ CLOUDWATCH SETUP COMPLETE ☁️      ║"
log "╠══════════════════════════════════════════╣"
log "║ ✅ Log Groups: Created                    ║"
log "║ ✅ CloudWatch Agent: Running              ║"
log "║ ✅ Custom Metrics: Every 5 min           ║"
log "║ ✅ Log Retention: 90 days                ║"
log "║ ✅ System Metrics: CPU, Memory, Disk     ║"
log "║ ✅ Application Metrics: Health, Quantum  ║"
log "╚══════════════════════════════════════════╝"

log ""
log "📊 Monitoring Overview:"
log "   Namespace: Quankey/Production & Quankey/Application"
log "   Log Groups: ${#LOG_GROUPS[@]} created"
log "   Metrics Collection: Every 60s (system), 5min (custom)"
log "   Region: $REGION"

log ""
log "🔍 Next Steps:"
log "1. Verify CloudWatch console: https://console.aws.amazon.com/cloudwatch/"
log "2. Create CloudWatch dashboard: aws cloudwatch put-dashboard"
log "3. Setup alarms: aws cloudwatch put-metric-alarm"
log "4. Test log streaming: tail -f /var/log/quankey/application.log"

log ""
log "📱 Useful Commands:"
log "   Check agent status: sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -m ec2 -q"
log "   View metrics: aws cloudwatch list-metrics --namespace 'Quankey/Application'"
log "   Test custom metrics: sudo $METRICS_SCRIPT"

success "🎉 CloudWatch monitoring is now active!"

exit 0