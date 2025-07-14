'use client'

import { Calendar, momentLocalizer, View, ToolbarProps } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment'
import { useDrop } from 'react-dnd'
import { ItineraryItem, VaultItem } from '@/lib/db'
import { addToItinerary, moveItinerary, deleteItinerary } from '@/app/trip/[tripId]/actions'
import { useTransition, useState, useEffect } from 'react'
import { getActivityTypeHexColor } from '@/lib/activityTypes'
import ActivityEditModal from './ActivityEditModal'

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

// Custom Toolbar for react-big-calendar
function CustomToolbar({ label, onNavigate, onView, view }: ToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2 py-2 border-b border-gray-100 bg-white">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('TODAY')} className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-100">Today</button>
          <button onClick={() => onNavigate('PREV')} className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-100">Back</button>
          <button onClick={() => onNavigate('NEXT')} className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-100">Next</button>
        </div>
        <div className="w-2" />
        <div className="flex items-center gap-2 border-l border-gray-200 pl-2 ml-2">
          <button
            onClick={() => onView('week')}
            className={`px-3 py-1 rounded border text-sm ${view === 'week' ? 'bg-primary-500 text-white' : 'bg-white hover:bg-gray-100'}`}
          >
            Week
          </button>
          <button
            onClick={() => onView('day')}
            className={`px-3 py-1 rounded border text-sm ${view === 'day' ? 'bg-primary-500 text-white' : 'bg-white hover:bg-gray-100'}`}
          >
            Day
          </button>
        </div>
      </div>
      <div className="text-base font-medium text-gray-800 text-center sm:text-right w-full sm:w-auto">
        {label}
      </div>
    </div>
  )
}

export default function CalendarBoard({ tripId, itineraryItems, tripStartDate, tripEndDate, onUpdate }: CalendarBoardProps) {
  const [isPending, startTransition] = useTransition()
  const [dragItem, setDragItem] = useState<any>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedVaultItem, setSelectedVaultItem] = useState<VaultItem | null>(null)
  const [selectedItineraryItem, setSelectedItineraryItem] = useState<ItineraryItem | null>(null)

  // Calculate default date based on trip start date or current date
  const getDefaultDate = () => {
    if (tripStartDate) {
      return new Date(tripStartDate)
    }
    return new Date()
  }

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'vaultItem',
    hover: (item: { id: string; name: string; vaultItem: VaultItem }, monitor) => {
      // Set the drag item when hovering over the calendar
      if (!dragItem) {
        setDragItem({
          id: item.id,
          title: item.name,
          start: new Date(),
          end: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours duration
          vaultItem: item.vaultItem
        })
      }
    },
    drop: (item: { id: string; name: string; vaultItem: VaultItem }, monitor) => {
      if (!monitor.didDrop()) {
        // This will be handled by onDropFromOutside instead
        console.log('Drop detected but handled by onDropFromOutside')
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

  const handleEventClick = (event: any) => {
    const calendarEvent = event as CalendarEvent
    if (calendarEvent.resource?.vault_item) {
      setSelectedVaultItem(calendarEvent.resource.vault_item)
      setSelectedItineraryItem(calendarEvent.resource)
      setEditModalOpen(true)
    }
  }

  const handleSave = async (data: { name: string; description: string; activityType: any }, saveToAll: boolean) => {
    if (!selectedVaultItem) return

    try {
      if (saveToAll) {
        // Update the original vault item
        const response = await fetch(`/api/trip/${tripId}/vault/${selectedVaultItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) throw new Error('Failed to update vault item')
      } else {
        // Create a copy and update the current itinerary item to reference the new vault item
        const response = await fetch(`/api/trip/${tripId}/vault/copy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalItemId: selectedVaultItem.id,
            ...data
          })
        })
        
        if (!response.ok) throw new Error('Failed to create vault item copy')
        
        // Get the new vault item ID from the response
        const result = await response.json()
        
        // Update the itinerary item to reference the new vault item
        if (selectedItineraryItem) {
          const updateResponse = await fetch(`/api/trip/${tripId}/itinerary/${selectedItineraryItem.id}/vault-reference`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newVaultItemId: result.vaultItemId })
          })
          
          if (!updateResponse.ok) throw new Error('Failed to update itinerary item reference')
        }
      }
      
      onUpdate?.()
    } catch (error) {
      console.error('Failed to save:', error)
      throw error
    }
  }

  const handleDelete = async (type: 'vault' | 'itinerary') => {
    if (!selectedVaultItem || !selectedItineraryItem) return

    try {
      if (type === 'itinerary') {
        // Delete the itinerary item
        await deleteItinerary(selectedItineraryItem.id)
      } else if (type === 'vault') {
        // Delete the vault item
        const response = await fetch(`/api/trip/${tripId}/vault/${selectedVaultItem.id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) throw new Error('Failed to delete vault item')
      }
      
      onUpdate?.()
    } catch (error) {
      console.error('Failed to delete:', error)
      throw error
    }
  }

  // Event style getter for calendar events
  const eventStyleGetter = (event: any, start: Date, end: Date, isSelected: boolean) => {
    const calendarEvent = event as CalendarEvent
    const activityType = calendarEvent.resource?.vault_item?.activity_type
    const backgroundColor = activityType ? getActivityTypeHexColor(activityType) : '#64748B'
    
    const style = {
      backgroundColor: backgroundColor,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      fontWeight: '500',
      fontSize: '12px', // Smaller text for mobile
      padding: '2px 4px', // Tighter padding
      margin: '1px 0', // Smaller margins
      minHeight: '20px', // Minimum height for touch targets
    }
    
    return {
      style: style
    }
  }

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex items-center justify-between">
      <span className="truncate flex-1 text-white font-medium">{event.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDeleteEvent(event.id)
        }}
        className="ml-2 text-white hover:text-red-200 text-xs font-bold"
      >
        ×
      </button>
    </div>
  )



  return (
    <div className="h-full flex flex-col">
      <div 
        ref={drop as any}
        className={`flex-1 bg-white ${
          isOver ? 'border-primary-500 bg-primary-50' : ''
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
          onSelectEvent={handleEventClick}
          eventPropGetter={eventStyleGetter}
          dragFromOutsideItem={() => dragItem}
          onDropFromOutside={({ start, end }) => {
            if (dragItem) {
              startTransition(async () => {
                try {
                  const startDate = new Date(start)
                  const endDate = new Date(end)
                  await addToItinerary(dragItem.id, startDate.toISOString(), endDate.toISOString())
                  onUpdate?.()
                  setDragItem(null)
                } catch (error) {
                  console.error('Failed to add to itinerary:', error)
                }
              })
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          components={{
            event: EventComponent as any,
            toolbar: CustomToolbar,
          }}
          formats={{
            timeGutterFormat: (date: Date) => moment(date).format('h A'),
          }}
          style={{ height: '100%' }}
          min={new Date(2023, 0, 1, 6, 0, 0)} // 6 AM
          max={new Date(2023, 0, 1, 23, 59, 59)} // 11:59 PM
          // Mobile optimizations
          step={60} // 1 hour steps
          timeslots={1} // 1 timeslot per step
          // Responsive toolbar
          toolbar={true}
        />
      </div>
      
      {isOver && (
        <div className="p-2 text-sm text-primary-600 text-center bg-primary-50 border-t border-primary-200">
          Drop here to add to itinerary
        </div>
      )}

      <ActivityEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        vaultItem={selectedVaultItem}
        itineraryItem={selectedItineraryItem}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
