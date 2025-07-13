'use client'

import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment'
import { useDrop } from 'react-dnd'
import { ItineraryItem, VaultItem } from '@/lib/db'
import { addToItinerary, moveItinerary, deleteItinerary } from '@/app/trip/[tripId]/actions'
import { useTransition } from 'react'

const localizer = momentLocalizer(moment)
const DnDCalendar = withDragAndDrop(Calendar)

interface CalendarBoardProps {
  tripId: string
  itineraryItems: ItineraryItem[]
  tripStartDate?: string
  tripEndDate?: string
  onUpdate?: () => void
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: ItineraryItem
}

export default function CalendarBoard({ tripId, itineraryItems, tripStartDate, tripEndDate, onUpdate }: CalendarBoardProps) {
  const [isPending, startTransition] = useTransition()

  // Calculate default date based on trip start date or current date
  const getDefaultDate = () => {
    if (tripStartDate) {
      return new Date(tripStartDate)
    }
    return new Date()
  }

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'vaultItem',
    drop: (item: { id: string; name: string; vaultItem: VaultItem }, monitor) => {
      if (!monitor.didDrop()) {
        // Use trip start date if available, otherwise use current date
        const baseDate = tripStartDate ? new Date(tripStartDate) : new Date()
        const start = new Date(baseDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000) // Random time within 2 days of start
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2 hours duration
        
        startTransition(async () => {
          try {
            await addToItinerary(item.id, start.toISOString(), end.toISOString())
            onUpdate?.()
          } catch (error) {
            console.error('Failed to add to itinerary:', error)
          }
        })
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  // Convert itinerary items to calendar events
  const events: CalendarEvent[] = itineraryItems.map((item) => ({
    id: item.id,
    title: item.vault_item?.name || 'Untitled Activity',
    start: new Date(item.start_time),
    end: new Date(item.end_time),
    resource: item,
  }))

  const handleEventDrop = ({ event, start, end }: any) => {
    startTransition(async () => {
      try {
        await moveItinerary(event.id, start.toISOString(), end.toISOString())
        onUpdate?.()
      } catch (error) {
        console.error('Failed to move event:', error)
      }
    })
  }

  const handleEventResize = ({ event, start, end }: any) => {
    startTransition(async () => {
      try {
        await moveItinerary(event.id, start.toISOString(), end.toISOString())
        onUpdate?.()
      } catch (error) {
        console.error('Failed to resize event:', error)
      }
    })
  }

  const handleDeleteEvent = (eventId: string) => {
    startTransition(async () => {
      try {
        await deleteItinerary(eventId)
        onUpdate?.()
      } catch (error) {
        console.error('Failed to delete event:', error)
      }
    })
  }

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex items-center justify-between">
      <span className="truncate flex-1">{event.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDeleteEvent(event.id)
        }}
        className="ml-2 text-white hover:text-red-200 text-xs"
      >
        ×
      </button>
    </div>
  )

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {tripStartDate && tripEndDate ? (
          <>
            {new Date(tripStartDate).toLocaleDateString()} - {new Date(tripEndDate).toLocaleDateString()} Itinerary
          </>
        ) : (
          'Trip Itinerary'
        )}
        {isPending && <span className="ml-2 text-sm text-gray-500">(Updating...)</span>}
      </h3>
      
      <div 
        ref={drop as any}
        className={`h-[600px] bg-white rounded-lg border ${
          isOver ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
        }`}
      >
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: any) => event.start}
          endAccessor={(event: any) => event.end}
          defaultView="week"
          views={['week', 'day']}
          defaultDate={getDefaultDate()}
          selectable
          resizable
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          components={{
            event: EventComponent as any,
          }}
          style={{ height: '100%', padding: '16px' }}
          min={new Date(2023, 0, 1, 6, 0, 0)} // 6 AM
          max={new Date(2023, 0, 1, 23, 59, 59)} // 11:59 PM
        />
      </div>
      
      {isOver && (
        <div className="mt-2 text-sm text-primary-600 text-center">
          Drop here to add to itinerary
        </div>
      )}
    </div>
  )
}
