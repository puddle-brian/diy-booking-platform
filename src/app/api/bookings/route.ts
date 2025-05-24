import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BookingInquiry } from '../../../../types';

const bookingsFilePath = path.join(process.cwd(), 'data', 'bookings.json');

function readBookings(): BookingInquiry[] {
  try {
    if (!fs.existsSync(bookingsFilePath)) {
      return [];
    }
    const data = fs.readFileSync(bookingsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bookings file:', error);
    return [];
  }
}

function writeBookings(bookings: BookingInquiry[]): void {
  try {
    const dir = path.dirname(bookingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(bookingsFilePath, JSON.stringify(bookings, null, 2));
  } catch (error) {
    console.error('Error writing bookings file:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const venueId = searchParams.get('venueId');
    
    let bookings = readBookings();
    
    // Filter by artistId or venueId if provided
    if (artistId) {
      bookings = bookings.filter(booking => booking.artistId === artistId);
    }
    if (venueId) {
      bookings = bookings.filter(booking => booking.venueId === venueId);
    }
    
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['artistId', 'venueId', 'proposedDate', 'message', 'artistContact'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.artistContact.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const bookings = readBookings();
    
    // Generate new ID
    const newId = Date.now().toString();
    
    // Create new booking inquiry
    const newBooking: BookingInquiry = {
      id: newId,
      artistId: body.artistId,
      venueId: body.venueId,
      proposedDate: body.proposedDate,
      status: 'pending',
      message: body.message,
      artistContact: {
        name: body.artistContact.name,
        email: body.artistContact.email,
        phone: body.artistContact.phone || '',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    writeBookings(bookings);

    // In a real app, you'd send email notifications here
    console.log(`📅 New booking inquiry from ${body.artistContact.name} for ${body.proposedDate}`);

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json(
      { error: 'Failed to create booking inquiry' },
      { status: 500 }
    );
  }
} 