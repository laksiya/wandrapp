'use client'

import { useDrag } from 'react-dnd'
import { VaultItem } from '@/lib/db'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { getImageFromGCS } from '@/app/trip/[tripId]/actions'
import { getActivityTypeColor, getActivityTypeBorderColor, validateActivityType, getActivityTypeHexColor } from '@/lib/activityTypes'
import ActivityEditModal from './ActivityEditModal'

interface VaultListProps {
  items: VaultItem[]
  onUpdate?: () => void
}

interface VaultItemCardProps {
  item: VaultItem
  onEdit: (item: VaultItem) => void
}

function VaultItemCard({ item, onEdit }: VaultItemCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'vaultItem',
    item: { id: item.id, name: item.name, vaultItem: item },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      if (!item.image_url) return
      
      setIsLoading(true)
      setImageError(false)
      try {
        // If it's a GCS URL, use getImageFromGCS
        if (item.image_url.includes('storage.googleapis.com')) {
          const gcsImage = await getImageFromGCS(item.image_url)
          if (gcsImage) {
            setImageSrc(gcsImage)
          } else {
            // If GCS download fails, don't set imageSrc to avoid broken image
            setImageError(true)
          }
        } else {
          // For local images, use the URL directly
          setImageSrc(item.image_url)
        }
      } catch (error) {
        console.error('Failed to load image:', error)
        // Don't set imageSrc to avoid broken image
        setImageError(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadImage()
  }, [item.image_url])

  const borderHex = getActivityTypeHexColor(validateActivityType(item.activity_type || 'Other'));

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

  const handleClick = (e: React.MouseEvent) => {
    // Prevent opening modal when dragging
    if (isDragging) return
    onEdit(item)
  }

  return (
    <div
      ref={drag as any}
      className={`vault-item bg-white rounded-lg shadow-sm border-2 p-3 mb-2 transition-all duration-200 cursor-pointer hover:shadow-md ${isDragging ? 'dragging opacity-50 scale-95' : ''}`}
      style={{ borderColor: borderHex }}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {item.image_url ? (
            // Show actual image if available
            <>
              {isLoading ? (
                <div className="w-12 h-12 bg-gray-200 rounded-md animate-pulse" />
              ) : imageSrc && !imageError ? (
                <Image
                  src={imageSrc}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="rounded-md object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                  <span className="text-gray-400 text-lg">📸</span>
                </div>
              )}
            </>
          ) : (
            // Show placeholder when no image is provided
            <div 
              className="w-12 h-12 rounded-md flex items-center justify-center text-lg"
              style={{ backgroundColor: `${borderHex}20` }}
            >
              {getPlaceholderIcon(item.activity_type || 'Other')}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {item.name}
          </h4>
          {item.activity_type && (
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getActivityTypeColor(item.activity_type as any)}`}>
              {item.activity_type}
            </span>
          )}
          {item.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-tight">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VaultList({ items, onUpdate }: VaultListProps) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null)

  const handleEdit = (item: VaultItem) => {
    setSelectedItem(item)
    setEditModalOpen(true)
  }

  const handleSave = async (data: { name: string; description: string; activityType: any }, saveToAll: boolean) => {
    if (!selectedItem) return

    try {
      if (saveToAll) {
        // Update the original vault item
        const response = await fetch(`/api/trip/${selectedItem.trip_id}/vault/${selectedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) throw new Error('Failed to update vault item')
      } else {
        // Create a copy and update the current instance
        const response = await fetch(`/api/trip/${selectedItem.trip_id}/vault/copy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalItemId: selectedItem.id,
            ...data
          })
        })
        
        if (!response.ok) throw new Error('Failed to create vault item copy')
      }
      
      onUpdate?.()
    } catch (error) {
      console.error('Failed to save:', error)
      throw error
    }
  }

  const handleDelete = async (type: 'vault' | 'itinerary') => {
    if (!selectedItem) return

    try {
      if (type === 'vault') {
        // Delete the vault item
        const response = await fetch(`/api/trip/${selectedItem.trip_id}/vault/${selectedItem.id}`, {
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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 lg:block hidden">
          Activity Vault
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {items.length}
        </span>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">🏖️</div>
          <p className="text-sm">No activities yet</p>
          <p className="text-xs">Upload screenshots to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <VaultItemCard key={item.id} item={item} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <ActivityEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        vaultItem={selectedItem}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
