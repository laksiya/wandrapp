'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTrip } from '@/app/trip/[tripId]/actions'

export default function CreateTripPage() {
  const [tripName, setTripName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tripName.trim()) {
      alert('Please enter a trip name')
      return
    }

    // Validate dates if provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert('End date must be after start date')
      return
    }

    startTransition(async () => {
      try {
        const result = await createTrip(tripName.trim(), startDate || undefined, endDate || undefined)
        if (result.success) {
          router.push(`/trip/${result.trip.id}`)
        }
      } catch (error) {
        console.error('Failed to create trip:', error)
        alert('Failed to create trip. Please try again.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🌍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create New Trip
            </h1>
            <p className="text-gray-600">
              Start planning your next adventure
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-2">
                Trip Name
              </label>
              <input
                type="text"
                id="tripName"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g., Summer Europe Trip, Tokyo Adventure..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={isPending}
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isPending}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isPending}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || !tripName.trim()}
              className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Creating Trip...' : 'Create Trip'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <a
                href="/trip/seed-id"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Or try the demo trip →
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Your trip will get a unique shareable URL that you can send to travel companions
          </p>
        </div>
      </div>
    </div>
  )
}
