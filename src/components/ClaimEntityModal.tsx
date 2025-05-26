import { useState } from 'react';

interface ClaimEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'artist' | 'venue';
  entityName: string;
  entityId: string;
  onSuccess: () => void;
}

export default function ClaimEntityModal({
  isOpen,
  onClose,
  entityType,
  entityName,
  entityId,
  onSuccess
}: ClaimEntityModalProps) {
  const [formData, setFormData] = useState({
    role: entityType === 'artist' ? 'member' : 'staff',
    confirmName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.confirmName.toLowerCase() !== entityName.toLowerCase()) {
      setError('Please type the exact name to confirm');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/${entityType === 'artist' ? 'artists' : 'venues'}/${entityId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: formData.role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to claim entity');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      role: entityType === 'artist' ? 'member' : 'staff',
      confirmName: ''
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Claim {entityName}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Are you part of {entityName}?</p>
                <p>By claiming this {entityType}, you'll be added as the first member and will be able to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Edit the {entityType} profile</li>
                  <li>Manage bookings and shows</li>
                  <li>Invite other members</li>
                  <li>Respond to tour requests</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {entityType === 'artist' ? (
                  <>
                    <option value="member">Member</option>
                    <option value="vocalist">Vocalist</option>
                    <option value="guitarist">Guitarist</option>
                    <option value="bassist">Bassist</option>
                    <option value="drummer">Drummer</option>
                    <option value="keyboardist">Keyboardist</option>
                    <option value="producer">Producer</option>
                    <option value="manager">Manager</option>
                  </>
                ) : (
                  <>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="booker">Booker</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm by typing the {entityType} name: <span className="font-semibold">{entityName}</span>
              </label>
              <input
                type="text"
                required
                value={formData.confirmName}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmName: e.target.value }))}
                placeholder={`Type "${entityName}" to confirm`}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.confirmName.toLowerCase() !== entityName.toLowerCase()}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Claiming...' : `Claim ${entityType}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 