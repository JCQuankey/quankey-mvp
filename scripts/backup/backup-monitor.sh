#!/bin/bash
# 📊 QUANKEY BACKUP MONITORING & HEALTH CHECK
# Monitors backup health, S3 storage, and alerts on issues

set -euo pipefail

# Configuration
S3_BUCKET="${S3_BUCKET:-quankey-backups-prod}"
MAX_BACKUP_AGE_HOURS=${MAX_BACKUP_AGE_HOURS:-36}  # Alert if no backup in 36h
MIN_BACKUP_SIZE_MB=${MIN_BACKUP_SIZE_MB:-1}       # Alert if backup too small
WEBHOOK_URL="${BACKUP_WEBHOOK_URL:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    log "${GREEN}✅ $1${NC}"
}

warning() {
    log "${YELLOW}⚠️ $1${NC}"
}

error() {
    log "${RED}❌ $1${NC}"
}

# Send notification
send_notification() {
    local message="$1"
    local level="${2:-info}"
    
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"$level: $message\",
                \"level\": \"$level\",
                \"service\": \"quankey-backup-monitor\"
            }" &>/dev/null || true
    fi
}

log "🔍 Starting Quankey backup health check..."

# Check AWS CLI availability
if ! command -v aws &> /dev/null; then
    error "AWS CLI not installed"
    send_notification "AWS CLI not available on backup server" "error"
    exit 1
fi

# Check S3 bucket access
if ! aws s3 ls "s3://$S3_BUCKET/" &>/dev/null; then
    error "Cannot access S3 bucket: $S3_BUCKET"
    send_notification "S3 bucket access failed: $S3_BUCKET" "error"
    exit 1
fi

success "S3 bucket accessible"

# Get latest backup info
log "📋 Analyzing backup history..."

LATEST_BACKUP=$(aws s3 ls "s3://$S3_BUCKET/backups/postgresql/" | \
    grep "\.encrypted$" | \
    sort -k1,2 -r | \
    head -1)

if [[ -z "$LATEST_BACKUP" ]]; then
    error "No backups found in S3"
    send_notification "No backups found in S3 bucket" "error"
    exit 1
fi

# Parse latest backup details
BACKUP_DATE=$(echo "$LATEST_BACKUP" | awk '{print $1" "$2}')
BACKUP_SIZE=$(echo "$LATEST_BACKUP" | awk '{print $3}')
BACKUP_FILE=$(echo "$LATEST_BACKUP" | awk '{print $4}')
BACKUP_SIZE_MB=$((BACKUP_SIZE / 1024 / 1024))

success "Latest backup: $BACKUP_FILE ($BACKUP_SIZE_MB MB)"

