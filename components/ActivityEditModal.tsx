'use client'

import { useState, useEffect } from 'react'
import { VaultItem, ItineraryItem } from '@/lib/db'
import { ActivityType, validateActivityType } from '@/lib/activityTypes'
import { getImageFromGCS } from '@/app/trip/[tripId]/actions'
import Image from 'next/image'

interface ActivityEditModalProps {
  isOpen: boolean
  onClose: () => void
  vaultItem: VaultItem | null
  itineraryItem?: ItineraryItem | null
  onSave: (data: { name: string; description: string; activityType: ActivityType; startTime?: string; endTime?: string }, saveToAll: boolean) => Promise<void>
  onDelete?: (type: 'vault' | 'itinerary') => Promise<void>
}

export default function ActivityEditModal({ 
  isOpen, 
  onClose, 
  vaultItem, 
  itineraryItem, 
  onSave,
  onDelete
}: ActivityEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activityType: 'Other' as ActivityType,
    startTime: '',
    endTime: ''
  })
  const [originalData, setOriginalData] = useState({
    name: '',
    description: '',
    activityType: 'Other' as ActivityType,
    startTime: '',
    endTime: ''
  })
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && vaultItem) {
      const initialData = {
        name: vaultItem.name,
        description: vaultItem.description || '',
        activityType: validateActivityType(vaultItem.activity_type || 'Other'),
        startTime: itineraryItem ? new Date(itineraryItem.start_time).toISOString().slice(0, 16) : '',
        endTime: itineraryItem ? new Date(itineraryItem.end_time).toISOString().slice(0, 16) : ''
      }
      setFormData(initialData)
      setOriginalData(initialData)
    }
  }, [isOpen, vaultItem, itineraryItem])

  // Load image when modal opens
  useEffect(() => {
    const loadImage = async () => {
      if (!isOpen || !vaultItem?.image_url) {
        setImageSrc(null)
        setImageError(false)
        return
      }
      
      setIsLoading(true)
      setImageError(false)
      try {
        if (vaultItem.image_url.includes('storage.googleapis.com')) {
          const gcsImage = await getImageFromGCS(vaultItem.image_url)
          if (gcsImage) {
            setImageSrc(gcsImage)
          } else {
            setImageError(true)
          }
        } else {
          setImageSrc(vaultItem.image_url)
        }
      } catch (error) {
        console.error('Failed to load image:', error)
        setImageError(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadImage()
  }, [isOpen, vaultItem?.image_url])

  // Check if there are changes
  const hasChanges = 
    formData.name !== originalData.name ||
    formData.description !== originalData.description ||
    formData.activityType !== originalData.activityType ||
    formData.startTime !== originalData.startTime ||
    formData.endTime !== originalData.endTime

  const handleSave = async (saveToAll: boolean) => {
    if (!formData.name.trim()) {
      alert('Please enter an activity name')
      return
    }

    // Validate time fields if editing an itinerary item
    if (itineraryItem) {
      if (!formData.startTime || !formData.endTime) {
        alert('Please set both start and end times')
        return
      }
      
      const startTime = new Date(formData.startTime)
      const endTime = new Date(formData.endTime)
      
      if (startTime >= endTime) {
        alert('End time must be after start time')
        return
      }
    }

    // Don't save if no changes
    if (!hasChanges) {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      await onSave(formData, saveToAll)
      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (type: 'vault' | 'itinerary') => {
    if (!onDelete) return

    const confirmMessage = type === 'vault' 
      ? 'Are you sure you want to delete this activity from the vault? This will also remove it from all itinerary items.'
      : 'Are you sure you want to delete this activity from the itinerary?'

    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      await onDelete(type)
      onClose()
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  // Function to get placeholder icon based on activity type
  const getPlaceholderIcon = (activityType: string) => {
    const icons: Record<string, string> = {
      'Sightseeing': '🏛️',
      'Culture': '🎭',
      'Adventure': '🏔️',
      'Wellness': '🧘',
      'Entertainment': '🎪',
      'Shopping': '🛍️',
      'Events': '🎉',
      'Transportation': '🚗',
      'Accommodations': '🏨',
      'Food & Drink': '🍽️',
      'Other': '📍'
    }
    return icons[activityType] || '📍'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Activity</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form className="space-y-6">
            {/* Image Section */}
            <div className="flex justify-center">
              {vaultItem?.image_url ? (
                <>
                  {isLoading ? (
                    <div className="w-48 h-32 bg-gray-200 rounded-lg animate-pulse" />
                  ) : imageSrc && !imageError ? (
                    <Image
                      src={imageSrc}
                      alt={vaultItem.name}
                      width={192}
                      height={128}
                      className="rounded-lg object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-4xl">📸</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">
                    {getPlaceholderIcon(formData.activityType)}
                  </span>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter activity name"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter activity description"
                />
              </div>

              <div>
                <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Type
                </label>
                <select
                  id="activityType"
                  value={formData.activityType}
                  onChange={(e) => setFormData({ ...formData, activityType: e.target.value as ActivityType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Sightseeing">Sightseeing</option>
                  <option value="Culture">Culture</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Wellness">Wellness</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Events">Events</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Accommodations">Accommodations</option>
                  <option value="Food & Drink">Food & Drink</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Time fields - only show when editing an itinerary item */}
              {itineraryItem && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Event Time</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="startTime" className="block text-xs font-medium text-gray-600 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="datetime-local"
                        id="startTime"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-xs font-medium text-gray-600 mb-1">
                        End Time *
                      </label>
                      <input
                        type="datetime-local"
                        id="endTime"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            {onDelete && (
              <>
                {itineraryItem ? (
                  <button
                    onClick={() => handleDelete('itinerary')}
                    disabled={isDeleting || isSaving}
                    className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete from Itinerary'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete('vault')}
                    disabled={isDeleting || isSaving}
                    className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete from Vault'}
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving || isDeleting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 underline"
            >
              Save This Instance
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving || isDeleting || !hasChanges}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : hasChanges ? 'Save to All' : 'No Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 