import { sql } from './db'

export async function updateVaultItemDB(itemId: string, name: string, description: string, activityType: string) {
  const result = await sql`
    UPDATE vault_items 
    SET name = ${name}, description = ${description}, activity_type = ${activityType}, updated_at = NOW()
    WHERE id = ${itemId}
    RETURNING trip_id
  `

  if (result.length === 0) {
    throw new Error('Vault item not found')
  }

  return result[0].trip_id
}

export async function createVaultItemCopyDB(tripId: string, originalItemId: string, name: string, description: string, activityType: string) {
  // Get the original item to copy its image_url
  const originalItem = await sql`
    SELECT image_url FROM vault_items WHERE id = ${originalItemId}
  `

  const imageUrl = originalItem.length > 0 ? originalItem[0].image_url : null

  await sql`
    INSERT INTO vault_items (trip_id, name, description, activity_type, image_url)
    VALUES (${tripId}, ${name}, ${description}, ${activityType}, ${imageUrl})
  `
}

export async function updateItineraryItemVaultReferenceDB(itineraryItemId: string, newVaultItemId: string) {
  const result = await sql`
    UPDATE itinerary_items 
    SET vault_item_id = ${newVaultItemId}, updated_at = NOW()
    WHERE id = ${itineraryItemId}
    RETURNING trip_id
  `

  if (result.length === 0) {
    throw new Error('Itinerary item not found')
  }

  return result[0].trip_id
} 