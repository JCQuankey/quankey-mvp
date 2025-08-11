#!/bin/bash
# 💾 QUANKEY POSTGRESQL BACKUP TO S3
# Automated encrypted backup with rotation and monitoring
# Designed for production use with quantum password manager data

set -euo pipefail  # Strict error handling

# Configuration
BACKUP_DIR="/tmp/quankey-backups"
DB_NAME="${DB_NAME:-quankey_prod}"
DB_USER="${DB_USER:-quankey}"
S3_BUCKET="${S3_BUCKET:-quankey-backups-prod}"
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Validation
if [[ -z "${ENCRYPTION_KEY:-}" ]]; then
    echo "❌ FATAL: BACKUP_ENCRYPTION_KEY not set"
    exit 1
fi

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling
cleanup() {
    if [[ -d "$BACKUP_DIR" ]]; then
        rm -rf "$BACKUP_DIR"
    fi
}
trap cleanup EXIT

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "🚀 Starting Quankey PostgreSQL backup..."

# Generate backup filename with timestamp
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="quankey_backup_${TIMESTAMP}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# 1. Create PostgreSQL dump
log "📦 Creating PostgreSQL dump..."
pg_dump \
    --host="${DB_HOST:-localhost}" \
    --port="${DB_PORT:-5432}" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="${BACKUP_PATH}.pgdump" \
    || {
        log "❌ PostgreSQL dump failed"
        exit 1
    }

# 2. Create database schema backup
log "📋 Creating schema backup..."
pg_dump \
    --host="${DB_HOST:-localhost}" \
    --port="${DB_PORT:-5432}" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --schema-only \
    --file="${BACKUP_PATH}_schema.sql" \
    || {
        log "⚠️ Schema backup failed (non-critical)"
    }

# 3. Encrypt the backup files
log "🔐 Encrypting backup files..."
tar -czf "${BACKUP_PATH}.tar.gz" -C "$BACKUP_DIR" \
    "${BACKUP_FILE}.pgdump" \
    "${BACKUP_FILE}_schema.sql" 2>/dev/null || true

# Encrypt using OpenSSL AES-256-CBC
openssl enc -aes-256-cbc -salt \
    -in "${BACKUP_PATH}.tar.gz" \
    -out "${BACKUP_PATH}.encrypted" \
    -pass "env:ENCRYPTION_KEY" \
    || {
        log "❌ Encryption failed"
        exit 1
    }

# 4. Generate checksums and metadata
log "🔍 Generating checksums..."
BACKUP_SIZE=$(stat -f%z "${BACKUP_PATH}.encrypted" 2>/dev/null || stat -c%s "${BACKUP_PATH}.encrypted")
CHECKSUM=$(sha256sum "${BACKUP_PATH}.encrypted" | cut -d' ' -f1)

# Create metadata file
cat > "${BACKUP_PATH}.meta" << EOF
{
  "backup_type": "postgresql_full",
  "database": "$DB_NAME",
  "timestamp": "$TIMESTAMP",
  "size_bytes": $BACKUP_SIZE,
  "checksum_sha256": "$CHECKSUM",
  "encryption": "aes-256-cbc",
  "format": "pg_dump_custom",
  "compression": "gzip",
  "retention_days": $BACKUP_RETENTION_DAYS,
  "version": "1.0",
  "quantum_safe": true
}
EOF

# 5. Upload to S3
log "☁️ Uploading to S3: s3://$S3_BUCKET/backups/postgresql/"
aws s3 cp "${BACKUP_PATH}.encrypted" \
    "s3://$S3_BUCKET/backups/postgresql/" \
    --storage-class STANDARD_IA \
    --metadata "checksum=$CHECKSUM,backup-type=postgresql,encrypted=true" \
    || {
        log "❌ S3 upload failed"
        exit 1
    }

# Upload metadata
aws s3 cp "${BACKUP_PATH}.meta" \
    "s3://$S3_BUCKET/backups/postgresql/metadata/" \
    --content-type "application/json" \
    || {
        log "⚠️ Metadata upload failed (non-critical)"
    }

# 6. Cleanup old backups (retention)
log "🧹 Cleaning up old backups (retention: ${BACKUP_RETENTION_DAYS} days)..."
CUTOFF_DATE=$(date -d "${BACKUP_RETENTION_DAYS} days ago" '+%Y%m%d' 2>/dev/null || date -v-${BACKUP_RETENTION_DAYS}d '+%Y%m%d')

aws s3 ls "s3://$S3_BUCKET/backups/postgresql/" | \
while read -r line; do
    DATE_STR=$(echo "$line" | awk '{print $1}' | tr -d '-')
    FILE_NAME=$(echo "$line" | awk '{print $4}')
    
    if [[ "$DATE_STR" < "$CUTOFF_DATE" ]] && [[ -n "$FILE_NAME" ]]; then
        log "🗑️ Deleting old backup: $FILE_NAME"
        aws s3 rm "s3://$S3_BUCKET/backups/postgresql/$FILE_NAME" || true
    fi
done

# 7. Verify upload
log "✅ Verifying backup integrity..."
aws s3api head-object \
    --bucket "$S3_BUCKET" \
    --key "backups/postgresql/$(basename "${BACKUP_PATH}.encrypted")" \
    --query 'Metadata.checksum' \
    --output text | grep -q "$CHECKSUM" \
    || {
        log "❌ Backup verification failed"
        exit 1
    }

# Success summary
BACKUP_SIZE_MB=$((BACKUP_SIZE / 1024 / 1024))
log "✅ Backup completed successfully!"
log "📊 Summary:"
log "   Database: $DB_NAME"
log "   Size: ${BACKUP_SIZE_MB}MB"
log "   Checksum: ${CHECKSUM:0:16}..."
log "   Location: s3://$S3_BUCKET/backups/postgresql/"
log "   Retention: $BACKUP_RETENTION_DAYS days"
log "   Encrypted: ✅ AES-256-CBC"

# Optional: Send notification (webhook, Slack, etc.)
if [[ -n "${BACKUP_WEBHOOK_URL:-}" ]]; then
    curl -X POST "$BACKUP_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"✅ Quankey backup completed: ${BACKUP_SIZE_MB}MB uploaded to S3\",
            \"backup_size\": $BACKUP_SIZE,
            \"checksum\": \"$CHECKSUM\",
            \"timestamp\": \"$TIMESTAMP\"
        }" || true
fi

exit 0