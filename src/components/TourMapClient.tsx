'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TourDate } from './TourMap';

// Fix Leaflet default marker icons in Next.js/webpack
// This is needed because webpack messes up the default icon paths
const DefaultIcon = L.icon({
  iconUrl: '/markers/marker-icon.png',
  iconRetinaUrl: '/markers/marker-icon-2x.png',
  shadowUrl: '/markers/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom numbered marker icon
const createNumberedIcon = (number: number, status: string) => {
  const colors: Record<string, string> = {
    confirmed: '#22c55e',
    hold: '#eab308',
    pending: '#3b82f6',
    inquiry: '#94a3b8',
  };
  
  const color = colors[status] || '#6366f1';
  
  return L.divIcon({
    className: 'custom-numbered-marker',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${number}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
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

interface TourMapClientProps {
  dates: TourDate[];
}

export default function TourMapClient({ dates }: TourMapClientProps) {
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
        {sortedDates.map((date, index) => (
          <Marker 
            key={date.id} 
            position={[date.latitude, date.longitude]}
            icon={createNumberedIcon(index + 1, date.status)}
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
                    {new Date(date.date).toLocaleDateString('en-US', {
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
        ))}
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
    </div>
  );
}

