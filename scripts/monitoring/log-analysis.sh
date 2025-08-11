#!/bin/bash
# 📊 QUANKEY LOG ANALYSIS & INSIGHTS
# Analyzes application logs for security events, performance issues, and quantum operations
# Provides actionable insights for monitoring and troubleshooting

set -euo pipefail

# Configuration
LOG_DIR="${LOG_DIR:-/var/log/quankey}"
ANALYSIS_PERIOD="${ANALYSIS_PERIOD:-24}" # hours
OUTPUT_FORMAT="${OUTPUT_FORMAT:-human}"  # human, json, csv

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

highlight() {
    log "${PURPLE}📊 $1${NC}"
}

# Check if log directory exists
if [[ ! -d "$LOG_DIR" ]]; then
    error "Log directory not found: $LOG_DIR"
    exit 1
fi

log "📊 Starting Quankey log analysis..."
log "📁 Log directory: $LOG_DIR"
log "⏰ Analysis period: Last $ANALYSIS_PERIOD hours"

# Calculate time range
CUTOFF_TIME=$(date -d "$ANALYSIS_PERIOD hours ago" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -v-${ANALYSIS_PERIOD}H '+%Y-%m-%d %H:%M:%S')

# Initialize counters
declare -A metrics=(
    [total_requests]=0
    [successful_auth]=0
    [failed_auth]=0
    [security_events]=0
    [quantum_operations]=0
    [backup_operations]=0
    [errors]=0
    [warnings]=0
    [unique_users]=0
    [unique_ips]=0
)

declare -A security_events
declare -A error_types
declare -A top_ips
declare -A quantum_stats

# Function to analyze application logs
analyze_application_logs() {
    local log_file="$LOG_DIR/application.log"
    
    if [[ ! -f "$log_file" ]]; then
        warning "Application log not found: $log_file"
        return
    fi
    
    info "🔍 Analyzing application logs..."
    
    # Process recent log entries
    awk -v cutoff="$CUTOFF_TIME" '
    BEGIN {
        total_requests = 0
        errors = 0
        warnings = 0
        quantum_ops = 0
    }
    {
        # Extract timestamp
        if (match($0, /\[([0-9-]+ [0-9:]+)\]/, timestamp_match)) {
            log_time = timestamp_match[1]
            if (log_time >= cutoff) {
                total_requests++
                
                # Count errors
                if (/ERROR|❌/) errors++
                if (/WARN|⚠️/) warnings++
                if (/quantum|ML-KEM|ML-DSA/) quantum_ops++
                
                # Print specific patterns for further processing
                if (/quantum|ML-KEM|ML-DSA/) print "QUANTUM:" $0
                if (/ERROR|❌/) print "ERROR:" $0
                if (/WARN|⚠️/) print "WARNING:" $0
            }
        }
    }
    END {
        print "STATS:total_requests:" total_requests
        print "STATS:errors:" errors  
        print "STATS:warnings:" warnings
        print "STATS:quantum_ops:" quantum_ops
    }' "$log_file" | while IFS= read -r line; do
        if [[ $line =~ ^STATS:(.+):(.+)$ ]]; then
            metrics[${BASH_REMATCH[1]}]=${BASH_REMATCH[2]}
        elif [[ $line =~ ^QUANTUM:(.+)$ ]]; then
            # Analyze quantum operations
            quantum_line="${BASH_REMATCH[1]}"
            if [[ $quantum_line =~ ML-KEM-768 ]]; then
                ((quantum_stats[ml_kem]++)) || quantum_stats[ml_kem]=1
            fi
            if [[ $quantum_line =~ ML-DSA-65 ]]; then
                ((quantum_stats[ml_dsa]++)) || quantum_stats[ml_dsa]=1
            fi
        elif [[ $line =~ ^ERROR:(.+)$ ]]; then
            # Categorize errors
            error_line="${BASH_REMATCH[1]}"
            if [[ $error_line =~ "database" ]]; then
                ((error_types[database]++)) || error_types[database]=1
            elif [[ $error_line =~ "quantum" ]]; then
                ((error_types[quantum]++)) || error_types[quantum]=1
            elif [[ $error_line =~ "auth" ]]; then
                ((error_types[auth]++)) || error_types[auth]=1
            else
                ((error_types[other]++)) || error_types[other]=1
            fi
        fi
    done
}

