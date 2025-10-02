# Disaster Recovery Plan

## Executive Summary

This document outlines the disaster recovery (DR) procedures for the Kin2 Workforce Management Platform. It defines recovery objectives, backup strategies, and step-by-step restoration procedures to ensure business continuity.

## Recovery Objectives

### Recovery Point Objective (RPO)
- **Critical Data (Database)**: 15 minutes
- **Application Code**: Real-time (Git-based)
- **User-uploaded Files**: 1 hour
- **Configuration/Secrets**: Real-time (managed by Replit)

### Recovery Time Objective (RTO)
- **Critical Services**: 1 hour
- **Full Platform**: 4 hours
- **Complete Data Restoration**: 8 hours

## Backup Strategy

### 1. Database Backups (PostgreSQL/Neon)

#### Automated Backups
Neon Database provides automatic backups:
- **Point-in-Time Recovery (PITR)**: Up to 7 days retention
- **Continuous WAL archiving**: Every 15 minutes
- **Full snapshots**: Daily at 2:00 AM UTC

#### Manual Backup Creation

```bash
# Export full database dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Export schema only
pg_dump --schema-only $DATABASE_URL > schema_backup.sql

# Export data only
pg_dump --data-only $DATABASE_URL > data_backup.sql
```

#### Critical Tables to Prioritize
1. `users` - User accounts and authentication
2. `organizations` - Client organizations
3. `jobs` - Job postings and assignments
4. `shifts` - Shift schedules
5. `timesheets` - Time tracking records
6. `payments` - Payment transactions
7. `compliance_reports` - Regulatory compliance data

### 2. Application Code Backups

#### Git Repository
- **Primary**: Replit Git repository (auto-syncing)
- **Remote**: GitHub/GitLab (recommended for redundancy)
- **Frequency**: Real-time with each commit

```bash
# Add remote backup repository
git remote add backup https://github.com/organization/kin2-workforce-backup.git

# Push to backup
git push backup main
```

### 3. User-Uploaded Files (Object Storage)

#### Object Storage Backups
If using Replit Object Storage:
- **Automated sync**: Hourly to secondary region
- **Retention**: 30 days
- **Versioning**: Enabled for critical directories

```bash
# Manual backup of object storage
# (Placeholder - implement based on storage provider)
aws s3 sync s3://kin2-primary s3://kin2-backup --region us-west-2
```

### 4. Configuration and Secrets

#### Environment Variables
- **Storage**: Replit Secrets (encrypted, auto-backed up)
- **Backup**: Maintain encrypted copy in secure location

```bash
# Export secrets list (values redacted)
replit secrets list > secrets_inventory.txt
```

#### Critical Secrets to Track
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `OPENAI_API_KEY`
- `SENDGRID_API_KEY`
- `SESSION_SECRET`

## Disaster Scenarios & Recovery Procedures

### Scenario 1: Database Corruption/Loss

#### Detection
- Health check failures (`/api/health`)
- Database connection errors in logs
- User-reported data access issues

#### Recovery Steps

1. **Assess Damage**
   ```bash
   # Check database connectivity
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   
   # Verify table integrity
   psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
   ```

2. **Restore from Neon Backup (Preferred)**
   - Navigate to Neon Dashboard
   - Select "Restore" for your database
   - Choose point-in-time (within last 7 days)
   - Create new branch or restore to existing
   - Update `DATABASE_URL` environment variable

3. **Restore from Manual Backup**
   ```bash
   # Create new database
   createdb kin2_restored
   
   # Restore from dump
   psql $NEW_DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   
   # Verify restoration
   psql $NEW_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   
   # Update DATABASE_URL in environment
   ```

4. **Post-Recovery Validation**
   ```bash
   # Run schema validation
   npm run db:push
   
   # Test critical queries
   curl http://localhost:5000/api/health
   ```

**Expected RTO**: 30-60 minutes  
**Expected RPO**: 0-15 minutes (PITR) or last manual backup

