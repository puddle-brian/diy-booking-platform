import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BookingInquiry, BookingResponse } from '../../../../../types/index';

const DATA_DIR = path.join(process.cwd(), 'data');
const INQUIRIES_FILE = path.join(DATA_DIR, 'booking-inquiries.json');

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
    throw new Error('Failed to save inquiry');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inquiries = readInquiries();
    const inquiry = inquiries.find(i => i.id === id);
    
    if (!inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiry' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const inquiries = readInquiries();
    const inquiryIndex = inquiries.findIndex(i => i.id === id);
    
    if (inquiryIndex === -1) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }
    
    const inquiry = inquiries[inquiryIndex];
    
    // Handle different update operations
    if (body.action === 'mark-viewed') {
      inquiry.status = 'viewed';
      inquiry.viewedAt = new Date().toISOString();
    } else if (body.action === 'update-status') {
      inquiry.status = body.status;
      if (body.status === 'responded') {
        inquiry.respondedAt = new Date().toISOString();
      }
    } else if (body.action === 'add-response') {
      // Add a response to the inquiry
      const response: BookingResponse = {
        id: Date.now().toString(),
        inquiryId: id,
        responderId: body.responderId,
        responderName: body.responderName,
        responderEmail: body.responderEmail,
        message: body.message,
        status: body.responseStatus,
        counterDate: body.counterDate,
        counterGuarantee: body.counterGuarantee,
        counterDoorSplit: body.counterDoorSplit,
        createdAt: new Date().toISOString()
      };
      
      if (!inquiry.responses) {
        inquiry.responses = [];
      }
      inquiry.responses.push(response);
      inquiry.status = 'responded';
      inquiry.respondedAt = new Date().toISOString();
    }
    
    inquiry.updatedAt = new Date().toISOString();
    inquiries[inquiryIndex] = inquiry;
    writeInquiries(inquiries);
    
    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to update inquiry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inquiries = readInquiries();
    const filteredInquiries = inquiries.filter(i => i.id !== id);
    
    if (filteredInquiries.length === inquiries.length) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }
    
    writeInquiries(filteredInquiries);
    
    return NextResponse.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to delete inquiry' },
      { status: 500 }
    );
  }
} 