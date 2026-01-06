'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TourDate } from './TourMap';

// Fix Leaflet default marker icons in Next.js/webpack
// Use CDN URLs for reliability across all environments
const LEAFLET_CDN = 'https://unpkg.com/leaflet@1.9.4/dist/images';

const DefaultIcon = L.icon({
  iconUrl: `${LEAFLET_CDN}/marker-icon.png`,
  iconRetinaUrl: `${LEAFLET_CDN}/marker-icon-2x.png`,
  shadowUrl: `${LEAFLET_CDN}/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom numbered marker icon
const createNumberedIcon = (number: number, status: string, isHighlighted: boolean = false) => {
  const colors: Record<string, string> = {
    confirmed: '#22c55e',
    hold: '#eab308',
    pending: '#3b82f6',
    inquiry: '#94a3b8',
  };
  
  const color = colors[status] || '#6366f1';
  const size = isHighlighted ? 40 : 28;
  const fontSize = isHighlighted ? 16 : 12;
  const borderWidth = isHighlighted ? 4 : 2;
  const glow = isHighlighted ? 'box-shadow: 0 0 20px rgba(99, 102, 241, 0.8), 0 4px 8px rgba(0,0,0,0.4);' : 'box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
  
  return L.divIcon({
    className: 'custom-numbered-marker',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${fontSize}px;
        border: ${borderWidth}px solid white;
        ${glow}
        transition: all 0.2s ease;
        ${isHighlighted ? 'transform: scale(1.1);' : ''}
      ">
        ${number}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Component to fit bounds when dates change
function FitBounds({ dates }: { dates: TourDate[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (dates.length > 0) {
      const bounds = L.latLngBounds(dates.map(d => [d.latitude, d.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, dates]);
  
  return null;
}

// Note: Removed auto-fly on hover - was too jarring. 
// Highlighting the pin is enough visual feedback.

interface TourMapClientProps {
  dates: TourDate[];
  highlightedDateId?: string | null;
  onDateHover?: (dateId: string | null) => void;
}

export default function TourMapClient({ dates, highlightedDateId, onDateHover }: TourMapClientProps) {
  // Sort by date to show tour sequence
  const sortedDates = [...dates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Create polyline coordinates
  const routeCoords: [number, number][] = sortedDates.map(d => [d.latitude, d.longitude]);

  // Center map on first date or US center
  const center: [number, number] = sortedDates.length > 0
    ? [sortedDates[0].latitude, sortedDates[0].longitude]
    : [39.8283, -98.5795]; // US center

  // Status colors for legend
  const statusInfo: Record<string, { color: string; label: string }> = {
    confirmed: { color: '#22c55e', label: 'Confirmed' },
    hold: { color: '#eab308', label: 'On Hold' },
    pending: { color: '#3b82f6', label: 'Pending' },
    inquiry: { color: '#94a3b8', label: 'Inquiry' },
  };

  // Get unique statuses in the data
  const activeStatuses = [...new Set(sortedDates.map(d => d.status))];

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={5}
        className="h-[400px] w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Fit bounds to show all markers */}
        <FitBounds dates={sortedDates} />
        
        {/* Route line connecting dates */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            color="#6366f1"
            weight={3}
            opacity={0.7}
            dashArray="8, 8"
          />
        )}

        {/* Markers for each date */}
        {sortedDates.map((date, index) => {
          const isHighlighted = date.id === highlightedDateId;
          return (
            <Marker 
              key={date.id} 
              position={[date.latitude, date.longitude]}
              icon={createNumberedIcon(index + 1, date.status, isHighlighted)}
              eventHandlers={{
                mouseover: () => onDateHover?.(date.id),
                mouseout: () => onDateHover?.(null),
                click: () => onDateHover?.(date.id),
              }}
              zIndexOffset={isHighlighted ? 1000 : 0}
            >
              <Popup>
                <div className="text-sm min-w-[180px]">
                  <div className="font-bold text-gray-900 mb-1">
                    #{index + 1} — {date.venueName}
                  </div>
                  <div className="text-gray-600 mb-2">
                    {date.city}, {date.state}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">
                      {/* Parse as UTC to avoid timezone shift */}
                      {new Date(date.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: statusInfo[date.status]?.color || '#94a3b8', 
                        color: 'white' 
                      }}
                    >
                      {statusInfo[date.status]?.label || date.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 z-[1000]">
        <div className="text-xs font-medium text-gray-700 mb-1">Status</div>
        <div className="flex flex-wrap gap-2">
          {activeStatuses.map(status => (
            <div key={status} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusInfo[status]?.color || '#94a3b8' }}
              />
              <span className="text-xs text-gray-600">
                {statusInfo[status]?.label || status}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Interaction hint */}
      <div className="absolute top-4 right-4 bg-white/90 rounded-lg shadow-sm px-2 py-1 z-[1000] text-xs text-gray-500">
        Hover dates to highlight
      </div>
    </div>
  );
}