# Calculate backup age
BACKUP_TIMESTAMP=$(date -d "$BACKUP_DATE" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$BACKUP_DATE" +%s)
CURRENT_TIMESTAMP=$(date +%s)
BACKUP_AGE_HOURS=$(( (CURRENT_TIMESTAMP - BACKUP_TIMESTAMP) / 3600 ))

log "📅 Backup age: $BACKUP_AGE_HOURS hours"

# Health checks
HEALTH_STATUS="healthy"
ISSUES=()

# Check backup age
if [[ $BACKUP_AGE_HOURS -gt $MAX_BACKUP_AGE_HOURS ]]; then
    error "Backup is too old: $BACKUP_AGE_HOURS hours (max: $MAX_BACKUP_AGE_HOURS)"
    HEALTH_STATUS="unhealthy"
    ISSUES+=("Backup too old: ${BACKUP_AGE_HOURS}h")
else
    success "Backup age is acceptable: $BACKUP_AGE_HOURS hours"
fi

# Check backup size
if [[ $BACKUP_SIZE_MB -lt $MIN_BACKUP_SIZE_MB ]]; then
    error "Backup size too small: $BACKUP_SIZE_MB MB (min: $MIN_BACKUP_SIZE_MB MB)"
    HEALTH_STATUS="unhealthy"
    ISSUES+=("Backup too small: ${BACKUP_SIZE_MB}MB")
else
    success "Backup size is acceptable: $BACKUP_SIZE_MB MB"
fi

# Count total backups
TOTAL_BACKUPS=$(aws s3 ls "s3://$S3_BUCKET/backups/postgresql/" | grep "\.encrypted$" | wc -l)
success "Total backups in S3: $TOTAL_BACKUPS"

# Calculate storage usage
TOTAL_SIZE=$(aws s3 ls "s3://$S3_BUCKET/backups/postgresql/" --summarize | \
    grep "Total Size:" | awk '{print $3}')
TOTAL_SIZE_MB=$((TOTAL_SIZE / 1024 / 1024))
success "Total storage used: $TOTAL_SIZE_MB MB"

# Check backup frequency (last 7 days)
log "📈 Analyzing backup frequency..."
RECENT_BACKUPS=$(aws s3 ls "s3://$S3_BUCKET/backups/postgresql/" | \
    awk -v date="$(date -d '7 days ago' '+%Y-%m-%d' 2>/dev/null || date -v-7d '+%Y-%m-%d')" '$1 >= date' | \
    wc -l)

if [[ $RECENT_BACKUPS -lt 3 ]]; then
    warning "Low backup frequency: only $RECENT_BACKUPS backups in last 7 days"
    ISSUES+=("Low frequency: ${RECENT_BACKUPS} backups in 7 days")
else
    success "Good backup frequency: $RECENT_BACKUPS backups in last 7 days"
fi

# Test restore capability (metadata check)
log "🔄 Testing restore readiness..."
METADATA_FILE="${BACKUP_FILE%.encrypted}.meta"
if aws s3 ls "s3://$S3_BUCKET/backups/postgresql/metadata/$METADATA_FILE" &>/dev/null; then
    success "Backup metadata available for restore"
else
    warning "Backup metadata missing (non-critical)"
fi

# Check local backup logs
LOG_FILE="/var/log/quankey/backup.log"
if [[ -f "$LOG_FILE" ]]; then
    RECENT_ERRORS=$(tail -100 "$LOG_FILE" | grep -c "❌" || true)
    if [[ $RECENT_ERRORS -gt 0 ]]; then
        warning "Found $RECENT_ERRORS recent backup errors in logs"
        ISSUES+=("${RECENT_ERRORS} errors in recent logs")
    else
        success "No recent errors in backup logs"
    fi
fi

# Generate health report
log ""
log "╔══════════════════════════════════════════╗"
log "║      📊 BACKUP HEALTH REPORT 📊           ║"
log "╠══════════════════════════════════════════╣"

if [[ "$HEALTH_STATUS" == "healthy" ]]; then
    log "║ Status: ${GREEN}HEALTHY${NC}                        ║"
else
    log "║ Status: ${RED}UNHEALTHY${NC}                      ║"
fi

log "║ Latest Backup: ${BACKUP_AGE_HOURS}h ago ($BACKUP_SIZE_MB MB)     ║"
log "║ Total Backups: $TOTAL_BACKUPS                      ║"
log "║ Storage Used: $TOTAL_SIZE_MB MB                ║"
log "║ Recent Frequency: $RECENT_BACKUPS/week            ║"
log "╚══════════════════════════════════════════╝"

# Report issues
if [[ ${#ISSUES[@]} -gt 0 ]]; then
    log ""
    log "🚨 Issues found:"
    for issue in "${ISSUES[@]}"; do
        error "$issue"
    done
    
    # Send alert notification
    ALERT_MESSAGE="Backup health issues: $(IFS=', '; echo "${ISSUES[*]}")"
    send_notification "$ALERT_MESSAGE" "error"
    
    exit 1
else
    success "All backup health checks passed!"
    
    # Send success notification (optional, less frequent)
    if [[ "${SEND_SUCCESS_NOTIFICATIONS:-false}" == "true" ]]; then
        send_notification "Backup system healthy: $BACKUP_SIZE_MB MB, ${BACKUP_AGE_HOURS}h old" "info"
    fi
fi

# Output JSON summary for monitoring systems
if [[ "${OUTPUT_JSON:-false}" == "true" ]]; then
    cat << EOF
{
  "status": "$HEALTH_STATUS",
  "latest_backup": {
    "file": "$BACKUP_FILE",
    "age_hours": $BACKUP_AGE_HOURS,
    "size_mb": $BACKUP_SIZE_MB
  },
  "totals": {
    "backup_count": $TOTAL_BACKUPS,
    "storage_mb": $TOTAL_SIZE_MB,
    "recent_frequency": $RECENT_BACKUPS
  },
  "issues": $(printf '%s\n' "${ISSUES[@]}" | jq -R . | jq -s .),
  "timestamp": "$(date -Iseconds)"
}
EOF
fi

exit 0