'use client'

import { useDrag } from 'react-dnd'
import { VaultItem } from '@/lib/db'
import Image from 'next/image'

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

  return (
    <div
      ref={drag as any}
      className={`vault-item bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 ${
        isDragging ? 'dragging' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {item.image_url && (
          <div className="flex-shrink-0">
            <Image
              src={item.image_url}
              alt={item.name}
              width={60}
              height={60}
              className="rounded-md object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {item.name}
          </h4>
          {item.activity_type && (
            <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full mt-1">
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
