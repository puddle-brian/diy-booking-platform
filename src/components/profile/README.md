# Modular Profile System

A comprehensive, reusable profile display system that brings the same benefits to profile pages that the EntityForm system brought to forms - consistency, maintainability, and better UX through proper information hierarchy.

## 🎯 Problem Solved

**Before**: Profile pages had inconsistent layouts, scattered information, and no clear visual hierarchy reflecting the importance of different content sections.

**After**: Modular, card-based profiles with clear information hierarchy, context-aware content display, and consistent UX patterns across all entity types.

## 🏗️ Architecture Overview

### Core Components

1. **ProfileModules.tsx** - Building block components
   - `ProfileCard` - Base card component with priority-based styling
   - `ProfileHeader` - Hero section with essential info and actions
   - `BookingStatusCard` - Primary functionality (tour dates/availability)
   - `TeamCredibilityCard` - Members and trust signals
   - `MediaShowcaseCard` - Photos, videos, music
   - `ContactEssentialCard` - Key contact and booking details
   - `DetailCard` - Expandable sections for detailed information

2. **ProfileLayout.tsx** - Main orchestrator component
   - Manages responsive grid layouts
   - Implements information hierarchy
   - Handles context-aware content display
   - Integrates existing components (TabbedTourItinerary, MediaSection)

3. **ArtistProfileDemo.tsx** - Migration example
   - Shows how to transform existing data structures
   - Demonstrates context and permission handling
   - Provides template for profile migrations

## 🎨 Information Hierarchy & Visual Design

### Priority-Based Card System

```tsx
// Primary Cards - Highest visual weight, core functionality
<ProfileCard priority="primary" size="large">
  // Tour dates, booking status, essential actions
</ProfileCard>

// Secondary Cards - Important supporting information
<ProfileCard priority="secondary" size="medium">
  // Team, contact info, media showcase
</ProfileCard>

// Tertiary Cards - Detailed specs and descriptions
<ProfileCard priority="tertiary" size="medium">
  // Equipment, genres, detailed descriptions
</ProfileCard>

// Admin Cards - Administrative controls
<ProfileCard priority="admin" size="medium">
  // Admin-only functionality
</ProfileCard>
```

### Visual Hierarchy

| Priority | Visual Treatment | Content Examples |
|----------|------------------|------------------|
| **Primary** | Blue border, large shadow, prominent | Tour dates, booking actions |
| **Secondary** | Gray border, medium shadow | Team, contact, media |
| **Tertiary** | Light gray background, subtle shadow | Equipment, genres, specs |
| **Admin** | Red background, admin controls | Entity management, moderation |

## 📱 Responsive Grid Layouts

### Desktop Layout (lg+)
```
[     Profile Header (full width)     ]
[     Tour Dates (full width)        ]
[  Team Card  ] [  Contact Card  ]
[     Media Section (full width)     ]
[ About ] [ Genres ] [ Equipment ]
```

### Tablet Layout (md)
```
[   Profile Header   ]
[   Tour Dates      ]
[ Team ] [ Contact  ]
[   Media Section   ]
[ About ] [ Genres  ]
[ Equipment Details ]
```

### Mobile Layout (sm)
```
[ Profile Header ]
[ Tour Dates    ]
[ Team Card     ]
[ Contact Card  ]
[ Media Section ]
[ About Card    ]
[ Genres Card   ]
[ Equipment     ]
```

## 🎯 Context-Aware Content Display

### User Context Types

```tsx
interface ProfileContext {
  viewerType: 'artist' | 'venue' | 'public' | 'admin';
  entityType: 'artist' | 'venue';
  isOwner: boolean;
  canEdit: boolean;
}
```

### Content Adaptation

| Viewer Type | Content Shown | Actions Available |
|-------------|---------------|-------------------|
| **Public** | Basic info, contact, media | Message, favorite |
| **Artist** | Full details, booking info | Message, view contact |
| **Venue** | Full details, tour status | Message, make offer |
| **Owner** | Everything + management | Edit, manage team, settings |
| **Admin** | Everything + admin controls | All actions + moderation |

## 🚀 Migration Strategy

### Step 1: Install the System

The modular profile components are ready to use alongside your existing profiles.

### Step 2: Create a Demo Implementation

