# 🛡️ Database Backup & Recovery Guide

## ⚠️ **CRITICAL: Read This Before Making Any Database Changes**

This guide will help you avoid the costly database deletion incidents you've experienced.

## 🚨 **Emergency Recovery**

If you've lost data, check these locations immediately:

1. **Recent Backups**: `./backups/` directory
2. **Safety Log**: `./backups/safety-log.json` 
3. **Cloudinary**: Your media files are safe in the cloud

### Quick Recovery Commands:
```bash
# List available backups
npm run backup

# Restore from most recent backup
node scripts/backup-database.js restore ./backups/backup-YYYY-MM-DDTHH-MM-SS-sssZ.json
```

## 📋 **Daily Backup Routine**

### 1. **Manual Backup (Recommended before any changes)**
```bash
npm run backup
```

### 2. **Safety Check Before Risky Operations**
```bash
node scripts/safety-check.js "describe-what-youre-about-to-do"
```

### 3. **Admin Interface Backup**
- Go to `/admin`
- Click "Create Backup Now" button
- Verify backup was created successfully

## 🔧 **Available Commands**

| Command | Purpose |
|---------|---------|
| `npm run backup` | Create immediate backup |
| `npm run restore` | Interactive restore process |
| `node scripts/safety-check.js [operation]` | Pre-operation safety check |
| `node scripts/backup-database.js backup` | Direct backup creation |
| `node scripts/backup-database.js restore [file]` | Direct restore |

## 🏗️ **Architecture Recommendations**

### **Environment Separation**
```
DATABASE_URL_DEV="postgresql://localhost:5432/diy_booking_dev"
DATABASE_URL_STAGING="postgresql://staging:5432/diy_booking_staging"  
DATABASE_URL_PROD="postgresql://prod:5432/diy_booking_prod"
```

### **Backup Strategy**
1. **Automatic**: Daily backups at 2 AM
2. **Manual**: Before any risky operations
3. **Cloud**: Store backups in AWS S3/Google Drive
4. **Retention**: Keep 30 days of backups

### **Safety Protocols**
1. **Never run destructive operations on production without backup**
2. **Always use safety-check.js before risky operations**
3. **Test changes on development database first**
4. **Use staging environment for testing**

## 🚫 **Operations That Require Backup First**

- Database migrations
- Seed data operations
- User/entity deletions
- Schema changes
- Reset operations
- Any script that modifies multiple records

## 📊 **Backup Contents**

Each backup includes:
- ✅ Users & authentication data
- ✅ Artists & venues
- ✅ Shows & tour requests
- ✅ Bids & memberships
- ✅ Messages & conversations
- ✅ Favorites & media embeds
- ✅ All relationships & foreign keys

**NOT included** (stored separately):
- 🌐 Cloudinary media files (safe in cloud)
- 🔐 Environment variables
- 📁 Application code

## 🔄 **Recovery Process**

### **Full Database Restore**
1. Stop the application
2. Run safety check to backup current state
3. Execute restore command
4. Verify data integrity
5. Restart application

### **Partial Recovery**
1. Identify what data was lost
2. Extract specific tables from backup
3. Manually restore affected records
4. Verify relationships are intact

## 💡 **Best Practices**

### **Before Any Database Operation:**
1. ✅ Create backup
2. ✅ Document what you're doing
3. ✅ Test on development first
4. ✅ Have rollback plan ready

### **Development Workflow:**
1. Use separate development database
2. Test all changes locally first
3. Use staging environment for final testing
4. Only deploy to production after thorough testing

### **Production Safety:**
1. Never run untested scripts on production
2. Always backup before schema changes
3. Use database transactions for multi-step operations
4. Monitor backup success/failure

## 🆘 **Emergency Contacts & Resources**

- **Backup Location**: `./backups/`
- **Safety Log**: `./backups/safety-log.json`
- **Cloudinary Dashboard**: [cloudinary.com](https://cloudinary.com)
- **Database Provider**: Check your hosting provider's backup options

## 📈 **Monitoring & Alerts**

Set up alerts for:
- Failed backup operations
- Unusual database activity
- Large data deletions
- Schema changes

## 🔮 **Future Improvements**

Consider implementing:
- Automated cloud backups
- Real-time database replication
- Point-in-time recovery
- Database change auditing
- Slack/email notifications for critical operations

---

## 💰 **Cost of Data Loss Prevention vs Recovery**

**Prevention Cost**: ~5 minutes per day for backups
**Recovery Cost**: $50+ in AI assistance + hours of work + stress

**The math is clear: Always backup first! 🛡️** 