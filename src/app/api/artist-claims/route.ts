import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ArtistClaim {
  id: string;
  artistId: string;
  artistName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

const CLAIMS_FILE = path.join(process.cwd(), 'data', 'artist-claims.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(CLAIMS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load existing claims
const loadClaims = (): ArtistClaim[] => {
  try {
    if (!fs.existsSync(CLAIMS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(CLAIMS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading artist claims:', error);
    return [];
  }
};

// Save claims
const saveClaims = (claims: ArtistClaim[]) => {
  try {
    ensureDataDir();
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2));
  } catch (error) {
    console.error('Error saving artist claims:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { artistId, artistName, contactName, contactEmail, message } = body;
    
    if (!artistId || !artistName || !contactName || !contactEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Load existing claims
    const claims = loadClaims();

    // Check for duplicate claims from same email for same artist
    const existingClaim = claims.find(
      claim => claim.artistId === artistId && 
                claim.contactEmail === contactEmail &&
                claim.status === 'pending'
    );

    if (existingClaim) {
      return NextResponse.json(
        { error: 'You already have a pending claim request for this artist' },
        { status: 409 }
      );
    }

    // Create new claim
    const newClaim: ArtistClaim = {
      id: Date.now().toString(),
      artistId,
      artistName,
      contactName: contactName.trim(),
      contactEmail: contactEmail.toLowerCase().trim(),
      contactPhone: body.contactPhone?.trim() || '',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Add to claims array
    claims.push(newClaim);

    // Save to file
    saveClaims(claims);

    // TODO: Send notification email to admin
    console.log('New artist claim received:', {
      artistName,
      contactName,
      contactEmail,
      claimId: newClaim.id
    });

    return NextResponse.json({
      success: true,
      message: 'Claim request submitted successfully',
      claimId: newClaim.id
    });

  } catch (error) {
    console.error('Error processing artist claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const claims = loadClaims();
    
    // Return claims sorted by timestamp (newest first)
    const sortedClaims = claims.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(sortedClaims);
  } catch (error) {
    console.error('Error fetching artist claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 