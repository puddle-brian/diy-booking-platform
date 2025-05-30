# Artist Template System Specification

## Overview
The Artist Template System allows bands/artists to create reusable templates for tour requests, eliminating the need to re-enter the same technical and business information for every show request.

## Problem Statement
Currently, when artists request shows, they must manually fill out extensive forms with:
- Technical rider information (equipment needs, stage requirements)
- Business terms (guarantee ranges, door deals, merchandising)
- Logistics preferences (travel method, lodging, draw expectations)

This creates friction and repetitive work for touring artists who often have consistent requirements across multiple venues.

## Solution
Create a template system that allows artists to:
1. **Save** commonly used configurations as named templates
2. **Apply** templates to quickly populate tour request forms
3. **Manage** multiple templates for different scenarios (full band vs acoustic, festival vs club shows)
4. **Customize** template-filled forms before submission

## Database Schema

### New Table: `ArtistTemplate`
```sql
CREATE TABLE "ArtistTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "artistId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "TemplateType" NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  
  -- Tech Rider Fields
  "equipment" JSONB,
  "stageRequirements" TEXT,
  "soundCheckTime" INTEGER,
  "setLength" INTEGER,
  
  -- Business Fields
  "guaranteeRange" JSONB,
  "acceptsDoorDeals" BOOLEAN,
  "merchandising" BOOLEAN,
  
  -- Logistics Fields
  "travelMethod" TEXT,
  "lodging" TEXT,
  "expectedDraw" INTEGER,
  "ageRestriction" TEXT,
  "tourStatus" TEXT,
  "additionalRequests" TEXT,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE
);

CREATE TYPE "TemplateType" AS ENUM (
  'TECH_RIDER',
  'BUSINESS', 
  'LOGISTICS',
  'COMPLETE'
);
```

### Updated Artist Table
```sql
-- Add relation to templates
ALTER TABLE "Artist" ADD COLUMN "templates" (relation to ArtistTemplate[])
```

## TypeScript Types

```typescript
export type TemplateType = 'TECH_RIDER' | 'BUSINESS' | 'LOGISTICS' | 'COMPLETE';

export interface ArtistTemplate {
  id: string;
  artistId: string;
  name: string; // "Full Band Setup", "Acoustic Tour", "Festival Setup"
  type: TemplateType;
  isDefault: boolean;
  description?: string;
  
  // Tech Rider
  equipment?: {
    needsPA: boolean;
    needsMics: boolean;
    needsDrums: boolean;
    needsAmps: boolean;
    acoustic: boolean;
  };
  stageRequirements?: string;
  soundCheckTime?: number; // Minutes needed for soundcheck
  setLength?: number; // Set length in minutes
  
  // Business
  guaranteeRange?: {
    min: number;
    max: number;
  };
  acceptsDoorDeals?: boolean;
  merchandising?: boolean;
  
  // Logistics  
  travelMethod?: 'van' | 'flying' | 'train' | 'other';
  lodging?: 'floor-space' | 'hotel' | 'flexible';
  expectedDraw?: number;
  ageRestriction?: 'all-ages' | '18+' | '21+' | 'flexible';
  tourStatus?: string;
  additionalRequests?: string;
  
  createdAt: string;
  updatedAt: string;
}

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  TECH_RIDER: 'Tech Rider Only',
  BUSINESS: 'Business Terms Only', 
  LOGISTICS: 'Logistics Only',
  COMPLETE: 'Complete Template'
};
```

## API Endpoints

### GET `/api/artists/[id]/templates`
**Purpose**: Fetch all templates for an artist
**Response**: 
```json
{
  "templates": [
    {
      "id": "template_123",
      "artistId": "artist_456", 
      "name": "Full Band Setup",
      "type": "COMPLETE",
      "isDefault": true,
      "equipment": { "needsPA": true, "needsMics": true },
      "guaranteeRange": { "min": 500, "max": 1500 },
      // ... other fields
    }
  ]
}
```

