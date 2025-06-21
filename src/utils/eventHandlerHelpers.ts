/**
 * 🎯 MICRO-PHASE C: Event Handler Helper Utilities
 * 
 * Extracts complex callback creation logic from TabbedTourItinerary
 * to reduce visual complexity while maintaining exact same behavior.
 * 
 * These are pure helper functions that create the callbacks needed
 * by useItineraryEventHandlers without changing any interfaces.
 */

/**
 * Creates the complex setBidStatusOverrides callback
 */
export function createBidStatusOverridesCallback(
  bidStatusOverrides: Map<string, any>,
  setBidStatusOverride: (key: string, value: any) => void
) {
  return (setValue: any) => {
    if (typeof setValue === 'function') {
      const newMap = setValue(bidStatusOverrides);
      // Handle Map updates by iterating through changes
      newMap.forEach((value: any, key: string) => {
        if (!bidStatusOverrides.has(key) || bidStatusOverrides.get(key) !== value) {
          setBidStatusOverride(key, value);
        }
      });
    } else {
      console.warn('setBidStatusOverrides called with non-function');
    }
  };
}

/**
 * Creates the complex setDeclinedBids callback
 */
export function createDeclinedBidsCallback(
  declinedBids: Set<string>,
  addDeclinedBid: (bidId: string) => void
) {
  return (setValue: any) => {
    if (typeof setValue === 'function') {
      const currentSet = declinedBids;
      const newSet = setValue(currentSet);
      // Handle Set updates by finding differences
      newSet.forEach((bidId: string) => {
        if (!currentSet.has(bidId)) {
          addDeclinedBid(bidId);
        }
      });
    } else {
      console.warn('setDeclinedBids called with non-function');
    }
  };
}

/**
 * Creates the complex setAddDateForm callback
 */
export function createAddDateFormCallback(
  addDateForm: any,
  addDateFormActions: any
) {
  return (updateFunction: any) => {
    // 🎯 MICRO-PHASE C: Compatibility wrapper for event handlers hook
    const currentForm = addDateForm;
    const updatedForm = updateFunction(currentForm);
    addDateFormActions.updateForm(updatedForm);
  };
} 