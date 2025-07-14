// Valid activity types for the travel application
export const VALID_ACTIVITY_TYPES = [
  'Sightseeing',
  'Culture', 
  'Adventure',
  'Wellness',
  'Entertainment',
  'Shopping',
  'Events',
  'Transportation',
  'Accommodations',
  'Food & Drink',
  'Other'
] as const;

export type ActivityType = typeof VALID_ACTIVITY_TYPES[number];

// Function to validate and normalize activity type
export function validateActivityType(activityType: string): ActivityType {
  const normalized = activityType.trim();
  
  // Check for exact matches
  if (VALID_ACTIVITY_TYPES.includes(normalized as ActivityType)) {
    return normalized as ActivityType;
  }
  
  // Check for common variations
  const variations: Record<string, ActivityType> = {
    'museum': 'Culture',
    'gallery': 'Culture',
    'historical': 'Culture',
    'landmark': 'Sightseeing',
    'viewpoint': 'Sightseeing',
    'scenic': 'Sightseeing',
    'restaurant': 'Food & Drink',
    'cafe': 'Food & Drink',
    'bar': 'Food & Drink',
    'hotel': 'Accommodations',
    'accommodation': 'Accommodations',
    'transport': 'Transportation',
    'flight': 'Transportation',
    'train': 'Transportation',
    'shopping': 'Shopping',
    'retail': 'Shopping',
    'market': 'Shopping',
    'entertainment': 'Entertainment',
    'show': 'Entertainment',
    'concert': 'Entertainment',
    'adventure': 'Adventure',
    'outdoor': 'Adventure',
    'sport': 'Adventure',
    'wellness': 'Wellness',
    'spa': 'Wellness',
    'fitness': 'Wellness',
    'event': 'Events',
    'festival': 'Events',
    'activity': 'Other'
  };
  
  const lowerType = normalized.toLowerCase();
  for (const [key, value] of Object.entries(variations)) {
    if (lowerType.includes(key)) {
      return value;
    }
  }
  
  return 'Other';
}

// UI badge (background + text)
export function getActivityTypeColor(type: ActivityType): string {
  const colors: Record<ActivityType, string> = {
    Sightseeing: 'bg-amber-100 text-amber-700',
    Culture: 'bg-indigo-100 text-indigo-700',
    Adventure: 'bg-emerald-100 text-emerald-700',
    Wellness: 'bg-rose-100 text-rose-700',
    Entertainment: 'bg-teal-100 text-teal-700',
    Shopping: 'bg-lime-100 text-lime-700',
    Events: 'bg-fuchsia-100 text-fuchsia-700',
    Transportation: 'bg-sky-100 text-sky-700',
    Accommodations: 'bg-red-100 text-red-700',
    'Food & Drink': 'bg-violet-100 text-violet-700',
    Other: 'bg-slate-100 text-slate-700',
  };
  return colors[type] ?? colors.Other;
}

// Hex mid-tone (calendar fill / outlines)
export function getActivityTypeHexColor(type: ActivityType): string {
  const hex: Record<ActivityType, string> = {
    Sightseeing: '#F59E0B',      // amber-500
    Culture: '#6366F1',          // indigo-500
    Adventure: '#10B981',        // emerald-500
    Wellness: '#F43F5E',         // rose-500
    Entertainment: '#14B8A6',    // teal-500
    Shopping: '#84CC16',         // lime-500
    Events: '#D946EF',           // fuchsia-500
    Transportation: '#0EA5E9',   // sky-500
    Accommodations: '#EF4444',   // red-500
    'Food & Drink': '#8B5CF6',   // violet-500
    Other: '#64748B',            // slate-500
  };
  return hex[type] ?? hex.Other;
}

// Border colour (vault item outline)
export function getActivityTypeBorderColor(type: ActivityType): string {
  const borders: Record<ActivityType, string> = {
    Sightseeing: 'border-amber-500',
    Culture: 'border-indigo-500',
    Adventure: 'border-emerald-500',
    Wellness: 'border-rose-500',
    Entertainment: 'border-teal-500',
    Shopping: 'border-lime-500',
    Events: 'border-fuchsia-500',
    Transportation: 'border-sky-500',
    Accommodations: 'border-red-500',
    'Food & Drink': 'border-violet-500',
    Other: 'border-slate-500',
  };
  return borders[type] ?? borders.Other;
}

