# Travel Workspace Database Schema

## Tables

```sql
-- Trips table to store trip information
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT 'My Trip',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vault items table for storing uploaded activities
CREATE TABLE vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  activity_type VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itinerary items table for calendar events
CREATE TABLE itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  vault_item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_vault_items_trip_id ON vault_items(trip_id);
CREATE INDEX idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX idx_itinerary_items_vault_item_id ON itinerary_items(vault_item_id);
CREATE INDEX idx_itinerary_items_start_time ON itinerary_items(start_time);

-- Insert a sample trip for development
INSERT INTO trips (id, name) VALUES ('seed-id', 'Sample Trip');
```

## Migration (for existing databases)

If you already have a database set up, run this migration to add the new date fields:

```sql
-- Add start_date and end_date columns to existing trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS end_date DATE;
```

## Development Setup

1. Create a Neon database
2. Run the above SQL to create tables (or run the migration if you have an existing database)
3. Use `seed-id` as the trip ID for development: `http://localhost:3000/trip/seed-id`
