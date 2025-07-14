import { NextRequest, NextResponse } from 'next/server'
import { createVaultItemCopyDB } from '@/lib/db-operations'
import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { originalItemId, name, description, activityType } = await request.json()
    const { tripId } = await params
    
    await createVaultItemCopyDB(tripId, originalItemId, name, description, activityType)
    
    // Get the newly created vault item ID
    const result = await sql`
      SELECT id FROM vault_items 
      WHERE trip_id = ${tripId} 
      AND name = ${name} 
      AND description = ${description} 
      AND activity_type = ${activityType}
      ORDER BY created_at DESC 
      LIMIT 1
    `
    
    const vaultItemId = result[0]?.id
    revalidatePath(`/trip/${tripId}`)
    
    return NextResponse.json({ success: true, vaultItemId })
  } catch (error) {
    console.error('Failed to create vault item copy:', error)
    return NextResponse.json(
      { error: 'Failed to create vault item copy' },
      { status: 500 }
    )
  }
} 