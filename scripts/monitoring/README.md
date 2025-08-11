# ☁️ Quankey CloudWatch Monitoring System

Comprehensive monitoring and alerting for the quantum password manager with real-time metrics, security event tracking, and automated alerting.

## 🚀 Quick Setup

```bash
# 1. Setup CloudWatch monitoring
chmod +x scripts/monitoring/cloudwatch-setup.sh
sudo ./scripts/monitoring/cloudwatch-setup.sh

# 2. Configure alarms and notifications
ALERT_EMAIL="admin@yourcompany.com" \
  ./scripts/monitoring/cloudwatch-alarms.sh

# 3. Test monitoring
./scripts/monitoring/log-analysis.sh
```

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `cloudwatch-setup.sh` | Install & configure CloudWatch Agent + custom metrics |
| `cloudwatch-alarms.sh` | Create 17 critical monitoring alarms |
| `log-analysis.sh` | Analyze logs for insights and security events |

## 📊 Monitoring Coverage

### 🏥 Application Health
- **Application Uptime**: HTTP health check every 5 minutes
- **Database Connectivity**: PostgreSQL connection status
- **Quantum Crypto Status**: ML-KEM-768/ML-DSA-65 health
- **Process Monitoring**: PM2 backend/frontend process counts
- **Response Time**: API response time tracking

### ⚡ Performance Metrics
- **System Resources**: CPU, Memory, Disk usage
- **Network**: TCP connections, I/O metrics
- **Application Memory**: Backend process memory consumption
- **Disk I/O**: Read/write operations and latency

### 🔒 Security Monitoring  
- **Failed Logins**: Brute force detection (>10 attempts)
- **Security Events**: Suspicious activity tracking
- **Audit Logs**: Complete security event logging
- **SSL Certificate**: Expiration monitoring (30-day warning)
- **Input Validation**: Injection attempt detection

### 💾 Backup & Infrastructure
- **Backup Success**: Daily backup completion tracking
- **Backup Failures**: Alert on any backup errors
- **Nginx Health**: Web server status monitoring
- **Storage Usage**: S3 backup storage monitoring

## 🚨 Alert Thresholds

### 🔴 CRITICAL Alarms (Immediate Action)
- **Application Down**: Health check fails for 10 minutes
- **Database Down**: PostgreSQL unreachable for 10 minutes  
- **Quantum Down**: Quantum crypto service unavailable
- **Backend Processes**: PM2 processes stopped
- **System Critical**: Composite alarm (any critical service down)

### 🟡 WARNING Alarms (Monitor & Plan)
- **High CPU**: >80% for 15 minutes
- **High Memory**: >85% for 10 minutes
- **Low Disk Space**: >90% used for 10 minutes
- **SSL Expiring**: <30 days remaining
- **High Response Time**: >5 seconds average
- **Failed Logins**: >10 attempts in 5 minutes
- **No Backups**: No successful backup in 24 hours

## 📈 Custom Metrics

The monitoring system tracks Quankey-specific metrics:

```bash
# Application Health Metrics
Quankey/Application/ApplicationHealth         # 1=up, 0=down
Quankey/Application/DatabaseHealth           # 1=connected, 0=down  
Quankey/Application/QuantumCryptoHealth      # 1=active, 0=down
Quankey/Application/ApplicationResponseTime  # milliseconds

# Process & Performance
Quankey/Application/BackendProcesses         # count of running backend processes
Quankey/Application/FrontendProcesses        # count of running frontend processes
Quankey/Application/BackendMemoryUsage       # MB used by backend
Quankey/Application/NginxHealth              # 1=running, 0=down

# Security Metrics
Quankey/Application/SecurityEvents           # count per hour
Quankey/Application/FailedLogins             # failed auth attempts
Quankey/Application/QuantumImplementation    # 1=initialized, 0=failed

# Operations
Quankey/Application/BackupSuccess            # successful backups count
Quankey/Application/BackupErrors             # backup failure count
Quankey/Application/SSLCertificateDaysRemaining  # days until SSL expires
```

## 📊 CloudWatch Dashboard

The setup creates a comprehensive dashboard: **Quankey-Production-Overview**

**Widgets include:**
1. **Service Health Status** - Real-time up/down status
2. **System Resources** - CPU, Memory, Disk usage graphs  
3. **Application Processes** - Process count and quantum status
4. **Security & Operations** - Security events, backups, SSL status

Access: https://console.aws.amazon.com/cloudwatch/home#dashboards:name=Quankey-Production-Overview

## 🔍 Log Analysis

### Manual Analysis:
```bash
# Basic analysis (last 24 hours)
./scripts/monitoring/log-analysis.sh

# Custom time period  
ANALYSIS_PERIOD=48 ./scripts/monitoring/log-analysis.sh

# JSON output for automation
OUTPUT_FORMAT=json ./scripts/monitoring/log-analysis.sh
```

### Automated Insights:
- **Error Rate Calculation**: Percentage of failed requests
- **Security Event Categorization**: Group by event type  
- **Top IP Analysis**: Identify high-traffic sources
- **Quantum Operation Tracking**: ML-KEM/ML-DSA usage
- **Performance Trending**: Response time patterns

