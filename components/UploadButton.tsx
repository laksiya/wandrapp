'use client'

import { useState, useTransition, useEffect } from 'react'
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
  const [isMobile, setIsMobile] = useState(false)
  
  // Form state for manual event creation
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activityType: 'Other' as ActivityType,
    imageFile: null as File | null,
    startTime: '',
    endTime: ''
  })

  // Function to resize image using canvas
  const resizeImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
        
        // Set canvas dimensions
        canvas.width = width
        canvas.height = height
        
        // Draw resized image
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with resized image
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(resizedFile)
            } else {
              reject(new Error('Failed to resize image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

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

    // Check file size and resize if needed
    const maxSize = 10 * 1024 * 1024 // 10MB
    let processedFile = file
    
    if (file.size > maxSize) {
      try {
        // Show processing message
        setErrorMessage('📏 Resizing large image for better performance...')
        
        // Resize image to reasonable dimensions (smaller for mobile)
        const maxWidth = isMobile ? 1200 : 1920
        const maxHeight = isMobile ? 800 : 1080
        const quality = isMobile ? 0.7 : 0.8
        processedFile = await resizeImage(file, maxWidth, maxHeight, quality)
        
        // Show success message briefly
        setErrorMessage('✅ Image resized successfully!')
        setTimeout(() => setErrorMessage(null), 2000)
      } catch (error) {
        setErrorMessage('Failed to resize image. Please try with a smaller image.')
        return
      }
    }

    const formData = new FormData()
    formData.append('file', processedFile)
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

    // Validate time fields if provided
    if (formData.startTime && formData.endTime) {
      const startTime = new Date(formData.startTime)
      const endTime = new Date(formData.endTime)
      
      if (startTime >= endTime) {
        alert('End time must be after start time')
        return
      }
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
          // If no image, create vault item with or without time
          if (formData.startTime && formData.endTime) {
            const response = await fetch(`/api/trip/${tripId}/vault/with-time`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: formData.name,
                description: formData.description,
                activityType: formData.activityType,
                startTime: formData.startTime,
                endTime: formData.endTime
              })
            })
            
            if (!response.ok) throw new Error('Failed to create event with time')
          } else {
            await createVaultItem(tripId, formData.name, formData.description, formData.activityType)
          }
        }
        
        onUploadComplete?.()
        setMode('select')
        setFormData({ name: '', description: '', activityType: 'Other', imageFile: null, startTime: '', endTime: '' })
      } catch (error) {
        console.error('Failed to create event:', error)
        alert('Failed to create event. Please try again.')
      }
    })
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Check file size and resize if needed
      const maxSize = 10 * 1024 * 1024 // 10MB
      let processedFile = file
      
      if (file.size > maxSize) {
        try {
          // Show processing message
          setErrorMessage('📏 Resizing large image for better performance...')
          
          // Resize image to reasonable dimensions (smaller for mobile)
          const maxWidth = isMobile ? 1200 : 1920
          const maxHeight = isMobile ? 800 : 1080
          const quality = isMobile ? 0.7 : 0.8
          processedFile = await resizeImage(file, maxWidth, maxHeight, quality)
          
          // Show success message briefly
          setErrorMessage('✅ Image resized successfully!')
          setTimeout(() => setErrorMessage(null), 2000)
        } catch (error) {
          setErrorMessage('Failed to resize image. Please try with a smaller image.')
          return
        }
      }

      setFormData({ ...formData, imageFile: processedFile })
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

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const resetToSelect = () => {
    setMode('select')
    setFormData({ name: '', description: '', activityType: 'Other', imageFile: null, startTime: '', endTime: '' })
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
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={isPending}
            style={{ 
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none'
            }}
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
                {isMobile ? 'Tap to take a photo or choose from your gallery' : 'Drop an image here or click to browse'}
              </p>
              <p className="text-xs text-green-600 mb-3">
                ✨ Large images will be automatically resized for better performance
              </p>
              {isMobile && (
                <p className="text-xs text-blue-600 mb-3">
                  💡 Tip: If nothing happens, try tapping the button again or check your browser permissions
                </p>
              )}
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer transition-colors text-sm ${
                  isPending ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ 
                  minHeight: '44px', // iOS minimum touch target
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {isPending ? 'Processing...' : '📸 Take Photo or Choose File'}
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
                  capture="environment"
                  onChange={handleImageFileChange}
                  className="hidden"
                  style={{ 
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none'
                  }}
                />
                <label
                  htmlFor="event-image"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-center text-xs"
                  style={{ 
                    minHeight: '44px', // iOS minimum touch target
                    WebkitTapHighlightColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {formData.imageFile ? formData.imageFile.name.substring(0, 15) + '...' : '📸 Choose image'}
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

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Event Time (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="start-time" className="block text-xs text-gray-600 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    id="start-time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="end-time" className="block text-xs text-gray-600 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    id="end-time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Leave empty to add to vault only, or set both times to add to calendar
              </p>
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
