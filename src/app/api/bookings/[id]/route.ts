import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BookingInquiry, Show } from '../../../../../types';

const bookingsFilePath = path.join(process.cwd(), 'data', 'bookings.json');
const showsFilePath = path.join(process.cwd(), 'data', 'shows.json');

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

function readShows(): Show[] {
  try {
    if (!fs.existsSync(showsFilePath)) {
      return [];
    }
    const data = fs.readFileSync(showsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading shows file:', error);
    return [];
  }
}

function writeShows(shows: Show[]): void {
  try {
    const dir = path.dirname(showsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(showsFilePath, JSON.stringify(shows, null, 2));
  } catch (error) {
    console.error('Error writing shows file:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookings = readBookings();
    const booking = bookings.find(b => b.id === params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking inquiry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error in GET /api/bookings/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking inquiry' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const bookings = readBookings();
    const bookingIndex = bookings.findIndex(b => b.id === params.id);
    
    if (bookingIndex === -1) {
      return NextResponse.json(
        { error: 'Booking inquiry not found' },
        { status: 404 }
      );
    }
    
    const booking = bookings[bookingIndex];
    
    // Update booking inquiry
    const updatedBooking: BookingInquiry = {
      ...booking,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    bookings[bookingIndex] = updatedBooking;
    writeBookings(bookings);
    
    // If booking is being confirmed, create a show entry
    if (body.status === 'confirmed' && booking.status !== 'confirmed') {
      const shows = readShows();
      
      // Create basic show entry from booking inquiry
      const newShow: Show = {
        id: Date.now().toString(),
        artistId: booking.artistId,
        venueId: booking.venueId,
        date: booking.proposedDate,
        city: body.city || '',
        state: body.state || '',
        venueName: body.venueName || '',
        artistName: body.artistName || '',
        status: 'confirmed',
        capacity: body.capacity || 0,
        ageRestriction: body.ageRestriction || 'all-ages',
        guarantee: body.guarantee,
        doorDeal: body.doorDeal,
        ticketPrice: body.ticketPrice,
        expectedDraw: body.expectedDraw,
        walkoutPotential: body.walkoutPotential || 'medium',
        notes: body.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: body.createdBy || 'system',
      };
      
      shows.push(newShow);
      writeShows(shows);
      
      console.log(`🎉 Booking confirmed and show created: ${newShow.artistName} at ${newShow.venueName} on ${newShow.date}`);
    }
    
    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error in PATCH /api/bookings/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update booking inquiry' },
      { status: 500 }
    );
  }
} 