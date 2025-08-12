#!/bin/bash
# QUANKEY COMPREHENSIVE BACKUP SYSTEM
# Automated backup solution for Passkeys + PQC architecture

# Configuration
BACKUP_ROOT="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
LOG_FILE="/home/ubuntu/logs/backup.log"
MAX_LOG_SIZE=10485760  # 10MB

# Database credentials (from .env)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="quankey"
DB_USER="quankey"
DB_PASSWORD="QuankeySecurePass2025!"

# Backup directories
DB_BACKUP_DIR="$BACKUP_ROOT/database"
FILES_BACKUP_DIR="$BACKUP_ROOT/files"
CONFIG_BACKUP_DIR="$BACKUP_ROOT/config"
LOGS_BACKUP_DIR="$BACKUP_ROOT/logs"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create backup directories
create_backup_dirs() {
    mkdir -p "$DB_BACKUP_DIR"
    mkdir -p "$FILES_BACKUP_DIR"
    mkdir -p "$CONFIG_BACKUP_DIR"
    mkdir -p "$LOGS_BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
}

# Logging function
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    
    # Rotate log if it gets too large
    if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0) -gt $MAX_LOG_SIZE ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        echo "[$timestamp] [INFO] Log rotated" > "$LOG_FILE"
    fi
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log_message "INFO" "$1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log_message "SUCCESS" "$1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log_message "WARNING" "$1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log_message "ERROR" "$1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking backup prerequisites..."
    
    # Check if pg_dump is available
    if ! command -v pg_dump >/dev/null 2>&1; then
        log_error "pg_dump not found. Install postgresql-client."
        return 1
    fi
    
    # Check if gzip is available
    if ! command -v gzip >/dev/null 2>&1; then
        log_error "gzip not found. Install gzip."
        return 1
    fi
    
    # Check if tar is available
    if ! command -v tar >/dev/null 2>&1; then
        log_error "tar not found."
        return 1
    fi
    
    # Check database connectivity
    if ! PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
        log_error "Cannot connect to PostgreSQL database"
        return 1
    fi
    
    log_success "All prerequisites met"
    return 0
}

# Database backup
backup_database() {
    log_info "Starting database backup..."
    
    local db_backup_file="$DB_BACKUP_DIR/quankey_db_$DATE.sql"
    local db_backup_compressed="$db_backup_file.gz"
    
    # Create database dump
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --no-password --format=plain --clean --create > "$db_backup_file" 2>>"$LOG_FILE"; then
        
        # Compress the dump
        if gzip "$db_backup_file"; then
            local backup_size=$(ls -lh "$db_backup_compressed" | awk '{print $5}')
            log_success "Database backup completed: $db_backup_compressed ($backup_size)"
            
            # Verify backup integrity
            if gunzip -t "$db_backup_compressed" >/dev/null 2>&1; then
                log_success "Database backup integrity verified"
            else
                log_error "Database backup integrity check failed"
                return 1
            fi
        else
            log_error "Failed to compress database backup"
            return 1
        fi
    else
        log_error "Database backup failed"
        rm -f "$db_backup_file"
        return 1
    fi
    
    return 0
}

