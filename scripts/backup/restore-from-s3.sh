#!/bin/bash
# 🔄 QUANKEY POSTGRESQL RESTORE FROM S3
# Restore encrypted PostgreSQL backup from S3
# CRITICAL: Only run this when you need to restore data

set -euo pipefail

# Configuration
RESTORE_DIR="/tmp/quankey-restore"
DB_NAME="${DB_NAME:-quankey_prod}"
DB_USER="${DB_USER:-quankey}"
S3_BUCKET="${S3_BUCKET:-quankey-backups-prod}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Validation
if [[ -z "${ENCRYPTION_KEY:-}" ]]; then
    echo "❌ FATAL: BACKUP_ENCRYPTION_KEY not set"
    exit 1
fi

# Safety check
echo "⚠️  WARNING: This will restore PostgreSQL database from S3 backup"
echo "Database: $DB_NAME"
echo "Bucket: s3://$S3_BUCKET"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
    echo "❌ Restore cancelled by user"
    exit 0
fi

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Cleanup
cleanup() {
    if [[ -d "$RESTORE_DIR" ]]; then
        rm -rf "$RESTORE_DIR"
    fi
}
trap cleanup EXIT

mkdir -p "$RESTORE_DIR"

log "🚀 Starting Quankey PostgreSQL restore..."

# 1. List available backups
log "📋 Listing available backups..."
echo "Available backups:"
aws s3 ls "s3://$S3_BUCKET/backups/postgresql/" | \
    grep "\.encrypted$" | \
    sort -r | \
    head -10 | \
    nl -w2 -s') '

echo ""
read -p "Enter backup filename (or press Enter for latest): " BACKUP_FILE

# If no file specified, use latest
if [[ -z "$BACKUP_FILE" ]]; then
    BACKUP_FILE=$(aws s3 ls "s3://$S3_BUCKET/backups/postgresql/" | \
        grep "\.encrypted$" | \
        sort -r | \
        head -1 | \
        awk '{print $4}')
fi

if [[ -z "$BACKUP_FILE" ]]; then
    log "❌ No backup file found"
    exit 1
fi

log "📥 Selected backup: $BACKUP_FILE"

# 2. Download backup from S3
log "☁️ Downloading backup from S3..."
aws s3 cp "s3://$S3_BUCKET/backups/postgresql/$BACKUP_FILE" \
    "$RESTORE_DIR/$BACKUP_FILE" \
    || {
        log "❌ Download failed"
        exit 1
    }

# Download metadata if available
METADATA_FILE="${BACKUP_FILE%.encrypted}.meta"
aws s3 cp "s3://$S3_BUCKET/backups/postgresql/metadata/$METADATA_FILE" \
    "$RESTORE_DIR/$METADATA_FILE" 2>/dev/null || true

# 3. Verify checksum if metadata exists
if [[ -f "$RESTORE_DIR/$METADATA_FILE" ]]; then
    log "🔍 Verifying backup integrity..."
    EXPECTED_CHECKSUM=$(jq -r '.checksum_sha256' "$RESTORE_DIR/$METADATA_FILE")
    ACTUAL_CHECKSUM=$(sha256sum "$RESTORE_DIR/$BACKUP_FILE" | cut -d' ' -f1)
    
    if [[ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]]; then
        log "❌ Checksum verification failed!"
        log "Expected: $EXPECTED_CHECKSUM"
        log "Actual: $ACTUAL_CHECKSUM"
        exit 1
    fi
    log "✅ Checksum verified"
fi

# 4. Decrypt backup
log "🔓 Decrypting backup..."
DECRYPTED_FILE="${BACKUP_FILE%.encrypted}.tar.gz"
openssl enc -d -aes-256-cbc \
    -in "$RESTORE_DIR/$BACKUP_FILE" \
    -out "$RESTORE_DIR/$DECRYPTED_FILE" \
    -pass "env:ENCRYPTION_KEY" \
    || {
        log "❌ Decryption failed - check BACKUP_ENCRYPTION_KEY"
        exit 1
    }

# 5. Extract files
log "📦 Extracting backup files..."
cd "$RESTORE_DIR"
tar -xzf "$DECRYPTED_FILE" || {
    log "❌ Extraction failed"
    exit 1
}

# Find the .pgdump file
DUMP_FILE=$(find "$RESTORE_DIR" -name "*.pgdump" | head -1)
if [[ -z "$DUMP_FILE" ]]; then
    log "❌ No .pgdump file found in backup"
    exit 1
fi

log "📋 Found dump file: $(basename "$DUMP_FILE")"

# 6. Pre-restore checks
log "🔍 Pre-restore database checks..."

# Check if database exists
if psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "⚠️ Database '$DB_NAME' already exists"
    read -p "Drop existing database? (yes/no): " DROP_CONFIRM
    if [[ "$DROP_CONFIRM" == "yes" ]]; then
        log "🗑️ Dropping existing database..."
        dropdb -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" "$DB_NAME" || true
    else
        log "❌ Restore cancelled - database exists"
        exit 0
    fi
fi

# 7. Create database
log "🏗️ Creating database '$DB_NAME'..."
createdb -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" "$DB_NAME" || {
    log "❌ Database creation failed"
    exit 1
}

# 8. Restore database
log "🔄 Restoring database from backup..."
pg_restore \
    --host="${DB_HOST:-localhost}" \
    --port="${DB_PORT:-5432}" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "$DUMP_FILE" \
    || {
        log "❌ Database restore failed"
        exit 1
    }

# 9. Post-restore verification
log "✅ Running post-restore verification..."

# Count tables
TABLE_COUNT=$(psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

log "📊 Restore completed successfully!"
log "   Database: $DB_NAME"
log "   Tables restored: $TABLE_COUNT"
log "   Source: $BACKUP_FILE"

if [[ -f "$RESTORE_DIR/$METADATA_FILE" ]]; then
    ORIGINAL_DATE=$(jq -r '.timestamp' "$RESTORE_DIR/$METADATA_FILE")
    log "   Backup date: $ORIGINAL_DATE"
fi

log "⚠️ IMPORTANT: Verify application connectivity and data integrity"

exit 0