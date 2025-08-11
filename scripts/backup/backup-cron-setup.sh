#!/bin/bash
# ⏰ SETUP AUTOMATED POSTGRESQL BACKUPS
# Configures cron jobs for automated backups to S3

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/postgres-backup.sh"

echo "🚀 Setting up Quankey automated backup system..."

# Verify backup script exists
if [[ ! -f "$BACKUP_SCRIPT" ]]; then
    echo "❌ Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

# Make scripts executable
chmod +x "$BACKUP_SCRIPT"
chmod +x "$SCRIPT_DIR/restore-from-s3.sh"

echo "✅ Scripts made executable"

# Environment file for cron
ENV_FILE="/etc/quankey/backup.env"
sudo mkdir -p "$(dirname "$ENV_FILE")"

cat << 'EOF' | sudo tee "$ENV_FILE" > /dev/null
# Quankey Backup Configuration
# ⚠️ CRITICAL: Ensure these match your production environment

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quankey_prod
DB_USER=quankey
PGPASSWORD=your_db_password_here

# S3 Configuration  
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET=quankey-backups-prod

# Backup Configuration
BACKUP_ENCRYPTION_KEY=your_256_bit_encryption_key_here
BACKUP_RETENTION_DAYS=30

# Optional: Webhook for notifications
# BACKUP_WEBHOOK_URL=https://hooks.slack.com/your/webhook/url
EOF

echo "📝 Environment file created: $ENV_FILE"
echo "⚠️  IMPORTANT: Edit $ENV_FILE with your actual credentials"

# Create log directory
LOG_DIR="/var/log/quankey"
sudo mkdir -p "$LOG_DIR"
sudo chown $(whoami):$(whoami) "$LOG_DIR"

echo "📁 Log directory created: $LOG_DIR"

# Backup scheduling options
echo ""
echo "📅 Backup Schedule Options:"
echo "1) Daily at 3:00 AM (Recommended)"
echo "2) Every 12 hours (3:00 AM and 3:00 PM)"  
echo "3) Every 6 hours (High frequency)"
echo "4) Custom schedule"
echo "5) Manual only (no cron)"

read -p "Select backup frequency (1-5): " SCHEDULE_CHOICE

case $SCHEDULE_CHOICE in
    1)
        CRON_SCHEDULE="0 3 * * *"
        DESCRIPTION="Daily at 3:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 3,15 * * *"
        DESCRIPTION="Every 12 hours (3:00 AM and 3:00 PM)"
        ;;
    3)
        CRON_SCHEDULE="0 3,9,15,21 * * *"
        DESCRIPTION="Every 6 hours"
        ;;
    4)
        read -p "Enter cron expression (e.g., '0 2 * * *'): " CRON_SCHEDULE
        DESCRIPTION="Custom: $CRON_SCHEDULE"
        ;;
    5)
        echo "✅ Manual backup setup complete"
        echo "Run backups manually: $BACKUP_SCRIPT"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Create wrapper script that sources environment
WRAPPER_SCRIPT="/usr/local/bin/quankey-backup"
cat << EOF | sudo tee "$WRAPPER_SCRIPT" > /dev/null
#!/bin/bash
# Quankey Backup Wrapper - DO NOT EDIT MANUALLY

set -euo pipefail

# Source environment
if [[ -f "$ENV_FILE" ]]; then
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "❌ Environment file not found: $ENV_FILE"
    exit 1
fi

# Run backup with logging
exec "$BACKUP_SCRIPT" 2>&1 | tee -a "$LOG_DIR/backup.log"
EOF

sudo chmod +x "$WRAPPER_SCRIPT"

# Add to crontab
CRON_ENTRY="$CRON_SCHEDULE $WRAPPER_SCRIPT"

# Remove existing Quankey backup entries
crontab -l 2>/dev/null | grep -v "quankey-backup" | crontab - 2>/dev/null || true

# Add new entry
(crontab -l 2>/dev/null; echo "# Quankey PostgreSQL Backup - $DESCRIPTION") | crontab -
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job installed successfully!"
echo ""
echo "📊 Backup System Summary:"
echo "   Schedule: $DESCRIPTION"
echo "   Cron: $CRON_SCHEDULE"
echo "   Script: $WRAPPER_SCRIPT"
echo "   Logs: $LOG_DIR/backup.log"
echo "   Config: $ENV_FILE"
echo ""
echo "🔧 Next Steps:"
echo "1. Edit $ENV_FILE with your credentials"
echo "2. Test backup: sudo -u $(whoami) $WRAPPER_SCRIPT"
echo "3. Verify S3 upload: aws s3 ls s3://quankey-backups-prod/backups/postgresql/"
echo "4. Check logs: tail -f $LOG_DIR/backup.log"
echo ""
echo "⚠️  Security Notes:"
echo "   - Environment file contains sensitive credentials"
echo "   - Ensure proper file permissions (600)"
echo "   - Use IAM user with minimal S3 permissions"
echo "   - Rotate backup encryption key periodically"

# Set secure permissions on environment file
sudo chmod 600 "$ENV_FILE"

echo ""
echo "🎉 Automated backup system ready!"

exit 0