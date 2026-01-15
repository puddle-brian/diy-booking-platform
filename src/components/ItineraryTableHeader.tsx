interface ItineraryTableHeaderProps {
  venueId?: string;
  artistId?: string;
}

export function ItineraryTableHeader({ venueId, artistId }: ItineraryTableHeaderProps) {
  return (
    <thead className="bg-bg-secondary border-b border-border-primary">
      <tr className="text-left text-xs font-mono uppercase text-text-secondary">
        <th className="px-4 py-2 w-[3%]"></th>
        <th className="px-4 py-2 w-[12%]">Date</th>
        {!venueId && <th className="px-4 py-2 w-[14%]">Location</th>}
        <th className={`px-4 py-2 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>
          {artistId ? 'Venue' : venueId ? 'Artist' : 'Artist'}
        </th>
        <th className="px-4 py-2 w-[10%]">Status</th>
        <th className="px-4 py-2 w-[7%]">{venueId ? 'Position' : 'Capacity'}</th>
        <th className="px-4 py-2 w-[7%]">Age</th>
        <th className={`px-4 py-2 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>Offers</th>
        <th className="px-4 py-2 w-[8%]">Details</th>
        <th className="px-4 py-2 w-[10%]">Actions</th>
      </tr>
    </thead>
  );
} 