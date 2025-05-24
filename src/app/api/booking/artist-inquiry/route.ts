import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ArtistInquiry {
  id: string;
  artistId: string;
  artistName: string;
  venueName: string;
  venueEmail: string;
  venuePhone?: string;
  message: string;
  showDate?: string;
  timestamp: string;
  status: 'sent' | 'replied' | 'archived';
}

const INQUIRIES_FILE = path.join(process.cwd(), 'data', 'artist-inquiries.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(INQUIRIES_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load existing inquiries
const loadInquiries = (): ArtistInquiry[] => {
  try {
    if (!fs.existsSync(INQUIRIES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(INQUIRIES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading artist inquiries:', error);
    return [];
  }
};

// Save inquiries
const saveInquiries = (inquiries: ArtistInquiry[]) => {
  try {
    ensureDataDir();
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2));
  } catch (error) {
    console.error('Error saving artist inquiries:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { artistId, artistName, venueName, venueEmail, message } = body;
    
    if (!artistId || !artistName || !venueName || !venueEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(venueEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Load existing inquiries
    const inquiries = loadInquiries();

    // Create new inquiry
    const newInquiry: ArtistInquiry = {
      id: Date.now().toString(),
      artistId,
      artistName,
      venueName: venueName.trim(),
      venueEmail: venueEmail.toLowerCase().trim(),
      venuePhone: body.venuePhone?.trim() || '',
      message: message.trim(),
      showDate: body.showDate || '',
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Add to inquiries array
    inquiries.push(newInquiry);

    // Save to file
    saveInquiries(inquiries);

    // TODO: Send email notification to artist
    console.log('New artist inquiry received:', {
      artistName,
      venueName,
      venueEmail,
      inquiryId: newInquiry.id
    });

    return NextResponse.json({
      success: true,
      message: 'Inquiry sent successfully',
      inquiryId: newInquiry.id
    });

  } catch (error) {
    console.error('Error processing artist inquiry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const inquiries = loadInquiries();
    
    // Return inquiries sorted by timestamp (newest first)
    const sortedInquiries = inquiries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(sortedInquiries);
  } catch (error) {
    console.error('Error fetching artist inquiries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 