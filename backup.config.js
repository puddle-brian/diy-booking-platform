module.exports = {
  // Backup settings
  retentionDays: 30, // Keep backups for 30 days
  autoBackupEnabled: true,
  backupSchedule: '0 2 * * *', // Daily at 2 AM (cron format)
  
  // Backup locations
  localBackupDir: './backups',
  
  // Cloud backup settings (optional)
  cloudBackup: {
    enabled: false, // Set to true to enable cloud backups
    provider: 'aws-s3', // or 'google-drive', 'dropbox'
    bucket: 'your-backup-bucket',
    region: 'us-east-1'
  },
  
  // What to backup
  includeTables: [
    'users',
    'artists', 
    'venues',
    'locations',
    'shows',
    'tourRequests',
    'bids',
    'memberships',
    'conversations',
    'messages',
    'favorites',
    'mediaEmbeds',
    'feedback'
  ],
  
  // Safety settings
  requireConfirmation: true, // Require confirmation before restore
  maxBackupSize: '100MB', // Alert if backup exceeds this size
  
  // Notifications (optional)
  notifications: {
    enabled: false,
    email: 'your-email@example.com',
    webhook: null // Slack webhook URL
  }
}; 