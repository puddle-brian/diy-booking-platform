// Import all modules
import { venueOfferModule } from './VenueOfferModule';
import { artistRequirementsModule } from './ArtistRequirementsModule';
import { showScheduleModule } from './ShowScheduleModule';

// Import registry
import { moduleRegistry } from './ModuleRegistry';

/**
 * Register all available modules
 * 
 * Adding a new module is as simple as:
 * 1. Create the module file (e.g., OpeningBandsModule.tsx)
 * 2. Import it here
 * 3. Add one line: moduleRegistry.register(openingBandsModule);
 * 
 * The module system will automatically:
 * - Include it in documents
 * - Handle permissions
 * - Manage edit/save state
 * - Apply status workflow
 */

// Register the existing 3 modules
moduleRegistry.register(venueOfferModule);
moduleRegistry.register(artistRequirementsModule);
moduleRegistry.register(showScheduleModule);

// Example of how easy it would be to add "Opening Bands" module:
// moduleRegistry.register(openingBandsModule);

/**
 * Export everything needed
 */
export { moduleRegistry, initializeModules } from './ModuleRegistry';
export type { ModuleDefinition, ModuleComponentProps } from './ModuleRegistry';

/**
 * EXAMPLE: Future "Opening Bands" module would look like this:
 * 
 * export const openingBandsModule: ModuleDefinition = {
 *   id: 'opening-bands',
 *   title: 'Opening Bands & Lineup',
 *   owner: 'shared',  // Both artist and venue can edit
 *   order: 4,         // Comes after the 3 existing modules
 *   defaultStatus: 'draft',
 *   
 *   canEdit: (viewerType, status) => {
 *     return viewerType !== 'public' && status !== 'locked';
 *   },
 *   
 *   canView: (viewerType) => true,
 *   
 *   extractData: (context) => {
 *     // Extract opening band data from show/bid/request
 *     return {
 *       openingBands: context.show?.openingBands || [],
 *       localOpener: context.bid?.localOpener || null,
 *       // ... etc
 *     };
 *   },
 *   
 *   component: OpeningBandsComponent
 * };
 * 
 * Then just add: moduleRegistry.register(openingBandsModule);
 * And it automatically appears in all documents!
 */ 