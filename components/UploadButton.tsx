'use client'

import { useState, useTransition } from 'react'
import { uploadScreenshot } from '@/app/trip/[tripId]/actions'

interface UploadButtonProps {
  tripId: string
  onUploadComplete?: () => void
}

export default function UploadButton({ tripId, onUploadComplete }: UploadButtonProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('tripId', tripId)

    startTransition(async () => {
      try {
        await uploadScreenshot(formData)
        onUploadComplete?.()
      } catch (error) {
        console.error('Upload failed:', error)
        alert('Upload failed. Please try again.')
      }
    })
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

  return (
    <div className="mb-6">
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
        
        <div className="space-y-4">
          <div className="text-4xl">📸</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Upload Travel Screenshot
            </h3>
            <p className="text-gray-500 mb-4">
              Drop an image here or click to browse
            </p>
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 cursor-pointer transition-colors ${
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
