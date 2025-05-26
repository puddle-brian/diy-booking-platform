import { NextRequest, NextResponse } from 'next/server';

const placeholders = {
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
  },

  // Artist placeholders
  'band': {
    background: '#1F2937',
    accent: '#374151',
    svg: `
      <rect width="300" height="300" fill="#1F2937"/>
      <circle cx="120" cy="120" r="25" fill="#6B7280" stroke="#FFF" stroke-width="2"/>
      <circle cx="180" cy="120" r="25" fill="#6B7280" stroke="#FFF" stroke-width="2"/>
      <circle cx="150" cy="180" r="25" fill="#6B7280" stroke="#FFF" stroke-width="2"/>
      <circle cx="90" cy="180" r="25" fill="#6B7280" stroke="#FFF" stroke-width="2"/>
      <text x="150" y="260" font-family="Arial" font-size="14" fill="#FFF" text-anchor="middle">BAND</text>
    `
  },
  'solo': {
    background: '#065F46',
    accent: '#047857',
    svg: `
      <rect width="300" height="300" fill="#065F46"/>
      <circle cx="150" cy="130" r="40" fill="#10B981" stroke="#FFF" stroke-width="3"/>
      <path d="M130,115 Q150,95 170,115" stroke="#FFF" stroke-width="3" fill="none"/>
      <circle cx="140" cy="125" r="3" fill="#FFF"/>
      <circle cx="160" cy="125" r="3" fill="#FFF"/>
      <path d="M135,140 Q150,150 165,140" stroke="#FFF" stroke-width="3" fill="none"/>
      <text x="150" y="260" font-family="Arial" font-size="14" fill="#FFF" text-anchor="middle">SOLO ARTIST</text>
    `
  },
  'duo': {
    background: '#7C2D12',
    accent: '#DC2626',
    svg: `
      <rect width="300" height="300" fill="#7C2D12"/>
      <circle cx="120" cy="140" r="35" fill="#EF4444" stroke="#FFF" stroke-width="3"/>
      <circle cx="180" cy="140" r="35" fill="#EF4444" stroke="#FFF" stroke-width="3"/>
      <path d="M140,140 L160,140" stroke="#FFF" stroke-width="4"/>
      <text x="150" y="260" font-family="Arial" font-size="14" fill="#FFF" text-anchor="middle">DUO</text>
    `
  },
  'collective': {
    background: '#581C87',
    accent: '#7C3AED',
    svg: `
      <rect width="300" height="300" fill="#581C87"/>
      <circle cx="100" cy="100" r="20" fill="#A855F7" stroke="#FFF" stroke-width="2"/>
      <circle cx="200" cy="100" r="20" fill="#A855F7" stroke="#FFF" stroke-width="2"/>
      <circle cx="150" cy="140" r="20" fill="#A855F7" stroke="#FFF" stroke-width="2"/>
      <circle cx="80" cy="180" r="20" fill="#A855F7" stroke="#FFF" stroke-width="2"/>
      <circle cx="220" cy="180" r="20" fill="#A855F7" stroke="#FFF" stroke-width="2"/>
      <circle cx="150" cy="220" r="20" fill="#A855F7" stroke="#FFF" stroke-width="2"/>
      <text x="150" y="270" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">COLLECTIVE</text>
    `
  },
  'dj': {
    background: '#7C2D12',
    accent: '#F97316',
    svg: `
      <rect width="300" height="300" fill="#7C2D12"/>
      <rect x="80" y="110" width="140" height="80" fill="#F97316" stroke="#FFF" stroke-width="3"/>
      <circle cx="120" cy="140" r="15" fill="#FED7AA"/>
      <circle cx="180" cy="140" r="15" fill="#FED7AA"/>
      <circle cx="150" cy="170" r="8" fill="#EA580C"/>
      <rect x="100" y="130" width="100" height="5" fill="#FFF"/>
      <text x="150" y="260" font-family="Arial" font-size="14" fill="#FFF" text-anchor="middle">DJ</text>
    `
  },
  'comedian': {
    background: '#7C2D12',
    accent: '#FBBF24',
    svg: `
      <rect width="300" height="300" fill="#7C2D12"/>
      <circle cx="150" cy="130" r="40" fill="#FBBF24" stroke="#FFF" stroke-width="3"/>
      <circle cx="135" cy="120" r="5" fill="#7C2D12"/>
      <circle cx="165" cy="120" r="5" fill="#7C2D12"/>
      <path d="M130,145 Q150,160 170,145" stroke="#7C2D12" stroke-width="4" fill="none"/>
      <rect x="140" y="190" width="20" height="30" fill="#FBBF24"/>
      <text x="150" y="260" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">COMEDIAN</text>
    `
  },
  'poet': {
    background: '#4C1D95',
    accent: '#8B5CF6',
    svg: `
      <rect width="300" height="300" fill="#4C1D95"/>
      <rect x="90" y="100" width="120" height="100" fill="#8B5CF6" stroke="#FFF" stroke-width="3"/>
      <path d="M110,130 L110,140 M110,150 L110,160 M110,170 L110,180" stroke="#FFF" stroke-width="2"/>
      <path d="M130,130 L130,140 M130,150 L130,160 M130,170 L130,180" stroke="#FFF" stroke-width="2"/>
      <path d="M150,130 L150,140 M150,150 L150,160 M150,170 L150,180" stroke="#FFF" stroke-width="2"/>
      <path d="M170,130 L170,140 M170,150 L170,160 M170,170 L170,180" stroke="#FFF" stroke-width="2"/>
      <text x="150" y="260" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">POET / SPOKEN WORD</text>
    `
  },
  'lecturer': {
    background: '#1F2937',
    accent: '#9CA3AF',
    svg: `
      <rect width="300" height="300" fill="#1F2937"/>
      <circle cx="150" cy="120" r="30" fill="#9CA3AF" stroke="#FFF" stroke-width="3"/>
      <rect x="120" y="160" width="60" height="40" fill="#4B5563"/>
      <circle cx="135" cy="110" r="3" fill="#FFF"/>
      <circle cx="165" cy="110" r="3" fill="#FFF"/>
      <path d="M140,130 Q150,140 160,130" stroke="#FFF" stroke-width="2" fill="none"/>
      <text x="150" y="260" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">LECTURER</text>
    `
  },
  'dancer': {
    background: '#BE185D',
    accent: '#F472B6',
    svg: `
      <rect width="300" height="300" fill="#BE185D"/>
      <circle cx="150" cy="110" r="20" fill="#F472B6" stroke="#FFF" stroke-width="2"/>
      <path d="M130,130 Q140,150 150,170 Q160,150 170,130" fill="#F472B6" stroke="#FFF" stroke-width="2"/>
      <path d="M120,160 Q130,180 140,200" stroke="#FFF" stroke-width="3" fill="none"/>
      <path d="M180,160 Q170,180 160,200" stroke="#FFF" stroke-width="3" fill="none"/>
      <text x="150" y="260" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">DANCER</text>
    `
  },
  'theater-group': {
    background: '#7F1D1D',
    accent: '#F87171',
    svg: `
      <rect width="300" height="300" fill="#7F1D1D"/>
      <circle cx="110" cy="120" r="20" fill="#F87171" stroke="#FFF" stroke-width="2"/>
      <circle cx="150" cy="120" r="20" fill="#F87171" stroke="#FFF" stroke-width="2"/>
      <circle cx="190" cy="120" r="20" fill="#F87171" stroke="#FFF" stroke-width="2"/>
      <path d="M100,140 Q120,160 140,140" fill="#EF4444"/>
      <path d="M160,140 Q180,160 200,140" fill="#EF4444"/>
      <text x="150" y="260" font-family="Arial" font-size="11" fill="#FFF" text-anchor="middle">THEATER GROUP</text>
    `
  },
  'storyteller': {
    background: '#92400E',
    accent: '#F59E0B',
    svg: `
      <rect width="300" height="300" fill="#92400E"/>
      <circle cx="150" cy="130" r="35" fill="#F59E0B" stroke="#FFF" stroke-width="3"/>
      <circle cx="140" cy="120" r="4" fill="#92400E"/>
      <circle cx="160" cy="120" r="4" fill="#92400E"/>
      <ellipse cx="150" cy="140" rx="15" ry="8" fill="#92400E"/>
      <path d="M180,120 Q200,130 190,150 Q180,140 170,145" stroke="#FFF" stroke-width="2" fill="none"/>
      <text x="150" y="260" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">STORYTELLER</text>
    `
  },
  'variety': {
    background: '#581C87',
    accent: '#C084FC',
    svg: `
      <rect width="300" height="300" fill="#581C87"/>
      <polygon points="150,90 120,150 180,150" fill="#C084FC" stroke="#FFF" stroke-width="2"/>
      <circle cx="110" cy="170" r="15" fill="#A855F7"/>
      <circle cx="150" cy="170" r="15" fill="#A855F7"/>
      <circle cx="190" cy="170" r="15" fill="#A855F7"/>
      <rect x="140" y="120" width="20" height="15" fill="#FFF"/>
      <text x="150" y="260" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">VARIETY / MAGIC</text>
    `
  },
  'rapper': {
    background: '#1F2937',
    accent: '#FBBF24',
    svg: `
      <rect width="300" height="300" fill="#1F2937"/>
      <circle cx="150" cy="120" r="30" fill="#4B5563" stroke="#FFF" stroke-width="3"/>
      <rect x="120" y="100" width="60" height="10" fill="#FBBF24"/>
      <circle cx="140" cy="115" r="3" fill="#FFF"/>
      <circle cx="160" cy="115" r="3" fill="#FFF"/>
      <path d="M140,130 L160,130" stroke="#FFF" stroke-width="3"/>
      <path d="M120,160 Q140,180 160,160 Q180,180 200,160" stroke="#FBBF24" stroke-width="3" fill="none"/>
      <text x="150" y="260" font-family="Arial" font-size="14" fill="#FFF" text-anchor="middle">MC / RAPPER</text>
    `
  },
  'singer-songwriter': {
    background: '#059669',
    accent: '#34D399',
    svg: `
      <rect width="300" height="300" fill="#059669"/>
      <circle cx="150" cy="120" r="30" fill="#34D399" stroke="#FFF" stroke-width="3"/>
      <ellipse cx="150" cy="170" rx="40" ry="25" fill="#10B981" stroke="#FFF" stroke-width="2"/>
      <circle cx="140" cy="115" r="3" fill="#059669"/>
      <circle cx="160" cy="115" r="3" fill="#059669"/>
      <path d="M140,130 Q150,135 160,130" stroke="#059669" stroke-width="2" fill="none"/>
      <text x="150" y="260" font-family="Arial" font-size="11" fill="#FFF" text-anchor="middle">SINGER-SONGWRITER</text>
    `
  },
  'experimental': {
    background: '#7C2D12',
    accent: '#9333EA',
    svg: `
      <rect width="300" height="300" fill="#7C2D12"/>
      <polygon points="150,80 200,120 180,180 120,180 100,120" fill="#9333EA" stroke="#FFF" stroke-width="3"/>
      <circle cx="150" cy="130" r="10" fill="#C084FC"/>
      <polygon points="130,110 170,110 160,140 140,140" fill="#A855F7"/>
      <path d="M110,150 Q130,170 150,150 Q170,170 190,150" stroke="#FFF" stroke-width="2" fill="none"/>
      <text x="150" y="260" font-family="Arial" font-size="11" fill="#FFF" text-anchor="middle">EXPERIMENTAL</text>
    `
  },
  'visual-artist': {
    background: '#DC2626',
    accent: '#FCA5A5',
    svg: `
      <rect width="300" height="300" fill="#DC2626"/>
      <rect x="80" y="100" width="140" height="100" fill="#FCA5A5" stroke="#FFF" stroke-width="3"/>
      <circle cx="120" cy="130" r="10" fill="#EF4444"/>
      <polygon points="160,120 180,140 160,160 140,140" fill="#B91C1C"/>
      <rect x="190" y="170" width="20" height="20" fill="#7F1D1D"/>
      <text x="150" y="260" font-family="Arial" font-size="11" fill="#FFF" text-anchor="middle">VISUAL ARTIST</text>
    `
  },
  'artist': {
    background: '#374151',
    accent: '#6B7280',
    svg: `
      <rect width="300" height="300" fill="#374151"/>
      <circle cx="150" cy="130" r="40" fill="#9CA3AF" stroke="#FFF" stroke-width="3"/>
      <path d="M120,110 Q150,90 180,110" stroke="#FFF" stroke-width="3" fill="none"/>
      <circle cx="135" cy="125" r="4" fill="#FFF"/>
      <circle cx="165" cy="125" r="4" fill="#FFF"/>
      <path d="M130,145 Q150,155 170,145" stroke="#FFF" stroke-width="3" fill="none"/>
      <text x="150" y="260" font-family="Arial" font-size="14" fill="#FFF" text-anchor="middle">ARTIST</text>
    `
  },
  'person': {
    background: '#4F46E5',
    accent: '#818CF8',
    svg: `
      <rect width="300" height="300" fill="#4F46E5"/>
      <circle cx="150" cy="120" r="35" fill="#818CF8" stroke="#FFF" stroke-width="3"/>
      <circle cx="140" cy="110" r="4" fill="#FFF"/>
      <circle cx="160" cy="110" r="4" fill="#FFF"/>
      <path d="M135,130 Q150,140 165,130" stroke="#FFF" stroke-width="3" fill="none"/>
      <ellipse cx="150" cy="200" rx="50" ry="30" fill="#6366F1" stroke="#FFF" stroke-width="3"/>
      <text x="150" y="270" font-family="Arial" font-size="14" fill="#FFF" text-anchor="middle">PERSON</text>
    `
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const placeholder = placeholders[type as keyof typeof placeholders] || placeholders.other;

  const svg = `
    <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${placeholder.svg}
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
} 