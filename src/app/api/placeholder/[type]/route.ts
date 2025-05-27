import { NextRequest, NextResponse } from 'next/server';

// Cloudinary base URL for thumbnails
const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/dfytetsz3/image/upload';

// Venue types that have custom thumbnails
const VENUE_THUMBNAILS = [
  'house-show', 'community-space', 'record-store', 'vfw-hall', 'arts-center',
  'warehouse', 'bar', 'club', 'theater', 'coffee-shop', 'bookstore', 'gallery',
  'library', 'park', 'basement', 'loft', 'church', 'brewery', 'rooftop', 
  'restaurant', 'other'
];

// Artist types that have custom thumbnails (you can add these later)
const ARTIST_THUMBNAILS: string[] = [
  // Add artist types here when you create those thumbnails
];

// Function to generate Cloudinary thumbnail URL with optimizations
function getCloudinaryThumbnailUrl(type: string, category: 'venues' | 'artists', size: number = 400) {
  return `${CLOUDINARY_BASE_URL}/w_${size},h_${size},c_fill,g_center,q_auto,f_auto/diy-booking/thumbnails/${category}/${type}`;
}

// SVG fallbacks (keeping your existing SVG code as backup)
const svgFallbacks = {
  // Venue placeholders
  'house-show': {
    background: '#374149',
    accent: '#4A5568',
    svg: `
      <rect width="300" height="300" fill="#374149"/>
      <path d="M150 60L220 100V240H80V100L150 60Z" fill="#4A5568" stroke="#FFF" stroke-width="2"/>
      <rect x="120" y="180" width="60" height="60" fill="#2D3748" stroke="#FFF" stroke-width="2"/>
      <circle cx="170" cy="210" r="3" fill="#FFF"/>
      <text x="150" y="280" font-family="Arial" font-size="14" fill="#FFF" text-anchor="middle">HOUSE SHOW</text>
    `
  },
  'community-space': {
    background: '#2B6CB0',
    accent: '#3182CE',
    svg: `
      <rect width="300" height="300" fill="#2B6CB0"/>
      <rect x="50" y="80" width="200" height="140" fill="#4299E1" stroke="#FFF" stroke-width="3"/>
      <rect x="100" y="120" width="100" height="40" fill="#2C5282"/>
      <circle cx="120" cy="140" r="8" fill="#FFF"/>
      <circle cx="150" cy="140" r="8" fill="#FFF"/>
      <circle cx="180" cy="140" r="8" fill="#FFF"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">COMMUNITY SPACE</text>
    `
  },
  'record-store': {
    background: '#744210',
    accent: '#B7791F',
    svg: `
      <rect width="300" height="300" fill="#744210"/>
      <circle cx="150" cy="150" r="80" fill="#1A202C" stroke="#FFF" stroke-width="3"/>
      <circle cx="150" cy="150" r="40" fill="none" stroke="#4A5568" stroke-width="2"/>
      <circle cx="150" cy="150" r="5" fill="#FFF"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">RECORD STORE</text>
    `
  },
  'vfw-hall': {
    background: '#9B2C2C',
    accent: '#C53030',
    svg: `
      <rect width="300" height="300" fill="#9B2C2C"/>
      <rect x="40" y="60" width="220" height="180" fill="#E53E3E" stroke="#FFF" stroke-width="3"/>
      <rect x="60" y="80" width="180" height="20" fill="#C53030"/>
      <polygon points="130,90 210,120 210,200 90,200 90,120" fill="#B91C1C" stroke="#FFF" stroke-width="2"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">VFW HALL</text>
    `
  },
  'arts-center': {
    background: '#553C9A',
    accent: '#7C3AED',
    svg: `
      <rect width="300" height="300" fill="#553C9A"/>
      <rect x="60" y="80" width="180" height="140" fill="#8B5CF6" stroke="#FFF" stroke-width="3"/>
      <circle cx="100" cy="130" r="15" fill="#FEF08A"/>
      <circle cx="150" cy="130" r="15" fill="#FCA5A5"/>
      <circle cx="200" cy="130" r="15" fill="#93C5FD"/>
      <rect x="80" y="160" width="140" height="20" fill="#6D28D9"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">ARTS CENTER</text>
    `
  },
  'warehouse': {
    background: '#525252',
    accent: '#737373',
    svg: `
      <rect width="300" height="300" fill="#525252"/>
      <rect x="40" y="80" width="220" height="140" fill="#737373" stroke="#FFF" stroke-width="3"/>
      <rect x="60" y="100" width="180" height="100" fill="#404040"/>
      <rect x="80" y="120" width="20" height="80" fill="#6B7280"/>
      <rect x="120" y="120" width="20" height="80" fill="#6B7280"/>
      <rect x="160" y="120" width="20" height="80" fill="#6B7280"/>
      <rect x="200" y="120" width="20" height="80" fill="#6B7280"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">WAREHOUSE</text>
    `
  },
  'bar': {
    background: '#92400E',
    accent: '#D97706',
    svg: `
      <rect width="300" height="300" fill="#92400E"/>
      <rect x="50" y="90" width="200" height="130" fill="#D97706" stroke="#FFF" stroke-width="3"/>
      <rect x="70" y="110" width="160" height="20" fill="#B45309"/>
      <circle cx="100" cy="150" r="8" fill="#FEF3C7"/>
      <circle cx="130" cy="150" r="8" fill="#FEF3C7"/>
      <circle cx="160" cy="150" r="8" fill="#FEF3C7"/>
      <circle cx="190" cy="150" r="8" fill="#FEF3C7"/>
      <rect x="80" y="170" width="140" height="30" fill="#B45309"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">BAR</text>
    `
  },
  'club': {
    background: '#1E1B4B',
    accent: '#3730A3',
    svg: `
      <rect width="300" height="300" fill="#1E1B4B"/>
      <rect x="60" y="70" width="180" height="150" fill="#3730A3" stroke="#FFF" stroke-width="3"/>
      <circle cx="120" cy="120" r="12" fill="#F59E0B"/>
      <circle cx="150" cy="110" r="8" fill="#EF4444"/>
      <circle cx="180" cy="125" r="10" fill="#10B981"/>
      <rect x="80" y="160" width="140" height="40" fill="#312E81"/>
      <path d="M90,170 L100,190 L110,175 L120,185 L130,170 L140,190 L150,175 L160,185 L170,170 L180,190 L190,175 L200,185 L210,170" stroke="#FDE047" stroke-width="2" fill="none"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">CLUB</text>
    `
  },
  'theater': {
    background: '#7F1D1D',
    accent: '#DC2626',
    svg: `
      <rect width="300" height="300" fill="#7F1D1D"/>
      <rect x="50" y="60" width="200" height="160" fill="#DC2626" stroke="#FFF" stroke-width="3"/>
      <rect x="70" y="80" width="160" height="20" fill="#B91C1C"/>
      <circle cx="100" cy="140" r="15" fill="#FEF2F2"/>
      <circle cx="150" cy="140" r="15" fill="#FEF2F2"/>
      <circle cx="200" cy="140" r="15" fill="#FEF2F2"/>
      <polygon points="120,160 130,180 110,180" fill="#FBBF24"/>
      <polygon points="170,160 180,180 160,180" fill="#FBBF24"/>
      <rect x="80" y="190" width="140" height="20" fill="#B91C1C"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">THEATER</text>
    `
  },
  'coffee-shop': {
    background: '#78350F',
    accent: '#A16207',
    svg: `
      <rect width="300" height="300" fill="#78350F"/>
      <rect x="60" y="80" width="180" height="140" fill="#A16207" stroke="#FFF" stroke-width="3"/>
      <circle cx="120" cy="130" r="20" fill="#FEF3C7" stroke="#92400E" stroke-width="2"/>
      <circle cx="180" cy="130" r="20" fill="#FEF3C7" stroke="#92400E" stroke-width="2"/>
      <rect x="100" y="170" width="100" height="30" fill="#92400E"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">COFFEE SHOP</text>
    `
  },
  'bookstore': {
    background: '#1C2D3A',
    accent: '#2563EB',
    svg: `
      <rect width="300" height="300" fill="#1C2D3A"/>
      <rect x="70" y="90" width="160" height="120" fill="#2563EB" stroke="#FFF" stroke-width="3"/>
      <rect x="90" y="110" width="20" height="80" fill="#FFF"/>
      <rect x="120" y="110" width="20" height="80" fill="#FFF"/>
      <rect x="150" y="110" width="20" height="80" fill="#FFF"/>
      <rect x="180" y="110" width="20" height="80" fill="#FFF"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">BOOKSTORE</text>
    `
  },
  'gallery': {
    background: '#F9FAFB',
    accent: '#6B7280',
    svg: `
      <rect width="300" height="300" fill="#F9FAFB"/>
      <rect x="50" y="70" width="200" height="160" fill="#FFF" stroke="#6B7280" stroke-width="3"/>
      <rect x="80" y="100" width="40" height="50" fill="#EF4444"/>
      <rect x="140" y="100" width="40" height="50" fill="#3B82F6"/>
      <rect x="200" y="100" width="40" height="50" fill="#10B981"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#6B7280" text-anchor="middle">GALLERY</text>
    `
  },
  'library': {
    background: '#1F2937',
    accent: '#9CA3AF',
    svg: `
      <rect width="300" height="300" fill="#1F2937"/>
      <rect x="60" y="80" width="180" height="140" fill="#4B5563" stroke="#FFF" stroke-width="3"/>
      <rect x="80" y="100" width="140" height="15" fill="#9CA3AF"/>
      <rect x="80" y="125" width="140" height="15" fill="#9CA3AF"/>
      <rect x="80" y="150" width="140" height="15" fill="#9CA3AF"/>
      <rect x="80" y="175" width="140" height="15" fill="#9CA3AF"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">LIBRARY</text>
    `
  },
  'park': {
    background: '#166534',
    accent: '#22C55E',
    svg: `
      <rect width="300" height="300" fill="#166534"/>
      <circle cx="100" cy="120" r="30" fill="#22C55E"/>
      <circle cx="200" cy="120" r="25" fill="#22C55E"/>
      <circle cx="150" cy="180" r="35" fill="#22C55E"/>
      <rect x="140" y="160" width="20" height="40" fill="#A16207"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">PARK / OUTDOOR</text>
    `
  },
  'basement': {
    background: '#1C1917',
    accent: '#44403C',
    svg: `
      <rect width="300" height="300" fill="#1C1917"/>
      <rect x="50" y="100" width="200" height="120" fill="#44403C" stroke="#FFF" stroke-width="2"/>
      <rect x="70" y="120" width="160" height="80" fill="#292524"/>
      <path d="M70,120 L90,100 L210,100 L230,120" fill="#57534E" stroke="#FFF" stroke-width="1"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">BASEMENT</text>
    `
  },
  'loft': {
    background: '#7C2D12',
    accent: '#EA580C',
    svg: `
      <rect width="300" height="300" fill="#7C2D12"/>
      <polygon points="50,140 150,80 250,140 250,220 50,220" fill="#EA580C" stroke="#FFF" stroke-width="3"/>
      <rect x="120" y="170" width="60" height="50" fill="#9A3412"/>
      <rect x="80" y="120" width="140" height="10" fill="#F97316"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">LOFT</text>
    `
  },
  'church': {
    background: '#5B21B6',
    accent: '#8B5CF6',
    svg: `
      <rect width="300" height="300" fill="#5B21B6"/>
      <rect x="70" y="110" width="160" height="110" fill="#8B5CF6" stroke="#FFF" stroke-width="3"/>
      <polygon points="130,110 150,80 170,110" fill="#A855F7" stroke="#FFF" stroke-width="2"/>
      <rect x="145" y="85" width="10" height="25" fill="#FFF"/>
      <rect x="140" y="90" width="20" height="5" fill="#FFF"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">CHURCH</text>
    `
  },
  'brewery': {
    background: '#92400E',
    accent: '#F59E0B',
    svg: `
      <rect width="300" height="300" fill="#92400E"/>
      <rect x="60" y="90" width="180" height="130" fill="#F59E0B" stroke="#FFF" stroke-width="3"/>
      <circle cx="120" cy="140" r="20" fill="#FEF3C7" stroke="#92400E" stroke-width="3"/>
      <circle cx="180" cy="140" r="20" fill="#FEF3C7" stroke="#92400E" stroke-width="3"/>
      <rect x="110" y="180" width="80" height="20" fill="#D97706"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">BREWERY</text>
    `
  },
  'rooftop': {
    background: '#0F172A',
    accent: '#1E293B',
    svg: `
      <rect width="300" height="300" fill="#0F172A"/>
      <rect x="40" y="120" width="220" height="100" fill="#1E293B" stroke="#FFF" stroke-width="3"/>
      <polygon points="50,120 100,80 150,120" fill="#475569"/>
      <polygon points="150,120 200,80 250,120" fill="#475569"/>
      <circle cx="80" cy="100" r="8" fill="#FDE047"/>
      <circle cx="150" cy="90" r="10" fill="#FDE047"/>
      <circle cx="220" cy="100" r="8" fill="#FDE047"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">ROOFTOP</text>
    `
  },
  'restaurant': {
    background: '#B91C1C',
    accent: '#EF4444',
    svg: `
      <rect width="300" height="300" fill="#B91C1C"/>
      <rect x="60" y="90" width="180" height="130" fill="#EF4444" stroke="#FFF" stroke-width="3"/>
      <circle cx="120" cy="140" r="15" fill="#FEF2F2"/>
      <circle cx="180" cy="140" r="15" fill="#FEF2F2"/>
      <rect x="100" y="170" width="100" height="30" fill="#DC2626"/>
      <polygon points="145,125 155,125 150,135" fill="#B91C1C"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">RESTAURANT</text>
    `
  },
  'other': {
    background: '#374151',
    accent: '#6B7280',
    svg: `
      <rect width="300" height="300" fill="#374151"/>
      <polygon points="150,60 240,130 200,220 100,220 60,130" fill="#6B7280" stroke="#FFF" stroke-width="3"/>
      <circle cx="150" cy="140" r="20" fill="#9CA3AF" stroke="#FFF" stroke-width="2"/>
      <path d="M140,130 L160,130 M140,140 L160,140 M140,150 L160,150" stroke="#FFF" stroke-width="2"/>
      <text x="150" y="280" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">DIY VENUE</text>
    `
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const url = new URL(request.url);
    const size = parseInt(url.searchParams.get('size') || '400');
    
    // Determine if this is a venue or artist type
    const isVenue = VENUE_THUMBNAILS.includes(type);
    const isArtist = ARTIST_THUMBNAILS.includes(type);
    
    if (isVenue) {
      // Try to serve Cloudinary thumbnail first
      try {
        const cloudinaryUrl = getCloudinaryThumbnailUrl(type, 'venues', size);
        console.log(`🖼️ Redirecting ${type} to Cloudinary: ${cloudinaryUrl}`);
        
        // Redirect to Cloudinary URL with cache-busting headers
        const response = NextResponse.redirect(cloudinaryUrl, 302);
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
        
      } catch (error) {
        console.error(`❌ Failed to serve Cloudinary thumbnail for ${type}:`, error);
        // Fall through to SVG fallback
      }
    }
    
    if (isArtist) {
      // Try to serve Cloudinary thumbnail first (when you add artist thumbnails)
      try {
        const cloudinaryUrl = getCloudinaryThumbnailUrl(type, 'artists', size);
        const response = NextResponse.redirect(cloudinaryUrl, 302);
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
      } catch (error) {
        console.warn(`Failed to serve Cloudinary thumbnail for ${type}, falling back to SVG`);
        // Fall through to SVG fallback
      }
    }
    
    // SVG Fallback - serve the existing SVG placeholders
    const placeholder = svgFallbacks[type as keyof typeof svgFallbacks];
    
    if (!placeholder) {
      // Default fallback
      const defaultSvg = `
        <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="300" fill="#374151"/>
          <circle cx="150" cy="150" r="50" fill="#6B7280" stroke="#FFF" stroke-width="3"/>
          <text x="150" y="250" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">${type.toUpperCase()}</text>
        </svg>
      `;
      
      return new NextResponse(defaultSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }
    
    const svg = `
      <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        ${placeholder.svg}
      </svg>
    `;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('Error serving placeholder:', error);
    
    // Emergency fallback
    const emergencySvg = `
      <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="#374151"/>
        <circle cx="150" cy="150" r="50" fill="#6B7280"/>
        <text x="150" y="250" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">IMAGE</text>
      </svg>
    `;
    
    return new NextResponse(emergencySvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
} 