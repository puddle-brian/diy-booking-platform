import StateHookTest from '../../components/test/StateHookTest';

export default function TestStateHookPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">State Hook Test Page</h1>
      <p className="mb-4 text-gray-600">
        This page tests our new useItineraryState hook to ensure it works correctly 
        before we integrate it into the main itinerary component.
      </p>
      <StateHookTest />
    </div>
  );
} 