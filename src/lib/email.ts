import nodemailer from 'nodemailer';
import { BookingInquiry } from '../../types';

// Email configuration - you'll want to use environment variables for production
const transporter = nodemailer.createTransport({
  // For development, you can use a service like Gmail, SendGrid, or Mailgun
  // This is a basic setup - you'll need to configure with your email service
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendBookingInquiryEmail(inquiry: BookingInquiry, recipientEmail: string, recipientName: string) {
  const inquiryDate = new Date(inquiry.proposedDate).toLocaleDateString();
  const recipientType = inquiry.recipientType;
  const inquirerType = inquiry.inquirerType;
  
  const subject = `Booking Inquiry from ${inquiry.inquirerName} via Book Yr Life`;
  
  // Create different email content based on the direction of the inquiry
  const platformIntro = recipientType === 'venue' 
    ? `A${inquirerType === 'artist' ? 'n artist' : ' venue'} has reached out to your venue through Book Yr Life`
    : `A venue has reached out to your ${inquirerType === 'artist' ? 'artist project' : 'venue'} through Book Yr Life`;
    
  const claimText = recipientType === 'venue'
    ? 'venue profile'
    : 'artist profile';
    
  const claimUrl = recipientType === 'venue'
    ? `https://bookyourlife.com/venues/${inquiry.recipientId}`
    : `https://bookyourlife.com/artists/${inquiry.recipientId}`;
  
  const emailContent = `
📅 BOOKING INQUIRY

${platformIntro} - this is exactly the kind of connection we facilitate!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FROM: ${inquiry.inquirerName} (${inquiry.inquirerEmail})
${inquiry.inquirerPhone ? `PHONE: ${inquiry.inquirerPhone}` : ''}

TO: ${recipientName}

PROPOSED DATE: ${inquiryDate}
${inquiry.alternativeDates?.length ? `ALTERNATIVE DATES: ${inquiry.alternativeDates.join(', ')}` : ''}
EVENT TYPE: ${inquiry.eventType}
${inquiry.expectedAttendance ? `EXPECTED ATTENDANCE: ${inquiry.expectedAttendance}` : ''}

${inquiry.guarantee ? `GUARANTEE: $${inquiry.guarantee}` : ''}
${inquiry.doorSplit ? `DOOR SPLIT: ${inquiry.doorSplit}` : ''}
${inquiry.ticketPrice ? `TICKET PRICE: $${inquiry.ticketPrice}` : ''}

MESSAGE:
${inquiry.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎵 ABOUT BOOK YR LIFE

This inquiry came through Book Yr Life, a DIY booking platform inspired by the legendary "Book Your Own Fuckin' Life" zine. We connect underground artists with venues in the spirit of true DIY culture.

🚀 CLAIM YOUR ${claimText.toUpperCase()}

Want to manage your bookings through our platform and connect with more ${recipientType === 'venue' ? 'artists' : 'venues'}?

→ Visit: ${claimUrl}
→ Click "Claim This ${recipientType === 'venue' ? 'Venue' : 'Artist'}"
→ Start managing your bookings professionally

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To respond to this inquiry, simply reply to this email or contact ${inquiry.inquirerName} directly at ${inquiry.inquirerEmail}.

Keep the DIY spirit alive!
Book Yr Life Team
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'noreply@bookyourlife.com',
      to: recipientEmail,
      subject: subject,
      text: emailContent
    });
    
    console.log(`✅ Booking inquiry email sent to ${recipientEmail}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

// For development/testing without SMTP setup
export async function logBookingInquiry(inquiry: BookingInquiry, recipientEmail: string, recipientName: string) {
  const recipientType = inquiry.recipientType;
  const inquirerType = inquiry.inquirerType;
  
  console.log('🎵 BOOKING INQUIRY (would be emailed to ' + recipientType + ')');
  console.log('==================================================');
  console.log(`TO: ${recipientEmail} (${recipientName})`);
  console.log(`FROM: ${inquiry.inquirerEmail} (${inquiry.inquirerName})`);
  console.log(`DATE: ${inquiry.proposedDate}`);
  console.log(`TYPE: ${inquiry.eventType}`);
  console.log(`MESSAGE: ${inquiry.message}`);
  console.log('==================================================');
} 