import { NextRequest, NextResponse } from 'next/server'
import { createVaultItemWithTime } from '@/app/trip/[tripId]/actions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const { name, description, activityType, startTime, endTime } = await request.json()

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Name, start time, and end time are required' },
        { status: 400 }
      )
    }

    const result = await createVaultItemWithTime(
      tripId,
      name,
      description || '',
      activityType || 'Other',
      startTime,
      endTime
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to create vault item with time:', error)
    return NextResponse.json(
      { error: 'Failed to create vault item with time' },
      { status: 500 }
    )
  }
} 