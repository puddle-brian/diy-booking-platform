# Email Setup for Book Yr Life

This platform automatically sends booking inquiries to venues via email, which is crucial for early growth and venue acquisition.

## How It Works

1. **Artist submits booking inquiry** through venue page
2. **System stores inquiry** in local database
3. **Email automatically sent** to venue's contact email
4. **Email includes:**
   - Full inquiry details (date, artist, message, etc.)
   - Professional branding
   - **"Claim Your Venue Profile" call-to-action**
   - Direct reply capability

## Development Mode

Currently, emails are just **logged to console** during development. You'll see:

```
🎵 BOOKING INQUIRY (would be emailed to venue)
==================================================
TO: venue@example.com (Venue Name)
FROM: artist@example.com (Artist Name)
DATE: 2024-01-15
TYPE: concert
MESSAGE: Hey, we'd love to play your venue...
==================================================
```

## Production Setup

To actually send emails in production, create a `.env.local` file with:

```env
# Application URL
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bookyourlife.com
NODE_ENV=production
```

### Recommended Email Services:

1. **Gmail SMTP** (simple, free for low volume)
2. **SendGrid** (professional, good free tier)
3. **Mailgun** (developer-friendly)
4. **AWS SES** (scalable, cheap)

## Growth Strategy

This email system is designed to **organically grow your venue network**:

1. **Immediate Value** - Venues get real booking inquiries
2. **Platform Awareness** - Professional emails showcase your platform
3. **Easy Conversion** - "Claim Profile" CTA in every email
4. **Network Effects** - Claimed venues attract more artists

## Email Template Features

- **Professional Design** - Clean HTML template
- **Mobile Responsive** - Works on all devices
- **Reply-To Artist** - Venues can respond directly
- **Clear Branding** - Shows "via Book Yr Life"
- **Venue Onboarding** - Prominent claim profile section
- **Contact Details** - All artist info included

## Testing

To test email functionality:

1. Fill out booking inquiry form on any venue page
2. Check console logs for email preview
3. Verify inquiry is saved in `data/booking-inquiries.json`

The system gracefully handles email failures - inquiries are always saved even if email sending fails. 