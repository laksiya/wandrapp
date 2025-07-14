import { NextRequest, NextResponse } from 'next/server'
import { updateVaultItemDB } from '@/lib/db-operations'
import { revalidatePath } from 'next/cache'
import { sql } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  try {
    const { name, description, activityType } = await request.json()
    const { itemId } = await params
    
    const tripId = await updateVaultItemDB(itemId, name, description, activityType)
    revalidatePath(`/trip/${tripId}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update vault item:', error)
    return NextResponse.json(
      { error: 'Failed to update vault item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
    
    // First, delete all itinerary items that reference this vault item
    await sql`
      DELETE FROM itinerary_items 
      WHERE vault_item_id = ${itemId}
    `
    
    // Then delete the vault item itself
    const result = await sql`
      DELETE FROM vault_items 
      WHERE id = ${itemId}
      RETURNING trip_id
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Vault item not found' },
        { status: 404 }
      )
    }
    
    const tripId = result[0].trip_id
    revalidatePath(`/trip/${tripId}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete vault item:', error)
    return NextResponse.json(
      { error: 'Failed to delete vault item' },
      { status: 500 }
    )
  }
} 