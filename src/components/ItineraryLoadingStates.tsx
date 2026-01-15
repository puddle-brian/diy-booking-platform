import React from 'react';

interface ItineraryLoadingStatesProps {
  loading: boolean;
  fetchError: string | null;
  onRetry: () => void;
  children: React.ReactNode;
}

export function ItineraryLoadingStates({ 
  loading, 
  fetchError, 
  onRetry, 
  children 
}: ItineraryLoadingStatesProps) {
  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-primary p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-bg-tertiary w-1/4 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-border-primary p-4">
                <div className="h-4 bg-bg-tertiary w-3/4 mb-2"></div>
                <div className="h-3 bg-bg-tertiary w-1/2 mb-2"></div>
                <div className="h-3 bg-bg-tertiary w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-bg-secondary border border-border-primary p-6">
        <div className="text-status-error text-center font-mono">
          <p>// ERROR: {fetchError}</p>
          <button 
            onClick={onRetry}
            className="mt-2 text-sm text-text-secondary hover:text-text-primary underline"
          >
            [RETRY]
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 