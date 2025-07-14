'use client'

import { useState, useTransition } from 'react'
import { uploadScreenshot, createVaultItem } from '@/app/trip/[tripId]/actions'
import { VALID_ACTIVITY_TYPES, ActivityType } from '@/lib/activityTypes'

interface UploadButtonProps {
  tripId: string
  onUploadComplete?: () => void
}

type UploadMode = 'select' | 'screenshot' | 'manual'

export default function UploadButton({ tripId, onUploadComplete }: UploadButtonProps) {
  const [mode, setMode] = useState<UploadMode>('select')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Form state for manual event creation
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activityType: 'Other' as ActivityType,
    imageFile: null as File | null
  })

  const handleFileUpload = async (file: File) => {
    // Detect HEIC/HEIF files (iPhone screenshots)
    if (
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')
    ) {
      setErrorMessage(
        'iPhone screenshots are saved as HEIC files, which are not supported by most browsers and AI APIs.\n\nPlease convert your screenshot to JPEG or PNG before uploading. You can use an online converter like https://heic2jpg.com or "Save as JPEG" from the Photos app.'
      )
      return
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('tripId', tripId)

    startTransition(async () => {
      try {
        await uploadScreenshot(formData)
        onUploadComplete?.()
        setMode('select')
      } catch (error) {
        console.error('Upload failed:', error)
        setErrorMessage('Upload failed. Please try again. ' + ((error as any)?.message || ''))
      }
    })
  }

  const handleManualEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter an event name')
      return
    }

    startTransition(async () => {
      try {
        if (formData.imageFile) {
          // If image is provided, use the existing uploadScreenshot function
          const uploadFormData = new FormData()
          uploadFormData.append('file', formData.imageFile)
          uploadFormData.append('tripId', tripId)
          uploadFormData.append('manualData', JSON.stringify({
            name: formData.name,
            description: formData.description,
            activityType: formData.activityType
          }))
          
          await uploadScreenshot(uploadFormData)
        } else {
          // If no image, create vault item without image
          await createVaultItem(tripId, formData.name, formData.description, formData.activityType)
        }
        
        onUploadComplete?.()
        setMode('select')
        setFormData({ name: '', description: '', activityType: 'Other', imageFile: null })
      } catch (error) {
        console.error('Failed to create event:', error)
        alert('Failed to create event. Please try again.')
      }
    })
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      setFormData({ ...formData, imageFile: file })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const resetToSelect = () => {
    setMode('select')
    setFormData({ name: '', description: '', activityType: 'Other', imageFile: null })
  }

  if (mode === 'select') {
    return (
      <div className="mb-4">
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
          <div className="text-2xl mb-2">➕</div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Add Activity
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setMode('screenshot')}
              className="w-full bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              📸 Upload Screenshot
            </button>
            <button
              onClick={() => setMode('manual')}
              className="w-full bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors text-sm"
            >
              ✏️ Create Event
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'screenshot') {
    return (
      <div className="mb-4">
        {/* Error prompt */}
        {errorMessage && (
          <div className="mb-2 px-3 py-2 bg-red-100 border border-red-300 text-red-700 rounded flex items-center justify-between text-xs">
            <span className="whitespace-pre-line">{errorMessage}</span>
            <button
              className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg leading-none"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}
        <div
          className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={isPending}
          />
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-2xl">📸</div>
              <button
                onClick={resetToSelect}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back
              </button>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Upload Screenshot
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Drop an image here or click to browse
              </p>
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer transition-colors text-sm ${
                  isPending ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isPending ? 'Processing...' : 'Choose File'}
              </label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'manual') {
    return (
      <div className="mb-4">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Create Event</h3>
            <button
              onClick={resetToSelect}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back
            </button>
          </div>
          
          <form onSubmit={handleManualEventSubmit} className="space-y-3">
            <div>
              <label htmlFor="event-name" className="block text-xs font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                id="event-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter event name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="event-description" className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="event-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter event description (optional)"
                rows={2}
              />
            </div>
            
            <div>
              <label htmlFor="activity-type" className="block text-xs font-medium text-gray-700 mb-1">
                Activity Type
              </label>
              <select
                id="activity-type"
                value={formData.activityType}
                onChange={(e) => setFormData({ ...formData, activityType: e.target.value as ActivityType })}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {VALID_ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="event-image" className="block text-xs font-medium text-gray-700 mb-1">
                Thumbnail (Optional)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="event-image"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="event-image"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-center text-xs"
                >
                  {formData.imageFile ? formData.imageFile.name.substring(0, 15) + '...' : 'Choose image'}
                </label>
                {formData.imageFile && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageFile: null })}
                    className="px-2 py-1 text-red-600 hover:text-red-800 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isPending || !formData.name.trim()}
              className={`w-full px-3 py-2 text-white rounded-md transition-colors text-sm ${
                isPending || !formData.name.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isPending ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return null
}