# Function to analyze security logs
analyze_security_logs() {
    local log_file="$LOG_DIR/security.log"
    
    if [[ ! -f "$log_file" ]]; then
        warning "Security log not found: $log_file"
        return
    fi
    
    info "🔒 Analyzing security logs..."
    
    # Extract security events from recent logs
    awk -v cutoff="$CUTOFF_TIME" '
    {
        if (match($0, /\[([0-9-]+ [0-9:]+)\]/, timestamp_match)) {
            log_time = timestamp_match[1]
            if (log_time >= cutoff) {
                # Extract event type and IP
                if (match($0, /"type":"([^"]+)"/, type_match)) {
                    event_type = type_match[1]
                    print "EVENT:" event_type
                }
                
                if (match($0, /"ip":"([^"]+)"/, ip_match)) {
                    ip = ip_match[1]
                    print "IP:" ip
                }
                
                if (match($0, /"userId":"([^"]+)"/, user_match)) {
                    user_id = user_match[1]
                    if (user_id != "anonymous") print "USER:" user_id
                }
                
                # Count specific security events
                if (/AUTHENTICATION_FAILURE/) print "AUTH_FAIL"
                if (/VALIDATION_FAILURE/) print "VALIDATION_FAIL"  
                if (/RATE_LIMIT/) print "RATE_LIMIT"
                if (/SUSPICIOUS/) print "SUSPICIOUS"
            }
        }
    }' "$log_file" | while IFS= read -r line; do
        case $line in
            EVENT:*)
                event_type="${line#EVENT:}"
                ((security_events[$event_type]++)) || security_events[$event_type]=1
                ((metrics[security_events]++))
                ;;
            IP:*)
                ip="${line#IP:}"
                ((top_ips[$ip]++)) || top_ips[$ip]=1
                ;;
            USER:*)
                user="${line#USER:}"
                # Count unique users (simplified)
                ;;
            AUTH_FAIL)
                ((metrics[failed_auth]++))
                ;;
        esac
    done
}

# Function to analyze backup logs
analyze_backup_logs() {
    local log_file="$LOG_DIR/backup.log"
    
    if [[ ! -f "$log_file" ]]; then
        warning "Backup log not found: $log_file"
        return
    fi
    
    info "💾 Analyzing backup logs..."
    
    # Count successful and failed backups
    local successful_backups=0
    local failed_backups=0
    local latest_backup=""
    
    while IFS= read -r line; do
        if [[ $line =~ $CUTOFF_TIME.*"✅ Backup completed successfully" ]]; then
            ((successful_backups++))
            latest_backup=$(echo "$line" | grep -o '[0-9]\{8\}_[0-9]\{6\}' | head -1)
        elif [[ $line =~ $CUTOFF_TIME.*"❌" ]]; then
            ((failed_backups++))
        fi
    done < "$log_file"
    
    metrics[backup_success]=$successful_backups
    metrics[backup_failures]=$failed_backups
    metrics[latest_backup]="$latest_backup"
}

# Function to analyze Nginx logs
analyze_nginx_logs() {
    local access_log="/var/log/nginx/access.log"
    local error_log="/var/log/nginx/error.log"
    
    if [[ -f "$access_log" ]]; then
        info "🌐 Analyzing Nginx access logs..."
        
        # Count requests by status code in the last period
        awk -v cutoff_timestamp="$(date -d "$CUTOFF_TIME" +%s)" '
        {
            # Parse Nginx log timestamp [dd/MMM/yyyy:HH:mm:ss +0000]
            if (match($0, /\[([^]]+)\]/, timestamp_match)) {
                cmd = "date -d \"" timestamp_match[1] "\" +%s 2>/dev/null"
                cmd | getline log_timestamp
                close(cmd)
                
                if (log_timestamp >= cutoff_timestamp) {
                    # Extract status code and IP
                    if (match($0, / ([0-9]{3}) /, status_match)) {
                        status = status_match[1]
                        print "STATUS:" status
                        
                        if (status >= 400) print "ERROR_REQUEST"
                        if (status == 200) print "SUCCESS_REQUEST"
                    }
                    
                    # Extract IP (first field)
                    if (match($0, /^([0-9.]+)/, ip_match)) {
                        print "REQUEST_IP:" ip_match[1]
                    }
                }
            }
        }' "$access_log" 2>/dev/null | while IFS= read -r line; do
            case $line in
                STATUS:*)
                    # Count by status code
                    ;;
                ERROR_REQUEST)
                    ((metrics[http_errors]++)) || metrics[http_errors]=0
                    ;;
                SUCCESS_REQUEST)
                    ((metrics[http_success]++)) || metrics[http_success]=0
                    ;;
                REQUEST_IP:*)
                    ip="${line#REQUEST_IP:}"
                    ((top_ips[$ip]++)) || top_ips[$ip]=1
                    ;;
            esac
        done
    fi
    
    if [[ -f "$error_log" ]]; then
        # Count Nginx errors
        local nginx_errors=$(grep -c "$(date -d "$CUTOFF_TIME" '+%Y/%m/%d %H')" "$error_log" 2>/dev/null | head -1 || echo 0)
        metrics[nginx_errors]=$nginx_errors
    fi
}

# Run analysis functions
analyze_application_logs
analyze_security_logs  
analyze_backup_logs
analyze_nginx_logs

