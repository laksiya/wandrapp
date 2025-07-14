'use client'

import { useDrag } from 'react-dnd'
import { VaultItem } from '@/lib/db'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { getImageFromGCS } from '@/app/trip/[tripId]/actions'
import { getActivityTypeColor, getActivityTypeBorderColor, validateActivityType, getActivityTypeHexColor } from '@/lib/activityTypes'

interface VaultListProps {
  items: VaultItem[]
}

interface VaultItemCardProps {
  item: VaultItem
}

function VaultItemCard({ item }: VaultItemCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'vaultItem',
    item: { id: item.id, name: item.name, vaultItem: item },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      if (!item.image_url) return
      
      setIsLoading(true)
      try {
        // If it's a GCS URL, use getImageFromGCS
        if (item.image_url.includes('storage.googleapis.com')) {
          const gcsImage = await getImageFromGCS(item.image_url)
          if (gcsImage) {
            setImageSrc(gcsImage)
          } else {
            // Fallback to original URL if GCS download fails
            setImageSrc(item.image_url)
          }
        } else {
          // For local images, use the URL directly
          setImageSrc(item.image_url)
        }
      } catch (error) {
        console.error('Failed to load image:', error)
        // Fallback to original URL
        setImageSrc(item.image_url)
      } finally {
        setIsLoading(false)
      }
    }

    loadImage()
  }, [item.image_url])

  const borderHex = getActivityTypeHexColor(validateActivityType(item.activity_type || 'Other'));

  return (
    <div
      ref={drag as any}
      className={`vault-item bg-white rounded-lg shadow-sm border-2 p-4 mb-3 transition-colors duration-200 ${isDragging ? 'dragging' : ''}`}
      style={{ borderColor: borderHex }}
    >
      <div className="flex items-start space-x-3">
        {item.image_url && (
          <div className="flex-shrink-0">
            {isLoading ? (
              <div className="w-[60px] h-[60px] bg-gray-200 rounded-md animate-pulse" />
            ) : imageSrc ? (
              <Image
                src={imageSrc}
                alt={item.name}
                width={60}
                height={60}
                className="rounded-md object-cover"
              />
            ) : (
              <div className="w-[60px] h-[60px] bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-400 text-xs">Error</span>
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {item.name}
          </h4>
          {item.activity_type && (
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getActivityTypeColor(item.activity_type as any)}`}>
              {item.activity_type}
            </span>
          )}
          {item.description && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VaultList({ items }: VaultListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Activity Vault ({items.length})
      </h3>
      
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🏖️</div>
          <p>No activities yet</p>
          <p className="text-sm">Upload screenshots to get started</p>
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <VaultItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