### Sample Output:
```
📊 QUANKEY LOG ANALYSIS REPORT
==================================================

📈 APPLICATION METRICS (Last 24 hours)
   Total Requests: 1,247
   Errors: 23 (1.8% error rate)
   Warnings: 45
   Quantum Operations: 456

🔒 SECURITY METRICS  
   Security Events: 12
   Failed Authentications: 3
   Unique IPs: 78

💾 BACKUP STATUS
   Successful Backups: 4
   Failed Backups: 0
   Latest Backup: 20250809_184606

💡 RECOMMENDATIONS
   ✅ System running normally
   ✅ Low error rate (1.8%)
   ✅ Backups completing successfully
```

## ⚙️ Configuration

### Environment Variables:
```bash
# CloudWatch Setup
export AWS_DEFAULT_REGION=us-east-1
export ENVIRONMENT=production
export LOG_GROUP_PREFIX="/aws/ec2/quankey"

# Alerting
export ALERT_EMAIL="admin@yourcompany.com"
export SNS_TOPIC_NAME="quankey-alerts"

# Log Analysis
export LOG_DIR="/var/log/quankey" 
export ANALYSIS_PERIOD=24
```

### AWS Permissions Required:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow", 
      "Action": [
        "cloudwatch:PutMetricData",
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:PutDashboard",
        "cloudwatch:PutCompositeAlarm",
        "logs:CreateLogGroup",
        "logs:CreateLogStream", 
        "logs:PutLogEvents",
        "logs:PutRetentionPolicy",
        "sns:CreateTopic",
        "sns:Subscribe"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🔧 Maintenance

### Daily Tasks:
```bash
# Check monitoring health
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -m ec2 -q

# Review log analysis
./scripts/monitoring/log-analysis.sh | grep "RECOMMENDATIONS" -A 10

# Verify metrics collection  
/usr/local/bin/quankey-metrics
```

### Weekly Tasks:
```bash
# Review alarm history
aws cloudwatch describe-alarm-history --alarm-name "Quankey-Application-Down"

# Check dashboard performance
# Visit CloudWatch console and review trends

# Analyze top security events
OUTPUT_FORMAT=json ./scripts/monitoring/log-analysis.sh | jq '.top_security_events'
```

### Monthly Tasks:
```bash
# Review and tune alarm thresholds
aws cloudwatch describe-alarms --alarm-name-prefix "Quankey-"

# Cleanup old log data (if needed)
aws logs describe-log-groups --log-group-name-prefix "/aws/ec2/quankey"

# Performance baseline review
# Compare metrics month-over-month
```

## 🚨 Troubleshooting

### CloudWatch Agent Issues:
```bash
# Check agent status
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -m ec2 -q

# View agent logs
sudo tail -f /opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log

# Restart agent
sudo systemctl restart amazon-cloudwatch-agent
```

### Missing Metrics:
```bash
# Test custom metrics manually
/usr/local/bin/quankey-metrics

# Check cron job
crontab -l | grep quankey-metrics

# Verify AWS credentials
aws sts get-caller-identity
```

### Alarm Not Triggering:
```bash
# Check alarm state
aws cloudwatch describe-alarms --alarm-names "Quankey-Application-Down"

# Test alarm manually
aws cloudwatch set-alarm-state \
  --alarm-name "Quankey-Application-Down" \
  --state-value ALARM \
  --state-reason "Testing"

# Verify SNS subscription
aws sns list-subscriptions-by-topic --topic-arn "arn:aws:sns:region:account:quankey-alerts"
```

## 📊 Cost Optimization

### CloudWatch Costs:
- **Custom Metrics**: ~$0.30/metric/month
- **Log Ingestion**: ~$0.50/GB
- **Log Storage**: ~$0.03/GB/month  
- **Alarms**: $0.10/alarm/month
- **Dashboard**: $3.00/month

### Estimated Monthly Cost:
- **Metrics**: ~$15 (50 custom metrics)
- **Logs**: ~$10 (estimated 20GB/month)
- **Alarms**: ~$2 (17 alarms)
- **Dashboard**: $3
- **Total**: ~$30/month

### Cost Reduction Tips:
1. **Adjust log retention** (currently 90 days)
2. **Filter noisy logs** before sending to CloudWatch
3. **Use composite alarms** to reduce alarm count
4. **Monitor high-cardinality metrics**

## 📞 Support

### Common Issues:
1. **"Metrics not appearing"** → Check IAM permissions and agent config
2. **"Alarms not triggering"** → Verify SNS topic and email subscription
3. **"High CloudWatch costs"** → Review log volume and retention settings
4. **"Agent stopped"** → Check system resources and restart service

### Useful Commands:
```bash
# View all Quankey metrics
aws cloudwatch list-metrics --namespace "Quankey/Application"

# Get metric statistics
aws cloudwatch get-metric-statistics \
  --namespace "Quankey/Application" \
  --metric-name "ApplicationHealth" \
  --start-time $(date -d '1 hour ago' -Iseconds) \
  --end-time $(date -Iseconds) \
  --period 300 \
  --statistics Average

# Export dashboard
aws cloudwatch get-dashboard --dashboard-name "Quankey-Production-Overview"
```

---

🔬 **Quantum-Ready Monitoring**: This system is specifically designed to monitor the quantum cryptography implementation in Quankey, providing visibility into ML-KEM-768 and ML-DSA-65 operations alongside traditional application metrics.