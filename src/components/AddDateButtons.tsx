interface MonthTabGroup {
  monthKey: string;
  monthLabel: string;
  count: number;
}

interface AddDateButtonsProps {
  stableMonthTabs: MonthTabGroup[];
  editable: boolean;
  venueId?: string;
  artistId?: string;
  onAddDate: () => void;
}

export function AddDateButtons({
  stableMonthTabs,
  editable,
  venueId,
  artistId,
  onAddDate
}: AddDateButtonsProps) {
  if (!editable) return null;

  const AddDateButton = () => (
    <button
      onClick={onAddDate}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-150 flex items-center justify-center space-x-2 text-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span>Add Date</span>
    </button>
  );

  return (
    <>
      {/* Add Date Row - for empty state */}
      {stableMonthTabs.every(tab => tab.count === 0) && (
        <tr>
          <td colSpan={venueId ? 9 : 10} className="px-6 py-3">
            <AddDateButton />
          </td>
        </tr>
      )}

      {/* Add floating Add Date button when there are entries */}
      {stableMonthTabs.some(tab => tab.count > 0) && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <AddDateButton />
        </div>
      )}
    </>
  );
} 