import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BIDS_FILE = path.join(process.cwd(), 'data', 'bids.json');

function readBids() {
  try {
    if (!fs.existsSync(BIDS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(BIDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bids:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bids = readBids();
    
    // Filter bids by venue ID
    const venueBids = bids.filter((bid: any) => bid.venueId === id);
    
    return NextResponse.json(venueBids);
  } catch (error) {
    console.error('Error fetching venue bids:', error);
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
  }
} 