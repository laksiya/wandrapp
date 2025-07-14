import { NextRequest, NextResponse } from 'next/server'
import { updateItineraryItemVaultReferenceDB } from '@/lib/db-operations'
import { revalidatePath } from 'next/cache'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  try {
    const { newVaultItemId } = await request.json()
    const { itemId } = await params
    
    const tripId = await updateItineraryItemVaultReferenceDB(itemId, newVaultItemId)
    revalidatePath(`/trip/${tripId}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update itinerary item vault reference:', error)
    return NextResponse.json(
      { error: 'Failed to update itinerary item vault reference' },
      { status: 500 }
    )
  }
} 