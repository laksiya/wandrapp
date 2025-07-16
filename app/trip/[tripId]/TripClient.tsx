'use client'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { VaultItem, ItineraryItem, Trip } from '@/lib/db'
import UploadButton from '@/components/UploadButton'
import VaultList from '@/components/VaultList'
import CalendarBoard from '@/components/CalendarBoard'
import Header from '@/components/Header'
import { useState, useEffect, useRef } from 'react'
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
  const [showVault, setShowVault] = useState(false)
  const [showTip, setShowTip] = useState(true)
  const tipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  useEffect(() => {
    if (showTip) {
      tipTimeoutRef.current = setTimeout(() => setShowTip(false), 5000)
    }
    return () => {
      if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current)
    }
  }, [showTip])

  // Hide tip on any user interaction
  useEffect(() => {
    if (!showTip) return
    const hideTip = () => setShowTip(false)
    window.addEventListener('touchstart', hideTip, { once: true })
    window.addEventListener('mousedown', hideTip, { once: true })
    return () => {
      window.removeEventListener('touchstart', hideTip)
      window.removeEventListener('mousedown', hideTip)
    }
  }, [showTip])

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

        {/* Desktop Layout - Canva-inspired */}
        <div className="hidden lg:flex h-[calc(100vh-64px)]">
          {/* Left Sidebar - Elements Panel (Compact) */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Upload Section */}
            <div className="p-4 border-b border-gray-200">
              <UploadButton 
                tripId={tripId} 
                onUploadComplete={loadData}
              />
            </div>
            
            {/* Vault List */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <VaultList items={vaultItems} onUpdate={loadData} />
              </div>
            </div>
          </div>

          {/* Main Canvas Area - Calendar Focus */}
          <div className="flex-1 bg-gray-50 p-6">
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200">
              <CalendarBoard 
                tripId={tripId}
                itineraryItems={itineraryItems}
                tripStartDate={trip?.start_date}
                tripEndDate={trip?.end_date}
                onUpdate={loadData}
              />
            </div>
          </div>
        </div>

        {/* Mobile Layout - Calendar Focused */}
        <div className="lg:hidden">
          {/* Mobile Calendar - Full Width */}
          <div className="h-[calc(100vh-64px)] bg-white">
            <CalendarBoard 
              tripId={tripId}
              itineraryItems={itineraryItems}
              tripStartDate={trip?.start_date}
              tripEndDate={trip?.end_date}
              onUpdate={loadData}
            />
          </div>

          {/* Mobile Vault - Slide-up Panel */}
          {showVault && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Activity Vault</h3>
                  <button
                    onClick={() => setShowVault(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                  <div className="p-4">
                    <UploadButton 
                      tripId={tripId} 
                      onUploadComplete={loadData}
                    />
                    <VaultList items={vaultItems} onUpdate={loadData} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Floating Action Button */}
          <div className="fixed bottom-6 right-6 z-30 lg:hidden">
            <button
              onClick={() => setShowVault(true)}
              className="bg-primary-500 text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Mobile Instructions */}
          {showTip && (
            <div className="fixed bottom-20 left-4 right-4 bg-primary-500 text-white p-3 rounded-lg text-sm text-center z-20 lg:hidden transition-opacity duration-500">
              💡 Tap the + button to add activities to your vault
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  )
}
