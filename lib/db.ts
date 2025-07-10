import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const sql = neon(process.env.DATABASE_URL);

export interface Trip {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface VaultItem {
  id: string;
  trip_id: string;
  name: string;
  description?: string;
  activity_type?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ItineraryItem {
  id: string;
  trip_id: string;
  vault_item_id: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  vault_item?: VaultItem;
}
