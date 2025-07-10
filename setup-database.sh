#!/bin/bash

# Database setup script for Travel Workspace MVP
# Make sure to update DATABASE_URL in .env.local first

echo "🗄️  Setting up Travel Workspace database tables..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found. Please set it in .env.local"
    exit 1
fi

# Create tables using psql
psql "$DATABASE_URL" << 'EOF'
-- Trips table to store trip information
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT 'My Trip',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vault items table for storing uploaded activities
CREATE TABLE IF NOT EXISTS vault_items (
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
CREATE TABLE IF NOT EXISTS itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  vault_item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vault_items_trip_id ON vault_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_vault_item_id ON itinerary_items(vault_item_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_start_time ON itinerary_items(start_time);

-- Insert a sample trip for development (ignore if exists)
INSERT INTO trips (id, name) VALUES ('seed-id', 'Sample Trip') 
ON CONFLICT (id) DO NOTHING;

\q
EOF

echo "✅ Database tables created successfully!"
echo "🚀 You can now test the app at http://localhost:3002/trip/seed-id"
