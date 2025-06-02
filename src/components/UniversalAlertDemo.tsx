'use client';

import React, { useState } from 'react';
import UniversalAlertModal, { useAlert, UniversalAlertProps } from './UniversalAlertModal';

export default function UniversalAlertDemo() {
  const { AlertModal, confirm, confirmDelete, info, success, error, showAlert } = useAlert();
  const [manualAlert, setManualAlert] = useState<UniversalAlertProps | null>(null);

  // Example: Date conflict scenario
  const handleDateConflictExample = () => {
    showAlert({
      type: 'warning',
      title: 'Date Conflict Detected',
      message: (
        <div className="space-y-3">
          <p>You already have commitments on <strong>June 15th, 2024</strong>:</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm">Confirmed Show: "Lightning Bolt at The Space"</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-sm">Pending Offer: "Venue XYZ - $500 guarantee"</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">How would you like to proceed?</p>
        </div>
      ),
      buttons: [
        {
          text: 'Cancel',
          action: () => console.log('User cancelled'),
          variant: 'secondary'
        },
        {
          text: 'Replace Existing',
          action: () => {
            console.log('User chose to replace existing commitments');
            success('Success', 'Your new commitment has replaced the existing ones.');
          },
          variant: 'danger'
        },
        {
          text: 'Create Anyway',
          action: () => {
            console.log('User chose to create anyway');
            info('Created', 'Your new commitment has been added alongside existing ones.');
          },
          variant: 'primary'
        }
      ],
      size: 'lg'
    });
  };

  // Example: Async delete with loading
  const handleAsyncDeleteExample = () => {
    showAlert({
      type: 'error',
      title: 'Delete Tour Request',
      message: 'Are you sure you want to delete "Summer Tour 2024"? This will also remove all associated bids and cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          action: () => console.log('Delete cancelled'),
          variant: 'secondary'
        },
        {
          text: 'Delete Forever',
          action: async () => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            success('Deleted', 'Tour request has been permanently deleted.');
          },
          variant: 'danger'
        }
      ]
    });
  };

  // Example: Custom icon and complex content
  const handleCustomExample = () => {
    setManualAlert({
      isOpen: true,
      onClose: () => setManualAlert(null),
      type: 'info',
      title: 'Venue Offer Received',
      size: 'lg',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0v-1a2 2 0 012-2h2m-4 0V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2M7 7h10m-5 3v8m0-8V5a2 2 0 012-2h2a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      message: (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  VS
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">The Venue Space</h4>
                <p className="text-sm text-gray-600">Portland, OR • Capacity: 150</p>
                <p className="text-sm text-blue-700 mt-1">$800 guarantee + door split</p>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-700">
            <p><strong>Date:</strong> July 22, 2024</p>
            <p><strong>Age:</strong> All Ages</p>
            <p><strong>Message:</strong> "Hey! We'd love to have Lightning Bolt play at our venue. Your sound would be perfect for our space and audience."</p>
          </div>
        </div>
      ),
      buttons: [
        {
          text: 'Decline',
          action: () => {
            setManualAlert(null);
            error('Declined', 'You have declined the venue offer.');
          },
          variant: 'secondary'
        },
        {
          text: 'View Details',
          action: () => {
            setManualAlert(null);
            info('View Details', 'This would open the full offer details modal.');
          },
          variant: 'secondary'
        },
        {
          text: 'Accept Offer',
          action: () => {
            setManualAlert(null);
            success('Accepted!', 'You have accepted the venue offer. The venue has been notified.');
          },
          variant: 'success'
        }
      ]
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Universal Alert Modal Demo</h1>
        <p className="text-gray-600">
          Modern, accessible alert modals that replace browser confirm/alert dialogs with 
          beautiful, branded experiences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Examples */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Alerts</h3>
          <div className="space-y-3">
            <button
              onClick={() => info('Information', 'This is an informational message with important details.')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Info Alert
            </button>
            <button
              onClick={() => success('Success!', 'Your action has been completed successfully.')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Success Alert
            </button>
            <button
              onClick={() => error('Error Occurred', 'Something went wrong. Please try again later.')}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Error Alert
            </button>
          </div>
        </div>

        {/* Confirmation Examples */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmations</h3>
          <div className="space-y-3">
            <button
              onClick={() => confirm(
                'Confirm Action',
                'Are you sure you want to proceed with this action?',
                () => success('Confirmed', 'Action has been completed.')
              )}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Basic Confirm
            </button>
            <button
              onClick={() => confirmDelete(
                'Delete Item',
                'This action cannot be undone. Are you sure?',
                () => success('Deleted', 'Item has been permanently deleted.')
              )}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Confirm
            </button>
            <button
              onClick={handleAsyncDeleteExample}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Async Delete (Loading)
            </button>
          </div>
        </div>

        {/* Real-world Examples */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-world Scenarios</h3>
          <div className="space-y-3">
            <button
              onClick={handleDateConflictExample}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Date Conflict Warning
            </button>
            <button
              onClick={handleCustomExample}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Venue Offer Received
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✅ Smooth fade + scale animations</li>
            <li>✅ Type-specific styling & icons</li>
            <li>✅ Keyboard navigation (ESC, Tab)</li>
            <li>✅ Focus management</li>
            <li>✅ Loading states for async actions</li>
            <li>✅ Custom icons & complex content</li>
            <li>✅ Responsive design</li>
            <li>✅ Backdrop click to close</li>
            <li>✅ Accessibility compliant</li>
          </ul>
        </div>
      </div>

      {/* Usage Example */}
      <div className="mt-8 bg-gray-900 rounded-lg p-6 text-gray-100">
        <h3 className="text-lg font-semibold mb-4">Usage Example</h3>
        <pre className="text-sm overflow-x-auto">
{`// Simple usage with useAlert hook
const { AlertModal, confirm, success } = useAlert();

// In your component
const handleDelete = () => {
  confirm(
    'Delete Tour Request',
    'This action cannot be undone.',
    () => {
      // Delete logic here
      success('Deleted', 'Tour request removed.');
    }
  );
};

// Don't forget to render the modal
return (
  <div>
    {/* Your content */}
    {AlertModal}
  </div>
);`}
        </pre>
      </div>

      {/* Render the alert modals */}
      {AlertModal}
      {manualAlert && <UniversalAlertModal {...manualAlert} />}
    </div>
  );
} 