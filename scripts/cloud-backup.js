const { backupDatabase } = require('./backup-database');
const fs = require('fs');
const path = require('path');

// Cloud backup providers
class CloudBackupManager {
  constructor(config = {}) {
    this.config = {
      aws: config.aws || {
        enabled: process.env.AWS_BACKUP_ENABLED === 'true',
        bucket: process.env.AWS_BACKUP_BUCKET,
        region: process.env.AWS_BACKUP_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      googleDrive: config.googleDrive || {
        enabled: process.env.GOOGLE_DRIVE_BACKUP_ENABLED === 'true',
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
        serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      },
      dropbox: config.dropbox || {
        enabled: process.env.DROPBOX_BACKUP_ENABLED === 'true',
        accessToken: process.env.DROPBOX_ACCESS_TOKEN,
        folder: process.env.DROPBOX_BACKUP_FOLDER || '/diy-booking-backups'
      }
    };
  }

  async createAndUploadBackup() {
    try {
      console.log('🔄 Creating database backup...');
      
      // Create local backup first
      const localBackupFile = await backupDatabase();
      console.log(`✅ Local backup created: ${localBackupFile}`);

      const uploadResults = [];

      // Upload to enabled cloud providers
      if (this.config.aws.enabled) {
        try {
          const awsResult = await this.uploadToAWS(localBackupFile);
          uploadResults.push({ provider: 'AWS S3', success: true, url: awsResult });
          console.log(`✅ AWS S3 upload successful: ${awsResult}`);
        } catch (error) {
          console.error('❌ AWS S3 upload failed:', error.message);
          uploadResults.push({ provider: 'AWS S3', success: false, error: error.message });
        }
      }

      if (this.config.googleDrive.enabled) {
        try {
          const driveResult = await this.uploadToGoogleDrive(localBackupFile);
          uploadResults.push({ provider: 'Google Drive', success: true, url: driveResult });
          console.log(`✅ Google Drive upload successful: ${driveResult}`);
        } catch (error) {
          console.error('❌ Google Drive upload failed:', error.message);
          uploadResults.push({ provider: 'Google Drive', success: false, error: error.message });
        }
      }

      if (this.config.dropbox.enabled) {
        try {
          const dropboxResult = await this.uploadToDropbox(localBackupFile);
          uploadResults.push({ provider: 'Dropbox', success: true, url: dropboxResult });
          console.log(`✅ Dropbox upload successful: ${dropboxResult}`);
        } catch (error) {
          console.error('❌ Dropbox upload failed:', error.message);
          uploadResults.push({ provider: 'Dropbox', success: false, error: error.message });
        }
      }

      // Clean up old local backups (keep last 5)
      await this.cleanupOldLocalBackups();

      return {
        localBackup: localBackupFile,
        cloudUploads: uploadResults,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Backup and upload failed:', error);
      throw error;
    }
  }

  async uploadToAWS(filePath) {
    // AWS S3 upload implementation
    const AWS = require('aws-sdk');
    
    const s3 = new AWS.S3({
      accessKeyId: this.config.aws.accessKeyId,
      secretAccessKey: this.config.aws.secretAccessKey,
      region: this.config.aws.region
    });

    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    const params = {
      Bucket: this.config.aws.bucket,
      Key: `database-backups/${fileName}`,
      Body: fileContent,
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256'
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  }

  async uploadToGoogleDrive(filePath) {
    // Google Drive upload implementation
    const { google } = require('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: this.config.googleDrive.serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    const drive = google.drive({ version: 'v3', auth });
    const fileName = path.basename(filePath);

    const fileMetadata = {
      name: fileName,
      parents: [this.config.googleDrive.folderId]
    };

    const media = {
      mimeType: 'application/json',
      body: fs.createReadStream(filePath)
    };

    const result = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    return `https://drive.google.com/file/d/${result.data.id}/view`;
  }

  async uploadToDropbox(filePath) {
    // Dropbox upload implementation
    const fetch = require('node-fetch');
    
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const dropboxPath = `${this.config.dropbox.folder}/${fileName}`;

    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.dropbox.accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'add',
          autorename: true
        }),
        'Content-Type': 'application/octet-stream'
      },
      body: fileContent
    });

    if (!response.ok) {
      throw new Error(`Dropbox upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return `Dropbox: ${result.path_display}`;
  }

  async cleanupOldLocalBackups() {
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          stats: fs.statSync(path.join(backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Keep only the 5 most recent backups
      const filesToDelete = files.slice(5);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Deleted old backup: ${file.name}`);
      }

      console.log(`📁 Kept ${Math.min(files.length, 5)} most recent local backups`);
    } catch (error) {
      console.error('⚠️ Failed to cleanup old backups:', error.message);
    }
  }

  async listCloudBackups() {
    const backups = {
      aws: [],
      googleDrive: [],
      dropbox: []
    };

    // Implementation to list backups from each provider
    // This would query each cloud service for available backups
    
    return backups;
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  
  if (command === 'backup') {
    const manager = new CloudBackupManager();
    const result = await manager.createAndUploadBackup();
    
    console.log('\\n🎉 Backup Summary:');
    console.log(`📁 Local: ${result.localBackup}`);
    console.log('☁️ Cloud uploads:');
    result.cloudUploads.forEach(upload => {
      const status = upload.success ? '✅' : '❌';
      console.log(`   ${status} ${upload.provider}: ${upload.success ? upload.url : upload.error}`);
    });
    
  } else if (command === 'list') {
    const manager = new CloudBackupManager();
    const backups = await manager.listCloudBackups();
    console.log('☁️ Cloud backups:', backups);
    
  } else {
    console.log('Usage:');
    console.log('  node scripts/cloud-backup.js backup');
    console.log('  node scripts/cloud-backup.js list');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CloudBackupManager }; 