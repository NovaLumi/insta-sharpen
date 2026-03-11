"use client"

import { useState, useCallback } from "react"
import { Upload, Image as ImageIcon } from "lucide-react"
import { motion } from "framer-motion"

interface UploadAreaProps {
  onImageUpload: (file: File) => void
}

// Validation constants
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/jpg']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default function UploadArea({ onImageUpload }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)

  const validateAndUpload = useCallback((file: File) => {
    if (!VALID_TYPES.includes(file.type)) {
      alert('Please upload a JPG or PNG image.')
      return
    }

    if (file.size > MAX_SIZE) {
      alert('File size must be less than 10MB.')
      return
    }

    onImageUpload(file)
  }, [onImageUpload])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      validateAndUpload(file)
    }
  }, [validateAndUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      validateAndUpload(file)
    }
  }, [validateAndUpload])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300
          ${isDragging
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          }
        `}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="flex justify-center"
          >
            {isDragging ? (
              <Upload className="w-16 h-16 text-primary" />
            ) : (
              <ImageIcon className="w-16 h-16 text-muted-foreground" />
            )}
          </motion.div>

          <div className="space-y-2">
            <p className="text-xl font-semibold">
              {isDragging ? 'Drop your image here' : 'Upload your image'}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG • Max 10MB
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
