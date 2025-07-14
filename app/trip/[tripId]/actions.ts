'use server'

import { sql, VaultItem, ItineraryItem } from '@/lib/db'
import { parseScreenshot } from '@/lib/openai'
import { revalidatePath } from 'next/cache'
import { Storage } from '@google-cloud/storage'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { updateVaultItemDB, createVaultItemCopyDB, updateItineraryItemVaultReferenceDB } from '@/lib/db-operations'

// Initialize Google Cloud Storage (for production)
let storage: Storage | null = null
try {
  console.log('GCP_SERVICE_KEY length:', process.env.GCP_SERVICE_KEY?.length)
  console.log('GCP_SERVICE_KEY first 100 chars:', process.env.GCP_SERVICE_KEY?.substring(0, 100))
  
  if (process.env.GCP_SERVICE_KEY) {
    let serviceKey: any
    
    // Handle different formats of the service key
    if (process.env.GCP_SERVICE_KEY.startsWith('{')) {
      // It's already a JSON string
      serviceKey = JSON.parse(process.env.GCP_SERVICE_KEY)
    } else {
      // It might be base64 encoded or have escaped quotes
      try {
        // Try to decode if it's base64
        const decoded = Buffer.from(process.env.GCP_SERVICE_KEY, 'base64').toString()
        serviceKey = JSON.parse(decoded)
      } catch {
        // If that fails, try to parse as-is
        serviceKey = JSON.parse(process.env.GCP_SERVICE_KEY)
      }
    }

    console.log('Parsed service key project_id:', serviceKey.project_id)

    storage = new Storage({
      projectId: serviceKey.project_id,
      credentials: serviceKey,
    })
  }
} catch (error) {
  console.log('GCP Storage not configured, using local storage for development')
  console.log('Error details:', error)
}

export async function uploadScreenshot(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const tripId = formData.get('tripId') as string
    const manualData = formData.get('manualData') as string

    if (!file || !tripId) {
      throw new Error('File and tripId are required')
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let parsed: { name: string; description: string; activityType: string }

    if (manualData) {
      // Use manual data instead of AI parsing
      const data = JSON.parse(manualData)
      parsed = {
        name: data.name,
        description: data.description || '',
        activityType: data.activityType
      }
    } else {
      // Parse image with OpenAI Vision using the file buffer directly
      parsed = await parseScreenshot(file)
    }

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

export async function createTrip(name: string, startDate?: string, endDate?: string) {
  try {
    const result = await sql`
      INSERT INTO trips (name, start_date, end_date)
      VALUES (${name}, ${startDate || null}, ${endDate || null})
      RETURNING id, name, start_date, end_date, created_at
    `
    
    if (result.length === 0) {
      throw new Error('Failed to create trip')
    }

    return { 
      success: true, 
      trip: {
        id: result[0].id,
        name: result[0].name,
        start_date: result[0].start_date,
        end_date: result[0].end_date,
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

export async function getImageFromGCS(imageUrl: string): Promise<string | null> {
  try {
    if (!storage || !imageUrl.includes('storage.googleapis.com')) {
      return null;
    }

    // Extract bucket name and file path from GCS URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketName = pathParts[1];
    const fileName = pathParts.slice(2).join('/');

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    // Download the file as a buffer
    const [buffer] = await file.download();

    // Convert to base64 data URL
    const base64 = buffer.toString('base64');
    const contentType = file.metadata?.contentType || 'image/jpeg';

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to download image from GCS:', error);
    return null;
  }
}

export async function createVaultItem(tripId: string, name: string, description: string, activityType: string) {
  try {
    await sql`
      INSERT INTO vault_items (trip_id, name, description, activity_type)
      VALUES (${tripId}, ${name}, ${description}, ${activityType})
    `

    revalidatePath(`/trip/${tripId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to create vault item:', error)
    throw new Error('Failed to create vault item')
  }
}

export async function updateVaultItem(itemId: string, name: string, description: string, activityType: string) {
  try {
    const tripId = await updateVaultItemDB(itemId, name, description, activityType)
    revalidatePath(`/trip/${tripId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update vault item:', error)
    throw new Error('Failed to update vault item')
  }
}

export async function createVaultItemCopy(tripId: string, originalItemId: string, name: string, description: string, activityType: string) {
  try {
    await createVaultItemCopyDB(tripId, originalItemId, name, description, activityType)
    revalidatePath(`/trip/${tripId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to create vault item copy:', error)
    throw new Error('Failed to create vault item copy')
  }
}

export async function updateItineraryItemVaultReference(itineraryItemId: string, newVaultItemId: string) {
  try {
    const tripId = await updateItineraryItemVaultReferenceDB(itineraryItemId, newVaultItemId)
    revalidatePath(`/trip/${tripId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update itinerary item vault reference:', error)
    throw new Error('Failed to update itinerary item vault reference')
  }
}
