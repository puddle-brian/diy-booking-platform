import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BookingInquiry } from '../../../../types';
import { sendBookingInquiryEmail, logBookingInquiry } from '../../../lib/email';

const DATA_DIR = path.join(process.cwd(), 'data');
const INQUIRIES_FILE = path.join(DATA_DIR, 'booking-inquiries.json');
const VENUES_FILE = path.join(DATA_DIR, 'venues.json');
const ARTISTS_FILE = path.join(DATA_DIR, 'artists.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize inquiries file if it doesn't exist
if (!fs.existsSync(INQUIRIES_FILE)) {
  fs.writeFileSync(INQUIRIES_FILE, JSON.stringify([], null, 2));
}

function readInquiries(): BookingInquiry[] {
  try {
    const data = fs.readFileSync(INQUIRIES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading inquiries:', error);
    return [];
  }
}

function writeInquiries(inquiries: BookingInquiry[]): void {
  try {
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2));
  } catch (error) {
    console.error('Error writing inquiries:', error);
    throw error;
  }
}

function readVenues(): any[] {
  try {
    const data = fs.readFileSync(VENUES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading venues:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const recipientId = url.searchParams.get('recipientId');
    const inquirerId = url.searchParams.get('inquirerId');
    
    const inquiries = readInquiries();
    
    let filteredInquiries = inquiries;
    
    if (recipientId) {
      filteredInquiries = filteredInquiries.filter(
        inquiry => inquiry.recipientId === recipientId
      );
    }
    
    if (inquirerId) {
      filteredInquiries = filteredInquiries.filter(
        inquiry => inquiry.inquirerId === inquirerId
      );
    }
    
    // Sort by creation date (newest first)
    filteredInquiries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return NextResponse.json(filteredInquiries);
  } catch (error) {
    console.error('Error fetching booking inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking inquiries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['inquirerName', 'inquirerEmail', 'recipientId', 'recipientName', 'recipientType', 'proposedDate', 'message'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Determine inquiry direction and types from request
    const recipientType = body.recipientType; // 'venue' or 'artist'
    const inquirerType = recipientType === 'venue' ? 'artist' : 'venue'; // opposite of recipient
    const inquiryDirection = `${inquirerType}-to-${recipientType}`;

    // Create new inquiry
    const inquiry: BookingInquiry = {
      id: Date.now().toString(),
      type: inquiryDirection as 'artist-to-venue' | 'venue-to-artist',
      inquirerType: inquirerType as 'artist' | 'venue',
      inquirerId: body.inquirerId || 'anonymous',
      inquirerName: body.inquirerName,
      inquirerEmail: body.inquirerEmail,
      inquirerPhone: body.inquirerPhone,
      recipientType: recipientType as 'artist' | 'venue',
      recipientId: body.recipientId,
      recipientName: body.recipientName,
      proposedDate: body.proposedDate,
      alternativeDates: body.alternativeDates,
      eventType: body.eventType || 'concert',
      expectedAttendance: body.expectedAttendance,
      guarantee: body.guarantee,
      doorSplit: body.doorSplit,
      ticketPrice: body.ticketPrice,
      message: body.message,
      riders: body.riders,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save inquiry to database
    const inquiries = readInquiries();
    inquiries.push(inquiry);
    writeInquiries(inquiries);

    // Find the recipient (venue or artist) to get their email
    let recipientEmail = '';
    let recipientName = '';
    
    if (inquiry.recipientType === 'venue') {
      // Read venues to find the recipient venue
      const venuesData = fs.readFileSync(VENUES_FILE, 'utf8');
      const venues = JSON.parse(venuesData);
      const venue = venues.find((v: any) => v.id === inquiry.recipientId);
      
      if (venue) {
        recipientEmail = venue.contact?.email || '';
        recipientName = venue.name || '';
      }
    } else if (inquiry.recipientType === 'artist') {
      // Read artists to find the recipient artist
      const artistsData = fs.readFileSync(ARTISTS_FILE, 'utf8');
      const artists = JSON.parse(artistsData);
      const artist = artists.find((a: any) => a.id === inquiry.recipientId);
      
      if (artist) {
        recipientEmail = artist.contact?.email || '';
        recipientName = artist.name || '';
      }
    }
    
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient contact information not found' },
        { status: 404 }
      );
    }

    // Send email to venue
    try {
      // For development, we'll use the logging function
      // In production, switch to sendBookingInquiryEmail when SMTP is configured
      if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
        await sendBookingInquiryEmail(inquiry, recipientEmail, recipientName);
      } else {
        // Development mode - just log the email
        await logBookingInquiry(inquiry, recipientEmail, recipientName);
      }
    } catch (emailError) {
      console.error('Failed to send email, but inquiry was saved:', emailError);
      // Don't fail the request if email fails - inquiry is already saved
    }

    return NextResponse.json(
      { 
        message: 'Booking inquiry submitted successfully',
        inquiry: inquiry
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to submit booking inquiry' },
      { status: 500 }
    );
  }
} 