### POST `/api/artists/[id]/templates`
**Purpose**: Create a new template
**Body**:
```json
{
  "name": "Acoustic Setup",
  "type": "COMPLETE", 
  "isDefault": false,
  "equipment": { "needsPA": true, "acoustic": true },
  "guaranteeRange": { "min": 200, "max": 800 }
}
```

### PUT `/api/artists/[id]/templates/[templateId]`
**Purpose**: Update existing template

### DELETE `/api/artists/[id]/templates/[templateId]`
**Purpose**: Delete template

## UI Components

### 1. TemplateSelector Component
**Location**: Used in tour request forms
**Purpose**: Dropdown to select and apply templates

```typescript
interface TemplateSelectorProps {
  artistId: string;
  onTemplateApply: (template: ArtistTemplate) => void;
  className?: string;
}
```

**Features**:
- Dropdown showing template names grouped by type
- "Apply Template" button
- Shows template description on hover
- Indicates default template with star icon

### 2. TemplateManager Component  
**Location**: Modal accessible from artist dashboard
**Purpose**: CRUD operations for templates

**Features**:
- List all templates with edit/delete actions
- "Create New Template" button
- Form for creating/editing templates
- Set default template toggle
- Template type selector
- Preview of what fields will be filled

### 3. Template Integration in Forms
**Location**: Tour request forms (Add Date modal, Tour Request modal)
**Implementation**:
- Add TemplateSelector at top of form
- When template applied, populate form fields
- Show visual indicator of which fields were auto-filled
- Allow manual override of template values

## User Experience Flow

### Creating a Template
1. Artist fills out a tour request form manually
2. Before submitting, option to "Save as Template"
3. Modal opens asking for template name and type
4. Template saved and available for future use

### Using a Template
1. Artist opens tour request form
2. Template selector shows at top with available templates
3. Artist selects template from dropdown
4. Form auto-populates with template values
5. Artist can modify any fields before submitting
6. Submit creates tour request (not template)

### Managing Templates
1. Artist dashboard has "Manage Templates" button
2. Opens modal showing all templates
3. Can create new, edit existing, delete, or set default
4. Default template auto-applies when opening forms

## Template Types

### TECH_RIDER
- Equipment needs
- Stage requirements  
- Sound check time
- Set length

### BUSINESS
- Guarantee ranges
- Door deal acceptance
- Merchandising preferences

### LOGISTICS
- Travel method
- Lodging preferences
- Expected draw
- Age restrictions

### COMPLETE
- All fields from above types
- Most comprehensive option

## Implementation Priority

### Phase 1: Core Functionality
1. Database schema and migrations
2. Basic API endpoints (GET, POST)
3. TemplateSelector component
4. Integration in tour request forms

### Phase 2: Management Features
1. TemplateManager component
2. Edit/Delete functionality
3. Default template system

### Phase 3: Enhanced UX
1. Template creation from existing forms
2. Visual indicators for auto-filled fields
3. Template preview/validation
4. Bulk operations

## Technical Considerations

### Data Validation
- Ensure template fields match tour request form schema
- Validate JSON structure for complex fields
- Handle missing/null values gracefully

### Performance
- Cache frequently used templates
- Lazy load template data
- Optimize database queries with proper indexing

### Security
- Verify artist ownership before template operations
- Sanitize user input in template data
- Rate limit template creation

### Migration Strategy
- Add new tables without breaking existing functionality
- Provide migration scripts for existing data
- Gradual rollout with feature flags

## Success Metrics
- Reduction in tour request form completion time
- Increased tour request submission rates
- User adoption of template features
- Reduced form abandonment rates

## Future Enhancements
- Template sharing between band members
- Community template marketplace
- AI-suggested templates based on genre/location
- Template versioning and history
- Bulk template operations
- Template import/export functionality

---

**Note**: This specification should be implemented in a clean development environment to avoid the compilation and database issues encountered in the previous session. All database operations should be thoroughly tested before deployment to production. 