### Scenario 2: Application Code Failure

#### Detection
- Build failures
- Runtime errors across all instances
- Deployment rollback triggers

#### Recovery Steps

1. **Rollback to Last Known Good Version**
   ```bash
   # View recent commits
   git log --oneline -10
   
   # Rollback to specific commit
   git reset --hard <commit-hash>
   
   # Force push (if needed)
   git push origin main --force
   ```

2. **Restore from Backup Repository**
   ```bash
   # Clone backup repository
   git clone https://github.com/organization/kin2-workforce-backup.git
   
   # Copy to production
   rsync -av kin2-workforce-backup/ /path/to/production/
   
   # Install dependencies
   npm install
   
   # Restart services
   npm run dev
   ```

3. **Deploy from Clean State**
   - Use Replit Rollback feature (if available)
   - Restore from checkpoint
   - Re-deploy from Git tag

**Expected RTO**: 15-30 minutes  
**Expected RPO**: 0 (real-time Git backups)

### Scenario 3: Complete Platform Outage

#### Detection
- All services unreachable
- Infrastructure provider outage
- Data center failure

#### Recovery Steps

1. **Immediate Response**
   - Activate incident response team
   - Notify stakeholders via status page
   - Switch to backup infrastructure (if available)

2. **Data Recovery**
   ```bash
   # Export latest available database backup
   pg_dump $BACKUP_DATABASE_URL > emergency_backup.sql
   
   # Download application code
   git clone https://github.com/organization/kin2-workforce.git
   
   # Retrieve object storage files
   # (Provider-specific commands)
   ```

3. **Redeploy to New Infrastructure**
   ```bash
   # Set up new Replit instance
   # - Import Git repository
   # - Configure environment variables
   # - Restore database from backup
   # - Restore object storage
   
   # Update DNS records
   # Point domain to new instance
   ```

4. **Validation & Testing**
   - Test authentication flows
   - Verify database connectivity
   - Test critical user journeys
   - Monitor error logs

**Expected RTO**: 2-4 hours  
**Expected RPO**: 15-60 minutes

### Scenario 4: Data Breach/Ransomware

#### Detection
- Unauthorized database access
- Encrypted files/database
- Suspicious activity alerts

#### Recovery Steps

1. **Immediate Isolation**
   ```bash
   # Revoke all API keys
   # Rotate all secrets
   # Disable compromised accounts
   
   # Change database password
   psql $DATABASE_URL -c "ALTER USER your_user WITH PASSWORD 'new_password';"
   ```

2. **Assess Damage**
   - Identify compromised data
   - Check audit logs
   - Review access patterns

3. **Clean Restoration**
   ```bash
   # Restore from pre-breach backup
   # (Choose backup from before attack)
   
   psql $CLEAN_DATABASE_URL < backup_before_breach.sql
   
   # Verify integrity
   # Run security scans
   ```

4. **Security Hardening**
   - Enable 2FA for all accounts
   - Implement IP whitelisting
   - Review and update access controls
   - Conduct security audit

**Expected RTO**: 4-8 hours  
**Expected RPO**: Varies (may lose data from attack period)

## Backup Verification Procedures

### Monthly Backup Tests

```bash
#!/bin/bash
# backup-test.sh

# 1. Create test database
createdb kin2_test_restore

# 2. Restore latest backup
pg_dump $DATABASE_URL | psql $TEST_DATABASE_URL

# 3. Verify record counts
echo "Verifying user count..."
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM users;"

echo "Verifying job count..."
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM jobs;"

# 4. Test critical queries
echo "Testing authentication query..."
psql $TEST_DATABASE_URL -c "SELECT id, email FROM users LIMIT 5;"

# 5. Cleanup
dropdb kin2_test_restore

echo "Backup verification complete!"
```

Run monthly: First Monday of each month at 3:00 AM

### Quarterly Disaster Recovery Drills