```tsx
// Example: Migrate artist profile
import ProfileLayout from './components/profile/ProfileLayout';
import { ProfileContext, Artist } from './components/profile/ProfileModules';

const MyArtistProfile = ({ artist, members }) => {
  // Transform your data to match the modular system
  const transformedArtist: Artist = {
    // Map your existing fields to the modular interface
  };

  const context: ProfileContext = {
    // Determine user permissions and context
  };

  return (
    <ProfileLayout 
      entity={transformedArtist} 
      context={context} 
      members={members}
    />
  );
};
```

### Step 3: Gradual Migration

1. **Test with one profile type** (artist or venue)
2. **Compare side-by-side** with existing profiles
3. **Migrate one profile page at a time**
4. **Preserve all existing functionality**

### Step 4: Customize as Needed

```tsx
// Add custom content to any profile
<ProfileLayout entity={entity} context={context}>
  <CustomAnnouncementCard />
  <SpecialFeaturesSection />
</ProfileLayout>
```

## 🎨 Design Principles

### 1. **Information Hierarchy**
- **Primary**: Can I book them/play here? (Tour dates, availability)
- **Secondary**: Are they a good fit? (Team, contact, media)
- **Tertiary**: Detailed specs and logistics

### 2. **Progressive Disclosure**
- Essential information always visible
- Detailed specs in expandable cards
- Admin controls hidden from public users

### 3. **Context Awareness**
- Different information for different user types
- Relevant actions based on permissions
- Adaptive content based on viewer goals

### 4. **Mobile-First Design**
- Touch-friendly interactions
- Readable typography on small screens
- Logical content flow on mobile

## 🔧 Customization Options

### Custom Card Components

```tsx
// Create entity-specific cards
const ArtistTourHistoryCard = ({ artist }) => (
  <ProfileCard priority="secondary" size="medium">
    {/* Custom tour history content */}
  </ProfileCard>
);

// Add to ProfileLayout
<ProfileLayout entity={artist} context={context}>
  <ArtistTourHistoryCard artist={artist} />
</ProfileLayout>
```

### Custom Styling

```tsx
// Override card styling
<ProfileCard 
  priority="primary" 
  className="border-green-200 bg-green-50"
>
  {/* Special featured content */}
</ProfileCard>
```

### Context-Specific Layouts

```tsx
// Different layouts for different contexts
const ProfileContent = ({ entity, context }) => {
  if (context.viewerType === 'admin') {
    return <AdminProfileLayout entity={entity} context={context} />;
  }
  
  return <StandardProfileLayout entity={entity} context={context} />;
};
```

## 📊 Benefits Achieved

### ✅ **Consistency**
- Unified visual language across all profiles
- Consistent interaction patterns
- Standardized information hierarchy

### ✅ **Maintainability**
- Single source of truth for profile components
- Easy to update styling across all profiles
- Modular components reduce code duplication

### ✅ **Better UX**
- Clear visual hierarchy guides user attention
- Context-aware content reduces cognitive load
- Progressive disclosure prevents information overload

### ✅ **Accessibility**
- Consistent keyboard navigation
- Proper heading hierarchy
- Screen reader friendly structure

### ✅ **Performance**
- Reusable components reduce bundle size
- Optimized rendering with React best practices
- Lazy loading for non-critical content

## 🔄 Integration with Existing Systems

### Works With Your Current Components

```tsx
// Integrates seamlessly with existing components
<ProfileLayout entity={entity} context={context}>
  <TabbedTourItinerary />  {/* Your existing component */}
  <MediaSection />         {/* Your existing component */}
  <TeamMembers />          {/* Your existing component */}
</ProfileLayout>
```

### Preserves All Functionality

- All existing features continue to work
- No breaking changes to current workflows
- Gradual migration path with no downtime

## 🎯 Next Steps

1. **Review the demo implementation** in `ArtistProfileDemo.tsx`
2. **Test with one profile type** to see the improvements
3. **Customize the components** to match your specific needs
4. **Migrate profiles gradually** to maintain stability
5. **Extend the system** with custom cards as needed

## 🤝 Best Practices

### Do's ✅
- Use the priority system to guide visual hierarchy
- Implement context-aware content display
- Test on mobile devices throughout development
- Preserve existing functionality during migration

### Don'ts ❌
- Don't show all information at once
- Don't ignore the information hierarchy
- Don't break existing user workflows
- Don't migrate everything at once

---

**This modular profile system transforms your entity profiles from scattered information displays into organized, user-focused experiences that guide visitors toward their goals while maintaining the authentic DIY community feel.** 