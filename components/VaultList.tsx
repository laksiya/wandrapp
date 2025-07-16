'use client'

import { useDrag } from 'react-dnd'
import { VaultItem } from '@/lib/db'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { getImageFromGCS } from '@/app/trip/[tripId]/actions'
import { getActivityTypeColor, getActivityTypeBorderColor, validateActivityType, getActivityTypeHexColor } from '@/lib/activityTypes'
import ActivityEditModal from './ActivityEditModal'

interface VaultListProps {
  items: VaultItem[]
  onUpdate?: () => void
  onMobileDragStart?: (item: VaultItem) => void
  onMobileDragEnd?: () => void
}

interface VaultItemCardProps {
  item: VaultItem
  onEdit: (item: VaultItem) => void
  onMobileDragStart?: (item: VaultItem) => void
  onMobileDragEnd?: () => void
}

function VaultItemCard({ item, onEdit, onMobileDragStart, onMobileDragEnd }: VaultItemCardProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const touchStartTime = useRef<number>(0)
  const hasMoved = useRef<boolean>(false)
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'vaultItem',
    item: { id: item.id, name: item.name, vaultItem: item },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !isMobile || isLongPressing, // Only allow drag on mobile if long pressing
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

  // Touch event handlers for long press
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return
    
    touchStartTime.current = Date.now()
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    hasMoved.current = false
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true)
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      // Trigger mobile drag start
      onMobileDragStart?.(item)
    }, 500) // 500ms for long press
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !longPressTimer.current) return
    
    const touchX = e.touches[0].clientX
    const touchY = e.touches[0].clientY
    const deltaX = Math.abs(touchX - touchStartX.current)
    const deltaY = Math.abs(touchY - touchStartY.current)
    
    // If moved more than 10px, cancel long press
    if (deltaX > 10 || deltaY > 10) {
      hasMoved.current = true
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return
    
    const touchDuration = Date.now() - touchStartTime.current
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    // If it was a short tap and didn't move, handle as click
    if (touchDuration < 500 && !hasMoved.current && !isLongPressing) {
      onEdit(item)
    }
    
    // Reset long pressing state after a delay
    setTimeout(() => {
      setIsLongPressing(false)
      onMobileDragEnd?.()
    }, 100)
  }

  const handleClick = (e: React.MouseEvent) => {
    // Only handle clicks on desktop or if not long pressing on mobile
    if (isDragging || (isMobile && isLongPressing)) return
    onEdit(item)
  }

  return (
    <div
      ref={drag as any}
      className={`vault-item bg-white rounded-lg shadow-sm border-2 p-3 mb-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
        isDragging ? 'dragging opacity-50 scale-95' : ''
      } ${
        isLongPressing ? 'scale-105 shadow-lg ring-2 ring-blue-300 animate-pulse' : ''
      }`}
      style={{ 
        borderColor: borderHex,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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

export default function VaultList({ items, onUpdate, onMobileDragStart, onMobileDragEnd }: VaultListProps) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileDragItem, setMobileDragItem] = useState<VaultItem | null>(null)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMobileDragStart = (item: VaultItem) => {
    setMobileDragItem(item)
    onMobileDragStart?.(item)
  }

  const handleMobileDragEnd = () => {
    setMobileDragItem(null)
    onMobileDragEnd?.()
  }

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
        <div className="flex items-center gap-2">
          {isMobile && items.length > 0 && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              📱 Long press to drag
            </span>
          )}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {items.length}
          </span>
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">🏖️</div>
          <p className="text-sm">No activities yet</p>
          <p className="text-xs">Upload screenshots to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mobileDragItem ? (
            // Show collapsed state with ghost item
            <div className="relative">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center animate-pulse">
                <div className="text-2xl mb-2">👻</div>
                <p className="text-sm font-medium text-blue-800">
                  {mobileDragItem.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Drag to calendar to add activity
                </p>
              </div>
            </div>
          ) : (
            // Show normal vault items
            items.map((item) => (
              <VaultItemCard 
                key={item.id} 
                item={item} 
                onEdit={handleEdit}
                onMobileDragStart={handleMobileDragStart}
                onMobileDragEnd={handleMobileDragEnd}
              />
            ))
          )}
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