**Full DR Exercise Schedule**:
- **Q1**: Database restoration drill
- **Q2**: Application redeployment drill
- **Q3**: Complete platform migration drill
- **Q4**: Security breach response drill

## Data Retention Policy

| Data Type | Retention Period | Backup Location |
|-----------|------------------|-----------------|
| User data | 7 years | Primary + Archive |
| Financial records | 7 years | Primary + Compliance Archive |
| Audit logs | 3 years | Primary + Archive |
| System logs | 90 days | Primary |
| Deleted user data | 30 days | Soft delete + Backup |
| Session data | 30 days | Primary |

## Communication Plan

### Stakeholder Notification

**During Incident**:
1. **Detection (T+0)**: Alert on-call engineer
2. **Assessment (T+15min)**: Notify technical team
3. **Escalation (T+30min)**: Notify management
4. **User Impact (T+1hr)**: Update status page, send user notifications

**Communication Channels**:
- Status Page: https://status.kin2workforce.com
- Email: Technical team + Management
- Slack: #incident-response channel
- SMS: On-call rotation

### Post-Incident

**Within 24 Hours**:
- Root cause analysis
- Timeline of events
- Impact assessment

**Within 1 Week**:
- Detailed incident report
- Lessons learned
- Action items for prevention

## Preventive Measures

### Continuous Monitoring
- Database health checks every 60 seconds
- Application health endpoint (`/api/health`)
- Error rate monitoring (threshold: >5% error rate)
- Performance monitoring (query duration >1s)

### Automated Alerts
```javascript
// Example: Database connection monitoring
setInterval(async () => {
  try {
    await db.execute(sql`SELECT 1`);
  } catch (error) {
    logger.error('Database health check failed', { error });
    // Trigger alert to on-call engineer
    notifyIncident('DATABASE_DOWN', error);
  }
}, 60000);
```

### Regular Maintenance
- **Weekly**: Database vacuum and analyze
- **Monthly**: Backup verification tests
- **Quarterly**: DR drill exercises
- **Annually**: Full security audit

## Contact Information

### On-Call Rotation
- **Primary**: [Phone/Email]
- **Secondary**: [Phone/Email]
- **Manager**: [Phone/Email]

### Vendor Support
- **Replit Support**: support@replit.com
- **Neon Database**: support@neon.tech
- **Stripe Support**: support@stripe.com

### Emergency Procedures
1. Call on-call engineer
2. Create incident in incident management system
3. Follow relevant recovery procedure from this document
4. Document all actions taken
5. Communicate with stakeholders

## Appendix

### A. Backup Scripts

See `/scripts/backup/` directory:
- `daily-backup.sh` - Automated daily backup
- `manual-backup.sh` - Manual backup creation
- `verify-backup.sh` - Backup verification
- `restore-backup.sh` - Guided restoration

### B. Recovery Checklists

**Database Recovery Checklist**:
- [ ] Identify failure point
- [ ] Stop application traffic
- [ ] Create backup of current state
- [ ] Restore from backup
- [ ] Verify data integrity
- [ ] Run schema migrations
- [ ] Test critical queries
- [ ] Resume application traffic
- [ ] Monitor for issues
- [ ] Document incident

**Application Recovery Checklist**:
- [ ] Identify failing component
- [ ] Review recent deployments
- [ ] Rollback to stable version
- [ ] Clear caches
- [ ] Restart services
- [ ] Verify functionality
- [ ] Monitor error rates
- [ ] Document incident

### C. Testing Schedule

| Test Type | Frequency | Next Scheduled |
|-----------|-----------|----------------|
| Backup verification | Monthly | 1st Monday |
| Database restore | Quarterly | Q1, Q2, Q3, Q4 |
| Full DR drill | Annually | December |
| Security audit | Annually | June |

---

**Document Version**: 1.0  
**Last Updated**: October 2, 2025  
**Next Review**: January 2, 2026  
**Owner**: Platform Engineering Team