# Files backup
backup_files() {
    log_info "Starting files backup..."
    
    local files_backup="$FILES_BACKUP_DIR/quankey_files_$DATE.tar.gz"
    
    # Files to backup
    local backup_targets=(
        "/home/ubuntu/quankey-mvp/backend/prisma"
        "/home/ubuntu/quankey-mvp/backend/src"
        "/home/ubuntu/quankey-mvp/frontend/src"
        "/home/ubuntu/quankey-mvp/frontend/public"
        "/home/ubuntu/quankey-mvp/scripts"
        "/home/ubuntu/quankey-mvp/package.json"
        "/home/ubuntu/quankey-mvp/package-lock.json"
        "/home/ubuntu/quankey-mvp/README.md"
        "/home/ubuntu/quankey-mvp/ecosystem.config.js"
    )
    
    # Check which files exist
    local existing_targets=()
    for target in "${backup_targets[@]}"; do
        if [ -e "$target" ]; then
            existing_targets+=("$target")
        else
            log_warning "File/directory not found: $target"
        fi
    done
    
    if [ ${#existing_targets[@]} -eq 0 ]; then
        log_error "No files found to backup"
        return 1
    fi
    
    # Create tar archive
    if tar -czf "$files_backup" "${existing_targets[@]}" 2>>"$LOG_FILE"; then
        local backup_size=$(ls -lh "$files_backup" | awk '{print $5}')
        log_success "Files backup completed: $files_backup ($backup_size)"
        
        # Verify archive integrity
        if tar -tzf "$files_backup" >/dev/null 2>&1; then
            log_success "Files backup integrity verified"
        else
            log_error "Files backup integrity check failed"
            return 1
        fi
    else
        log_error "Files backup failed"
        return 1
    fi
    
    return 0
}

# Configuration backup
backup_configuration() {
    log_info "Starting configuration backup..."
    
    local config_backup="$CONFIG_BACKUP_DIR/quankey_config_$DATE.tar.gz"
    
    # Configuration files to backup
    local config_targets=(
        "/home/ubuntu/quankey-mvp/backend/.env"
        "/home/ubuntu/quankey-mvp/frontend/.env.production"
        "/etc/nginx/sites-available/quankey"
        "/etc/letsencrypt/live/quankey.xyz" 
        "/home/ubuntu/.pm2"
        "/etc/systemd/system/pm2-ubuntu.service"
    )
    
    # Check which config files exist
    local existing_configs=()
    for target in "${config_targets[@]}"; do
        if [ -e "$target" ]; then
            existing_configs+=("$target")
        else
            log_warning "Config file/directory not found: $target"
        fi
    done
    
    if [ ${#existing_configs[@]} -eq 0 ]; then
        log_warning "No configuration files found to backup"
        return 0
    fi
    
    # Create configuration backup
    if sudo tar -czf "$config_backup" "${existing_configs[@]}" 2>>"$LOG_FILE"; then
        sudo chown ubuntu:ubuntu "$config_backup"
        local backup_size=$(ls -lh "$config_backup" | awk '{print $5}')
        log_success "Configuration backup completed: $config_backup ($backup_size)"
    else
        log_error "Configuration backup failed"
        return 1
    fi
    
    return 0
}

# Logs backup
backup_logs() {
    log_info "Starting logs backup..."
    
    local logs_backup="$LOGS_BACKUP_DIR/quankey_logs_$DATE.tar.gz"
    
    # Log directories to backup
    local log_targets=(
        "/home/ubuntu/quankey-mvp/logs"
        "/home/ubuntu/logs"
        "/var/log/nginx"
        "/var/log/postgresql"
    )
    
    # Check which log directories exist
    local existing_logs=()
    for target in "${log_targets[@]}"; do
        if [ -d "$target" ] && [ "$(ls -A "$target" 2>/dev/null)" ]; then
            existing_logs+=("$target")
        else
            log_warning "Log directory not found or empty: $target"
        fi
    done
    
    if [ ${#existing_logs[@]} -eq 0 ]; then
        log_warning "No log directories found to backup"
        return 0
    fi
    
    # Create logs backup
    if sudo tar -czf "$logs_backup" "${existing_logs[@]}" 2>>"$LOG_FILE"; then
        sudo chown ubuntu:ubuntu "$logs_backup"
        local backup_size=$(ls -lh "$logs_backup" | awk '{print $5}')
        log_success "Logs backup completed: $logs_backup ($backup_size)"
    else
        log_error "Logs backup failed"
        return 1
    fi
    
    return 0
}

# Create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."
    
    local manifest_file="$BACKUP_ROOT/backup_manifest_$DATE.txt"
    
    cat > "$manifest_file" << EOF
QUANKEY BACKUP MANIFEST
=======================
Backup Date: $(date '+%Y-%m-%d %H:%M:%S %Z')
Backup ID: $DATE
Server: $(hostname)
User: $(whoami)
Quankey Version: 7.0 (Passkeys + PQC Architecture)

BACKUP CONTENTS:
================

Database Backup:
$(ls -la "$DB_BACKUP_DIR"/quankey_db_$DATE.sql.gz 2>/dev/null || echo "  - Database backup not found")

Files Backup:
$(ls -la "$FILES_BACKUP_DIR"/quankey_files_$DATE.tar.gz 2>/dev/null || echo "  - Files backup not found")

Configuration Backup:
$(ls -la "$CONFIG_BACKUP_DIR"/quankey_config_$DATE.tar.gz 2>/dev/null || echo "  - Configuration backup not found")

Logs Backup:
$(ls -la "$LOGS_BACKUP_DIR"/quankey_logs_$DATE.tar.gz 2>/dev/null || echo "  - Logs backup not found")

SYSTEM INFORMATION:
===================
OS: $(uname -a)
Disk Usage: $(df -h /)
Memory: $(free -h)
Uptime: $(uptime)

DATABASE SCHEMA:
================
$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null || echo "Could not retrieve database schema")

PM2 STATUS:
===========
$(pm2 status --no-color 2>/dev/null || echo "PM2 not available")

NGINX STATUS:
=============
$(nginx -t 2>&1 || echo "Nginx not available")

RESTORE INSTRUCTIONS:
=====================
To restore this backup:

1. Database:
   gunzip -c $DB_BACKUP_DIR/quankey_db_$DATE.sql.gz | PGPASSWORD="password" psql -h localhost -U quankey -d quankey

2. Files:
   tar -xzf $FILES_BACKUP_DIR/quankey_files_$DATE.tar.gz -C /

3. Configuration:
   sudo tar -xzf $CONFIG_BACKUP_DIR/quankey_config_$DATE.tar.gz -C /

4. Logs:
   sudo tar -xzf $LOGS_BACKUP_DIR/quankey_logs_$DATE.tar.gz -C /

BACKUP COMPLETION: $(date '+%Y-%m-%d %H:%M:%S %Z')
EOF
    
    log_success "Backup manifest created: $manifest_file"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local cleanup_count=0
    
    # Cleanup each backup type
    for backup_dir in "$DB_BACKUP_DIR" "$FILES_BACKUP_DIR" "$CONFIG_BACKUP_DIR" "$LOGS_BACKUP_DIR"; do
        if [ -d "$backup_dir" ]; then
            local deleted_files=$(find "$backup_dir" -type f -name "*.gz" -o -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
            cleanup_count=$((cleanup_count + deleted_files))
        fi
    done
    
    # Cleanup old manifests
    local deleted_manifests=$(find "$BACKUP_ROOT" -name "backup_manifest_*.txt" -mtime +$RETENTION_DAYS -delete -print | wc -l)
    cleanup_count=$((cleanup_count + deleted_manifests))
    
    if [ $cleanup_count -gt 0 ]; then
        log_success "Cleaned up $cleanup_count old backup files"
    else
        log_info "No old backup files to clean up"
    fi
}

# Send backup notification (if configured)
send_notification() {
    local status=$1
    local message=$2
    
    # Email notification (if mail is configured)
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "Quankey Backup $status - $(hostname)" admin@quankey.xyz 2>/dev/null || true
    fi
    
    # Log notification
    if [ "$status" = "SUCCESS" ]; then
        log_success "Backup completed successfully"
    else
        log_error "Backup completed with errors"
    fi
}

# Calculate backup summary
backup_summary() {
    local total_size=0
    local file_count=0
    
    # Calculate total backup size
    for backup_dir in "$DB_BACKUP_DIR" "$FILES_BACKUP_DIR" "$CONFIG_BACKUP_DIR" "$LOGS_BACKUP_DIR"; do
        if [ -d "$backup_dir" ]; then
            local dir_size=$(find "$backup_dir" -name "*$DATE*" -type f -exec ls -la {} \; 2>/dev/null | awk '{sum += $5} END {print sum+0}')
            total_size=$((total_size + dir_size))
            local dir_files=$(find "$backup_dir" -name "*$DATE*" -type f | wc -l)
            file_count=$((file_count + dir_files))
        fi
    done
    
    local total_size_mb=$((total_size / 1024 / 1024))
    
    log_info "Backup Summary:"
    log_info "  - Files created: $file_count"
    log_info "  - Total size: ${total_size_mb}MB"
    log_info "  - Backup ID: $DATE"
    log_info "  - Location: $BACKUP_ROOT"
}

# Main backup function
main_backup() {
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                      QUANKEY BACKUP SYSTEM                       ║"
    echo "║                   Passkeys + PQC Architecture                    ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    
    local start_time=$(date +%s)
    local backup_success=true
    
    log_info "Starting Quankey backup process..."
    log_info "Backup ID: $DATE"
    
    # Check prerequisites
    if ! check_prerequisites; then
        log_error "Prerequisites check failed. Aborting backup."
        exit 1
    fi
    
    # Create backup directories
    create_backup_dirs
    
    # Perform backups
    if ! backup_database; then
        backup_success=false
    fi
    
    if ! backup_files; then
        backup_success=false
    fi
    
    if ! backup_configuration; then
        backup_success=false
    fi
    
    if ! backup_logs; then
        backup_success=false
    fi
    
    # Create manifest
    create_manifest
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Calculate summary
    backup_summary
    
    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log_info "Backup completed in ${duration} seconds"
    
    # Send notification
    if [ "$backup_success" = true ]; then
        send_notification "SUCCESS" "Quankey backup completed successfully. Backup ID: $DATE"
        log_success "Backup process completed successfully!"
        exit 0
    else
        send_notification "FAILED" "Quankey backup completed with errors. Check logs for details. Backup ID: $DATE"
        log_error "Backup process completed with errors!"
        exit 1
    fi
}

# Command line options
case "${1:-backup}" in
    "backup"|"")
        main_backup
        ;;
    "cleanup")
        log_info "Running cleanup only..."
        create_backup_dirs
        cleanup_old_backups
        ;;
    "verify")
        if [ -z "$2" ]; then
            log_error "Please specify backup ID to verify"
            echo "Usage: $0 verify <backup_id>"
            exit 1
        fi
        
        backup_id="$2"
        log_info "Verifying backup: $backup_id"
        
        # Verify database backup
        if [ -f "$DB_BACKUP_DIR/quankey_db_$backup_id.sql.gz" ]; then
            if gunzip -t "$DB_BACKUP_DIR/quankey_db_$backup_id.sql.gz"; then
                log_success "Database backup verified"
            else
                log_error "Database backup verification failed"
            fi
        else
            log_warning "Database backup not found"
        fi
        
        # Verify files backup
        if [ -f "$FILES_BACKUP_DIR/quankey_files_$backup_id.tar.gz" ]; then
            if tar -tzf "$FILES_BACKUP_DIR/quankey_files_$backup_id.tar.gz" >/dev/null; then
                log_success "Files backup verified"
            else
                log_error "Files backup verification failed"
            fi
        else
            log_warning "Files backup not found"
        fi
        ;;
    "list")
        echo "Available backups:"
        echo "=================="
        for backup_dir in "$DB_BACKUP_DIR" "$FILES_BACKUP_DIR" "$CONFIG_BACKUP_DIR" "$LOGS_BACKUP_DIR"; do
            if [ -d "$backup_dir" ]; then
                echo ""
                echo "$(basename "$backup_dir"):"
                ls -la "$backup_dir"/*.gz 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes, " $6 " " $7 " " $8 ")"}'
            fi
        done
        
        echo ""
        echo "Manifests:"
        ls -la "$BACKUP_ROOT"/backup_manifest_*.txt 2>/dev/null | awk '{print "  " $9 " (" $6 " " $7 " " $8 ")"}'
        ;;
    "restore")
        if [ -z "$2" ]; then
            log_error "Please specify backup ID to restore"
            echo "Usage: $0 restore <backup_id>"
            echo "Warning: This will overwrite current data!"
            exit 1
        fi
        
        backup_id="$2"
        log_warning "RESTORE OPERATION REQUESTED"
        log_warning "This will overwrite current data!"
        read -p "Are you sure you want to restore backup $backup_id? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            log_info "Restore cancelled"
            exit 0
        fi
        
        log_info "Restoring backup: $backup_id"
        
        # Stop services
        log_info "Stopping services..."
        pm2 stop all
        
        # Restore database
        if [ -f "$DB_BACKUP_DIR/quankey_db_$backup_id.sql.gz" ]; then
            log_info "Restoring database..."
            gunzip -c "$DB_BACKUP_DIR/quankey_db_$backup_id.sql.gz" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
            log_success "Database restored"
        else
            log_error "Database backup not found"
        fi
        
        # Restore files
        if [ -f "$FILES_BACKUP_DIR/quankey_files_$backup_id.tar.gz" ]; then
            log_info "Restoring files..."
            tar -xzf "$FILES_BACKUP_DIR/quankey_files_$backup_id.tar.gz" -C /
            log_success "Files restored"
        else
            log_error "Files backup not found"
        fi
        
        # Start services
        log_info "Starting services..."
        pm2 start all
        
        log_success "Restore completed"
        ;;
    "help"|"-h"|"--help")
        echo "Quankey Backup System"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  backup          Create full backup (default)"
        echo "  cleanup         Remove old backups only"
        echo "  verify <id>     Verify backup integrity"
        echo "  list            List available backups"
        echo "  restore <id>    Restore from backup (dangerous!)"
        echo "  help            Show this help message"
        echo ""
        echo "Configuration:"
        echo "  Retention: $RETENTION_DAYS days"
        echo "  Location: $BACKUP_ROOT"
        echo "  Log: $LOG_FILE"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for available commands"
        exit 1
        ;;
esac