# Calculate derived metrics
metrics[unique_ips]=$(printf '%s\n' "${!top_ips[@]}" | wc -l)
metrics[error_rate]=0
if [[ ${metrics[total_requests]} -gt 0 ]]; then
    metrics[error_rate]=$(( (metrics[errors] * 100) / metrics[total_requests] ))
fi

# Generate report
log ""
highlight "📊 QUANKEY LOG ANALYSIS REPORT"
highlight "$(printf '=%.0s' {1..50})"

if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    # JSON output
    cat << EOF
{
  "analysis_period_hours": $ANALYSIS_PERIOD,
  "generated_at": "$(date -Iseconds)",
  "metrics": {
    "total_requests": ${metrics[total_requests]},
    "errors": ${metrics[errors]},
    "warnings": ${metrics[warnings]},
    "error_rate_percent": ${metrics[error_rate]},
    "security_events": ${metrics[security_events]},
    "failed_auth": ${metrics[failed_auth]},
    "quantum_operations": ${metrics[quantum_operations]},
    "backup_success": ${metrics[backup_success]:-0},
    "backup_failures": ${metrics[backup_failures]:-0},
    "unique_ips": ${metrics[unique_ips]},
    "http_errors": ${metrics[http_errors]:-0},
    "http_success": ${metrics[http_success]:-0}
  },
  "top_security_events": $(printf '%s\n' "${!security_events[@]}" "${security_events[@]}" | paste - - | jq -R 'split("\t") | {(.[0]): (.[1] | tonumber)}' | jq -s 'add // {}'),
  "quantum_operations": $(printf '%s\n' "${!quantum_stats[@]}" "${quantum_stats[@]}" | paste - - | jq -R 'split("\t") | {(.[0]): (.[1] | tonumber)}' | jq -s 'add // {}'),
  "latest_backup": "${metrics[latest_backup]:-none}"
}
EOF
else
    # Human readable output
    log ""
    log "📈 APPLICATION METRICS (Last $ANALYSIS_PERIOD hours)"
    log "   Total Requests: ${metrics[total_requests]}"
    log "   Errors: ${metrics[errors]} (${metrics[error_rate]}% error rate)"
    log "   Warnings: ${metrics[warnings]}"
    log "   Quantum Operations: ${metrics[quantum_operations]}"
    
    log ""
    log "🔒 SECURITY METRICS"
    log "   Security Events: ${metrics[security_events]}"
    log "   Failed Authentications: ${metrics[failed_auth]}"
    log "   Unique IPs: ${metrics[unique_ips]}"
    
    if [[ ${#security_events[@]} -gt 0 ]]; then
        log "   Top Security Events:"
        for event in "${!security_events[@]}"; do
            log "      $event: ${security_events[$event]}"
        done
    fi
    
    log ""
    log "💾 BACKUP STATUS"
    log "   Successful Backups: ${metrics[backup_success]:-0}"
    log "   Failed Backups: ${metrics[backup_failures]:-0}"
    log "   Latest Backup: ${metrics[latest_backup]:-none}"
    
    log ""
    log "🔬 QUANTUM CRYPTOGRAPHY"
    if [[ ${#quantum_stats[@]} -gt 0 ]]; then
        for algo in "${!quantum_stats[@]}"; do
            log "   $algo operations: ${quantum_stats[$algo]}"
        done
    else
        log "   No quantum operations detected in logs"
    fi
    
    log ""
    log "🌐 WEB TRAFFIC"
    log "   HTTP Success: ${metrics[http_success]:-0}"
    log "   HTTP Errors: ${metrics[http_errors]:-0}"
    log "   Nginx Errors: ${metrics[nginx_errors]:-0}"
    
    if [[ ${#top_ips[@]} -gt 0 ]]; then
        log ""
        log "🔝 TOP IP ADDRESSES"
        # Sort IPs by count and show top 5
        for ip in "${!top_ips[@]}"; do
            echo "$ip ${top_ips[$ip]}"
        done | sort -k2 -nr | head -5 | while read ip count; do
            log "   $ip: $count requests"
        done
    fi
    
    # Recommendations
    log ""
    highlight "💡 RECOMMENDATIONS"
    
    if [[ ${metrics[error_rate]} -gt 10 ]]; then
        warning "High error rate (${metrics[error_rate]}%) - investigate application issues"
    fi
    
    if [[ ${metrics[failed_auth]} -gt 20 ]]; then
        warning "High failed authentication attempts (${metrics[failed_auth]}) - possible brute force"
    fi
    
    if [[ ${metrics[backup_failures]:-0} -gt 0 ]]; then
        error "${metrics[backup_failures]} backup failures detected - check backup system"
    fi
    
    if [[ ${metrics[quantum_operations]} -eq 0 ]]; then
        warning "No quantum operations detected - verify quantum crypto is active"
    fi
    
    if [[ ${metrics[security_events]} -gt 100 ]]; then
        warning "High security event volume (${metrics[security_events]}) - review security logs"
    fi
fi

success "Log analysis complete!"

exit 0