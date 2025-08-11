# 💾 Quankey PostgreSQL Backup System

Automated encrypted backups to S3 with monitoring and restore capabilities.

## 🚀 Quick Setup

After configuring AWS (S3 bucket, IAM user, credentials), run:

```bash
# 1. Setup automated backups
chmod +x scripts/backup/backup-cron-setup.sh
sudo ./scripts/backup/backup-cron-setup.sh

# 2. Edit configuration with your AWS credentials
sudo nano /etc/quankey/backup.env

# 3. Test backup
sudo -u $(whoami) /usr/local/bin/quankey-backup

# 4. Verify S3 upload
aws s3 ls s3://quankey-backups-prod/backups/postgresql/
```

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `postgres-backup.sh` | Main backup script with encryption |
| `restore-from-s3.sh` | Restore database from S3 backup |
| `backup-cron-setup.sh` | Setup automated backups with cron |
| `backup-monitor.sh` | Health monitoring and alerting |

## ⚙️ Configuration

### Required AWS Setup:
1. **S3 Bucket**: `quankey-backups-prod`
2. **IAM User**: `quankey-backup-user` 
3. **IAM Permissions**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::quankey-backups-prod",
           "arn:aws:s3:::quankey-backups-prod/*"
         ]
       }
     ]
   }
   ```

### Environment Variables:
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quankey_prod
DB_USER=quankey
PGPASSWORD=your_db_password

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=secret...
S3_BUCKET=quankey-backups-prod

# Security
BACKUP_ENCRYPTION_KEY=32_byte_encryption_key
BACKUP_RETENTION_DAYS=30
```

## 🔒 Security Features

- **AES-256-CBC Encryption**: All backups encrypted before S3 upload
- **SHA-256 Checksums**: Integrity verification for all backups
- **Secure Credentials**: Environment file with 600 permissions
- **No Plaintext**: Passwords never stored in logs or temp files

## ⏰ Backup Schedules

| Schedule | Cron | Use Case |
|----------|------|----------|
| Daily | `0 3 * * *` | **Recommended** for production |
| 12-hour | `0 3,15 * * *` | High activity systems |
| 6-hour | `0 3,9,15,21 * * *` | Critical data, frequent changes |

## 📊 Monitoring

### Health Check:
```bash
# Manual health check
./scripts/backup/backup-monitor.sh

# JSON output for monitoring systems
OUTPUT_JSON=true ./scripts/backup/backup-monitor.sh
```

### Alerts on:
- ❌ Backup older than 36 hours
- ❌ Backup size too small (< 1MB)
- ❌ S3 access issues
- ❌ Encryption failures
- ❌ Low backup frequency

## 🔄 Restore Process

### List and Restore:
```bash
# Interactive restore (lists available backups)
./scripts/backup/restore-from-s3.sh

# Restore specific backup
BACKUP_FILE="quankey_backup_20250809_030000.encrypted" \
  ./scripts/backup/restore-from-s3.sh
```

### Restore Steps:
1. Downloads encrypted backup from S3
2. Verifies SHA-256 checksum
3. Decrypts with AES-256-CBC
4. Creates new database
5. Restores from pg_dump format
6. Verifies table count

## 📝 Logs and Troubleshooting

### Log Locations:
```bash
# Backup logs
tail -f /var/log/quankey/backup.log

# System cron logs  
sudo grep quankey /var/log/cron

# Check cron jobs
crontab -l | grep quankey
```

### Common Issues:

#### ❌ "AWS CLI not found"
```bash
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### ❌ "S3 access denied"
- Verify IAM user permissions
- Check AWS credentials in `/etc/quankey/backup.env`
- Test: `aws s3 ls s3://quankey-backups-prod/`

#### ❌ "PostgreSQL connection failed"
- Check database credentials
- Verify PostgreSQL is running: `systemctl status postgresql`
- Test connection: `pg_isready -h localhost -p 5432`

#### ❌ "Encryption key not set"
- Generate 32-byte key: `openssl rand -base64 32`
- Add to `/etc/quankey/backup.env`: `BACKUP_ENCRYPTION_KEY=...`

## 🔍 Backup Format

### File Structure:
```
S3 Bucket: quankey-backups-prod/
├── backups/postgresql/
│   ├── quankey_backup_20250809_030000.encrypted  # Encrypted backup
│   └── quankey_backup_20250809_150000.encrypted
└── metadata/
    ├── quankey_backup_20250809_030000.meta       # Backup metadata
    └── quankey_backup_20250809_150000.meta
```

### Metadata Format:
```json
{
  "backup_type": "postgresql_full",
  "database": "quankey_prod",
  "timestamp": "20250809_030000",
  "size_bytes": 15728640,
  "checksum_sha256": "a1b2c3d4...",
  "encryption": "aes-256-cbc",
  "format": "pg_dump_custom",
  "retention_days": 30,
  "quantum_safe": true
}
```

## 📈 Storage Management

### Retention Policy:
- **Default**: 30 days
- **Automatic cleanup**: Old backups deleted after retention period
- **Manual cleanup**: `aws s3 rm s3://bucket/old-backup.encrypted`

### Storage Optimization:
- **Compression**: gzip compression before encryption
- **Storage Class**: STANDARD_IA for cost optimization
- **Lifecycle Rules**: Consider GLACIER for long-term retention

## 🚨 Emergency Procedures

### Complete Database Loss:
1. Stop application: `pm2 stop quankey`
2. Restore latest backup: `./scripts/backup/restore-from-s3.sh`
3. Verify data integrity
4. Update application configuration if needed
5. Restart application: `pm2 start quankey`

### Backup System Failure:
1. Check service status: `./scripts/backup/backup-monitor.sh`
2. Review logs: `tail -50 /var/log/quankey/backup.log`
3. Test manual backup: `sudo /usr/local/bin/quankey-backup`
4. Verify S3 credentials and permissions

## 🏆 Best Practices

- ✅ **Test restores monthly** - Ensure backups are actually usable
- ✅ **Monitor storage costs** - Review S3 usage regularly  
- ✅ **Rotate encryption keys** - Update annually for security
- ✅ **Document recovery procedures** - Train team on restore process
- ✅ **Multi-region backups** - Consider cross-region replication for DR
- ✅ **Backup verification** - Always verify checksums and integrity

## 📞 Support

For backup-related issues:
1. Check logs: `/var/log/quankey/backup.log`
2. Run health check: `./backup-monitor.sh`
3. Verify AWS access: `aws s3 ls s3://quankey-backups-prod/`
4. Test manual backup: Run backup script directly

---

🔐 **Security Note**: This backup system is designed for the Quankey quantum password manager. All backups are encrypted and checksummed for maximum security.