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
    const dataDir = path.dirname(CLAIMS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2));
  } catch (error) {
    console.error('Error saving artist claims:', error);
    throw error;
  }
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const claimId = resolvedParams.id;
    const body = await request.json();
    
    // Validate required fields
    const { status, notes } = body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Load existing claims
    const claims = loadClaims();

    // Find the claim to update
    const claimIndex = claims.findIndex(claim => claim.id === claimId);

    if (claimIndex === -1) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    // Update the claim
    claims[claimIndex] = {
      ...claims[claimIndex],
      status: status as 'approved' | 'rejected',
      notes: notes || ''
    };

    // Save updated claims
    saveClaims(claims);

    // TODO: Send email notification to claimer
    console.log('Artist claim updated:', {
      claimId,
      artistName: claims[claimIndex].artistName,
      contactEmail: claims[claimIndex].contactEmail,
      newStatus: status
    });

    return NextResponse.json({
      success: true,
      message: 'Claim status updated successfully',
      claim: claims[claimIndex]
    });

  } catch (error) {
    console.error('Error updating artist claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const claimId = resolvedParams.id;

    // Load existing claims
    const claims = loadClaims();

    // Find the specific claim
    const claim = claims.find(claim => claim.id === claimId);

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(claim);

  } catch (error) {
    console.error('Error fetching artist claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 