interface ItineraryTableHeaderProps {
  venueId?: string;
  artistId?: string;
}

export function ItineraryTableHeader({ venueId, artistId }: ItineraryTableHeaderProps) {
  return (
    <thead className="bg-gray-50">
      <tr className="text-left text-xs font-medium text-gray-600">
        <th className="px-2 py-1 w-[3%]"></th>
        <th className="px-4 py-1 w-[12%]">Date</th>
        {!venueId && <th className="px-4 py-1 w-[14%]">Location</th>}
        <th className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>
          {artistId ? 'Venue' : venueId ? 'Artist' : 'Artist'}
        </th>
        <th className="px-4 py-1 w-[10%]">Status</th>
        <th className="px-4 py-1 w-[7%]">{venueId ? 'Position' : 'Capacity'}</th>
        <th className="px-4 py-1 w-[7%]">Age</th>
        <th className={`px-4 py-1 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>Offers</th>
        <th className="px-4 py-1 w-[8%]">details</th>
        <th className="px-4 py-1 w-[10%]">Actions</th>
      </tr>
    </thead>
  );
} 