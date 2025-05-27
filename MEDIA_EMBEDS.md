# Media Embeds Feature

## Overview

The Media Embeds feature allows artists and venues to showcase their content directly on their profiles by embedding videos and music from popular platforms. This saves storage space, keeps content up-to-date, and provides a professional way to display multimedia content.

## Supported Platforms

- **YouTube** - Music videos, live performances, venue tours, interviews
- **Spotify** - Tracks, albums, playlists, artist profiles  
- **SoundCloud** - Original tracks, remixes, DJ sets, podcasts
- **Bandcamp** - Independent releases with direct sales integration

## Components

### MediaEmbed Component

The main component that renders embedded content from supported platforms.

```tsx
import MediaEmbed from '../components/MediaEmbed';

<MediaEmbed 
  url="https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh"
  title="Latest Single"
  className="w-full"
/>
```

**Props:**
- `url` (string, required) - The URL from a supported platform
- `title` (string, optional) - Display title for the embed
- `className` (string, optional) - Additional CSS classes

### MediaEmbedForm Component

A form component for adding/editing media embeds with URL validation and preview.

```tsx
import MediaEmbedForm from '../components/MediaEmbedForm';

<MediaEmbedForm
  onSave={(data) => console.log('Saved:', data)}
  onCancel={() => console.log('Cancelled')}
  initialData={existingEmbed} // Optional for editing
/>
```

**Props:**
- `onSave` (function, required) - Callback when embed is saved
- `onCancel` (function, required) - Callback when form is cancelled  
- `initialData` (object, optional) - Pre-populate form for editing

### FeaturedMediaEmbed Component

A compact component that displays featured media content at the top of profiles.

```tsx
import FeaturedMediaEmbed from '../components/FeaturedMediaEmbed';

<FeaturedMediaEmbed
  entityId={venue.id}
  entityType="venue"
  className="mb-6"
/>
```

**Props:**
- `entityId` (string, required) - The ID of the venue or artist
- `entityType` ('venue' | 'artist', required) - Type of entity
- `className` (string, optional) - Additional CSS classes

### MediaEmbedSection Component

A full-featured media management section with tabs, editing capabilities, and featured content management.

```tsx
import MediaEmbedSection from '../components/MediaEmbedSection';

<MediaEmbedSection
  entityId={artist.id}
  entityType="artist"
  canEdit={permissions.canEditArtist(artist.id)}
  maxEmbeds={10}
/>
```

**Props:**
- `entityId` (string, required) - The ID of the venue or artist
- `entityType` ('venue' | 'artist', required) - Type of entity
- `canEdit` (boolean, optional) - Whether user can edit embeds
- `maxEmbeds` (number, optional) - Maximum number of embeds allowed
- `showFeaturedOnly` (boolean, optional) - Only show featured content

## Features

### Automatic Platform Detection
The system automatically detects which platform a URL is from and configures the appropriate embed settings.

### Responsive Design
All embeds are responsive and work perfectly on mobile devices with appropriate aspect ratios for each platform type.

### Error Handling
- Invalid URLs show helpful error messages
- Failed embeds display fallback content
- Loading states provide visual feedback

### URL Validation
- Real-time validation as users type
- Clear feedback about supported platforms
- Auto-generated titles based on platform type

## Usage Examples

### For Artists
```tsx
// Showcase latest music release
<MediaEmbed 
  url="https://open.spotify.com/album/xyz"
  title="New Album - Available Now"
/>

// Feature a music video
<MediaEmbed 
  url="https://youtube.com/watch?v=abc123"
  title="Official Music Video"
/>
```

### For Venues
```tsx
// Virtual venue tour
<MediaEmbed 
  url="https://youtube.com/watch?v=venue-tour"
  title="Take a Virtual Tour"
/>

// Highlight past performances
<MediaEmbed 
  url="https://soundcloud.com/venue/live-set"
  title="Live Performance Highlights"
/>
```

## Benefits

### 💾 Storage Efficiency
- No need to upload large video/audio files
- Reduces server storage costs
- Faster page load times

### 🔄 Always Current
- Content automatically updates from source
- No need to re-upload when artists update their content
- Links remain valid as long as original content exists

### 📱 Mobile Optimized
- Responsive design works on all screen sizes
- Touch-friendly controls
- Optimized for mobile data usage

### 🎯 Professional Presentation
- Clean, consistent design across all platforms
- Platform indicators help users know what to expect
- Seamless integration with your site's design

## Implementation in Profiles

To add media embeds to artist/venue profiles:

1. Add an embeds array to your profile data structure
2. Use the MediaEmbedForm for adding/editing embeds
3. Display embeds using the MediaEmbed component
4. Store embed data (URL, title, description) in your database

```tsx
// Example profile structure
interface Profile {
  id: string;
  name: string;
  // ... other profile fields
  mediaEmbeds: {
    id: string;
    url: string;
    title: string;
    description?: string;
    order: number;
  }[];
}
```

## Demo

- Visit `/media-demo` to see the basic components in action with examples from all supported platforms
- Visit `/media-integration-demo` to see how the components integrate into venue and artist profiles with different permission levels

## Technical Notes

- All embeds use iframe sandboxing for security
- Lazy loading improves page performance
- CSP (Content Security Policy) headers may need adjustment for iframe sources
- Consider rate limiting embed additions to prevent abuse 