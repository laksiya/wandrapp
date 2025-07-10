'use server'

import { sql, VaultItem, ItineraryItem } from '@/lib/db'
import { parseScreenshot } from '@/lib/openai'
import { revalidatePath } from 'next/cache'
import { Storage } from '@google-cloud/storage'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// Initialize Google Cloud Storage (for production)
let storage: Storage | null = null
try {
  if (process.env.GCP_SERVICE_KEY && process.env.GCP_PROJECT_ID) {
    const serviceKey = typeof process.env.GCP_SERVICE_KEY === 'string' 
      ? JSON.parse(process.env.GCP_SERVICE_KEY)
      : process.env.GCP_SERVICE_KEY

    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: serviceKey,
    })
  }
} catch (error) {
  console.log('GCP Storage not configured, using local storage for development')
}

export async function uploadScreenshot(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const tripId = formData.get('tripId') as string

    if (!file || !tripId) {
      throw new Error('File and tripId are required')
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let imageUrl: string

    if (storage && process.env.GCP_BUCKET_NAME) {
      // Production: Upload to Google Cloud Storage
      const fileName = `${tripId}/${uuidv4()}-${file.name}`
      const bucket = storage.bucket(process.env.GCP_BUCKET_NAME)
      const gcsFile = bucket.file(fileName)

      await gcsFile.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      })

      imageUrl = `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${fileName}`
    } else {
      // Development: Save to local uploads folder
      const fileName = `${uuidv4()}-${file.name}`
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      
      // Ensure uploads directory exists
      await mkdir(uploadsDir, { recursive: true })
      
      const filePath = join(uploadsDir, fileName)
      await writeFile(filePath, buffer)
      
      imageUrl = `/uploads/${fileName}`
    }

    // Parse image with OpenAI Vision
    const parsed = await parseScreenshot(imageUrl)

    // Save to database
    await sql`
      INSERT INTO vault_items (trip_id, name, description, activity_type, image_url)
      VALUES (${tripId}, ${parsed.name}, ${parsed.description}, ${parsed.activityType}, ${imageUrl})
    `

    revalidatePath(`/trip/${tripId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Upload failed:', error)
    throw new Error('Failed to upload screenshot')
  }
}

export async function addToItinerary(itemId: string, startTime: string, endTime: string) {
  try {
    // Get the vault item to find the trip_id
    const vaultItems = await sql`
      SELECT trip_id FROM vault_items WHERE id = ${itemId}
    `
    
    if (vaultItems.length === 0) {
      throw new Error('Vault item not found')
    }

    const tripId = vaultItems[0].trip_id

    await sql`
      INSERT INTO itinerary_items (trip_id, vault_item_id, start_time, end_time)
      VALUES (${tripId}, ${itemId}, ${startTime}, ${endTime})
    `

    revalidatePath(`/trip/${tripId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to add to itinerary:', error)
    throw new Error('Failed to add to itinerary')
  }
}

export async function moveItinerary(itemId: string, startTime: string, endTime: string) {
  try {
    const result = await sql`
      UPDATE itinerary_items 
      SET start_time = ${startTime}, end_time = ${endTime}, updated_at = NOW()
      WHERE id = ${itemId}
      RETURNING trip_id
    `

    if (result.length === 0) {
      throw new Error('Itinerary item not found')
    }

    const tripId = result[0].trip_id
    revalidatePath(`/trip/${tripId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to move itinerary item:', error)
    throw new Error('Failed to move itinerary item')
  }
}

export async function deleteItinerary(itemId: string) {
  try {
    const result = await sql`
      DELETE FROM itinerary_items 
      WHERE id = ${itemId}
      RETURNING trip_id
    `

    if (result.length === 0) {
      throw new Error('Itinerary item not found')
    }

    const tripId = result[0].trip_id
    revalidatePath(`/trip/${tripId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to delete itinerary item:', error)
    throw new Error('Failed to delete itinerary item')
  }
}

export async function getVaultItems(tripId: string): Promise<VaultItem[]> {
  const items = await sql`
    SELECT * FROM vault_items 
    WHERE trip_id = ${tripId} 
    ORDER BY created_at DESC
  `
  return items as VaultItem[]
}

export async function getItineraryItems(tripId: string): Promise<ItineraryItem[]> {
  const items = await sql`
    SELECT 
      i.*,
      v.name as vault_name,
      v.description as vault_description,
      v.activity_type as vault_activity_type,
      v.image_url as vault_image_url
    FROM itinerary_items i
    LEFT JOIN vault_items v ON i.vault_item_id = v.id
    WHERE i.trip_id = ${tripId}
    ORDER BY i.start_time ASC
  `
  
  return items.map(item => ({
    id: item.id,
    trip_id: item.trip_id,
    vault_item_id: item.vault_item_id,
    start_time: item.start_time,
    end_time: item.end_time,
    created_at: item.created_at,
    updated_at: item.updated_at,
    vault_item: {
      id: item.vault_item_id,
      trip_id: item.trip_id,
      name: item.vault_name,
      description: item.vault_description,
      activity_type: item.vault_activity_type,
      image_url: item.vault_image_url,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }
  })) as ItineraryItem[]
}

export async function createTrip(name: string) {
  try {
    const result = await sql`
      INSERT INTO trips (name)
      VALUES (${name})
      RETURNING id, name, created_at
    `
    
    if (result.length === 0) {
      throw new Error('Failed to create trip')
    }

    return { 
      success: true, 
      trip: {
        id: result[0].id,
        name: result[0].name,
        created_at: result[0].created_at
      }
    }
  } catch (error) {
    console.error('Failed to create trip:', error)
    throw new Error('Failed to create trip')
  }
}

export async function getTrip(tripId: string) {
  try {
    const result = await sql`
      SELECT * FROM trips WHERE id = ${tripId}
    `

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error('Failed to get trip:', error)
    return null
  }
}
