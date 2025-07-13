'use client'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { VaultItem, ItineraryItem, Trip } from '@/lib/db'
import UploadButton from '@/components/UploadButton'
import VaultList from '@/components/VaultList'
import CalendarBoard from '@/components/CalendarBoard'
import Header from '@/components/Header'
import { useState, useEffect } from 'react'
import { getVaultItems, getItineraryItems, getTrip } from './actions'

interface TripClientProps {
  tripId: string
}

export default function TripClient({ tripId }: TripClientProps) {
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([])
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([])
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setError(null)
      const [tripData, vault, itinerary] = await Promise.all([
        getTrip(tripId),
        getVaultItems(tripId),
        getItineraryItems(tripId)
      ])
      
      if (!tripData) {
        setError('Trip not found')
        return
      }
      
      setTrip(tripData as Trip)
      setVaultItems(vault)
      setItineraryItems(itinerary)
    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to load trip data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tripId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your travel workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
            <p className="text-gray-600 mb-4">The trip you're looking for doesn't exist or has been deleted.</p>
            <a
              href="/create"
              className="bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 transition-colors"
            >
              Create New Trip
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <Header 
          tripId={tripId} 
          tripName={trip?.name} 
          tripStartDate={trip?.start_date}
          tripEndDate={trip?.end_date}
        />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left Panel - Vault (Mobile: Full width, Desktop: 1/3) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
                <UploadButton 
                  tripId={tripId} 
                  onUploadComplete={loadData}
                />
                <VaultList items={vaultItems} />
              </div>
            </div>

            {/* Right Panel - Calendar (Mobile: Full width, Desktop: 2/3) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
                <CalendarBoard 
                  tripId={tripId}
                  itineraryItems={itineraryItems}
                  onUpdate={loadData}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Instructions */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-primary-500 text-white p-3 rounded-lg text-sm text-center">
          💡 Drag activities from the vault to the calendar to add them to your itinerary
        </div>
      </div>
    </DndProvider>
  )
}
