# Database-Driven Architecture Refactor Plan

## Current Problems
- Static JSON files don't scale
- No user authentication/management
- No real-time updates
- Deployment issues with file-based data
- No data relationships or integrity
- Can't handle community-driven content

## Target Architecture

### 1. Database Schema (PostgreSQL)

```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user', -- user, moderator, admin
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Geographic Organization (like original BYOFL)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  scene_health_score INTEGER, -- Integration with Scene Health Index
  created_at TIMESTAMP DEFAULT NOW()
);

-- Venues (Core BYOFL functionality)
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location_id UUID REFERENCES locations(id),
  venue_type VARCHAR(50) NOT NULL, -- house-show, basement, vfw-hall, record-store, etc.
  capacity INTEGER,
  age_restriction VARCHAR(20),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website VARCHAR(255),
  social_handles JSONB,
  equipment JSONB, -- PA, mics, drums, etc.
  features TEXT[],
  pricing JSONB,
  description TEXT,
  images TEXT[],
  verified BOOLEAN DEFAULT false,
  submitted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Artists/Bands
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location_id UUID REFERENCES locations(id),
  artist_type VARCHAR(50), -- band, solo, collective
  genres TEXT[],
  members INTEGER,
  year_formed INTEGER,
  tour_status VARCHAR(20),
  contact_email VARCHAR(255),
  website VARCHAR(255),
  social_handles JSONB,
  equipment_needs JSONB,
  description TEXT,
  images TEXT[],
  verified BOOLEAN DEFAULT false,
  submitted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scene Infrastructure (Labels, Radio, Stores, Zines)
CREATE TABLE scene_infrastructure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- label, radio, record-store, zine, distributor
  location_id UUID REFERENCES locations(id),
  contact_info JSONB,
  description TEXT,
  specialties TEXT[],
  verified BOOLEAN DEFAULT false,
  submitted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tour Requests (Modern addition)
CREATE TABLE tour_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  target_locations UUID[], -- Array of location IDs
  genres TEXT[],
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Community Reviews/Reports
CREATE TABLE scene_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  venue_id UUID REFERENCES venues(id) NULL,
  author_id UUID REFERENCES users(id),
  title VARCHAR(255),
  content TEXT,
  report_type VARCHAR(50), -- venue-review, scene-report, tour-report
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Technology Stack Changes

**Current**: Static JSON files + Next.js API routes
**Target**: PostgreSQL + Prisma ORM + Next.js + Authentication

### 3. Implementation Steps

#### Step 1: Database Setup
- [ ] Set up PostgreSQL (local + production)
- [ ] Install Prisma ORM
- [ ] Create database schema
- [ ] Migrate existing JSON data to database

#### Step 2: Authentication System
- [ ] Implement NextAuth.js
- [ ] User registration/login
- [ ] Role-based permissions
- [ ] Email verification

#### Step 3: API Refactor
- [ ] Replace file-based APIs with database queries
- [ ] Add CRUD operations for all entities
- [ ] Implement proper error handling
- [ ] Add data validation

#### Step 4: Community Features
- [ ] User-submitted venue/artist listings
- [ ] Community moderation system
- [ ] Scene reports and reviews
- [ ] Content approval workflow

#### Step 5: Advanced Features
- [ ] Geographic search optimization
- [ ] Tour planning tools
- [ ] Real-time messaging
- [ ] Mobile PWA optimization

## Migration Strategy

### Phase 1: Database Foundation (Week 1)
1. Set up PostgreSQL locally and on Vercel
2. Install and configure Prisma
3. Create initial schema
4. Migrate existing JSON data

### Phase 2: API Refactor (Week 2)
1. Replace venues API with database queries
2. Replace artists API with database queries
3. Add proper error handling
4. Test all existing functionality

### Phase 3: Authentication (Week 3)
1. Implement NextAuth.js
2. Add user registration/login
3. Protect admin routes
4. Add user profiles

### Phase 4: Community Features (Week 4)
1. User-submitted content forms
2. Moderation dashboard
3. Community reviews
4. Content approval system

## Benefits of This Refactor

1. **Scalability**: Handle thousands of venues/artists
2. **Real-time Updates**: Community can add/edit content
3. **Data Integrity**: Proper relationships and validation
4. **User Management**: Authentication and permissions
5. **Community-Driven**: User-submitted content like original BYOFL
6. **Deployment Reliability**: No more file-based deployment issues
7. **Search Performance**: Database indexing and optimization
8. **Geographic Organization**: Proper location-based queries

## Immediate Next Steps

1. **Stop current development** on static file approach
2. **Set up PostgreSQL** database
3. **Install Prisma ORM**
4. **Create database schema**
5. **Migrate existing data**
6. **Refactor APIs** to use database

This refactor aligns with the original BYOFL vision of a community-driven, scalable platform that can handle real-time updates and user-generated content. 