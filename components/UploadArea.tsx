"use client"

import { useState, useCallback } from "react"
import { Upload, Image as ImageIcon } from "lucide-react"
import { motion } from "framer-motion"

interface UploadAreaProps {
  onImageUpload: (file: File) => void
}

const VALID_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
const MAX_SIZE = 10 * 1024 * 1024

export default function UploadArea({ onImageUpload }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)

  const validateAndUpload = useCallback((file: File) => {
    if (!VALID_TYPES.includes(file.type)) {
      alert("Please upload a JPG, PNG, or WebP image.")
      return
    }

    if (file.size > MAX_SIZE) {
      alert("File size must be less than 10MB.")
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
      validateAndUpload(e.dataTransfer.files[0])
    }
  }, [validateAndUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0])
    }
  }, [validateAndUpload])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-2xl"
    >
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative rounded-[28px] border-2 border-dashed p-12 text-center transition-all duration-300
          ${isDragging
            ? "scale-[1.02] border-primary bg-primary/10"
            : "border-border bg-white/[0.02] hover:border-primary/50 hover:bg-white/[0.04]"
          }
        `}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleFileInput}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

        <div className="space-y-4">
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="flex justify-center">
            {isDragging ? (
              <Upload className="h-16 w-16 text-primary" />
            ) : (
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
            )}
          </motion.div>

          <div className="space-y-2">
            <p className="text-xl font-semibold">
              {isDragging ? "Drop your image here" : "Upload your image"}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag and drop or click to browse your files
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WebP • Max 10MB
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
