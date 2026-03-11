"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import UploadArea from "@/components/UploadArea"
import UpscaleSelector from "@/components/UpscaleSelector"
import ComparisonSlider from "@/components/ComparisonSlider"
import type { UpscaleFactor } from "@/types"
import { UPSCALE_OPTIONS } from "@/types"
import { useApp } from "@/lib/context/AppContext"

// Configuration constants
const POLL_INTERVAL_MS = 1000
const MAX_POLL_ATTEMPTS = 120 // 2 minutes max

export default function EnhancePage() {
  const { credits, fetchCredits } = useApp()
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFactor, setSelectedFactor] = useState<UpscaleFactor>('4x')
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  // Track object URLs for cleanup - only cleanup on unmount
  const objectUrlsRef = useRef<Set<string>>(new Set())
  const isMountedRef = useRef(true)

  // Cleanup all object URLs only on unmount
  useEffect(() => {
    isMountedRef.current = true
    // Copy ref value to variable for cleanup function
    const urls = objectUrlsRef.current
    return () => {
      isMountedRef.current = false
      // Revoke all object URLs on unmount
      urls.forEach(url => {
        URL.revokeObjectURL(url)
      })
      urls.clear()
    }
  }, [])

  const getCost = (factor: UpscaleFactor) => {
    return UPSCALE_OPTIONS.find(opt => opt.factor === factor)?.cost || 1
  }

  const handleImageUpload = useCallback((file: File) => {
    // Create object URL and track it
    const preview = URL.createObjectURL(file)
    objectUrlsRef.current.add(preview)

    setUploadedImage(file)
    setImagePreview(preview)
    setProcessedImage(null)
    setProcessingStatus("")

    // Load image dimensions
    const img = new window.Image()
    img.onload = () => {
      if (isMountedRef.current) {
        setImageDimensions({ width: img.width, height: img.height })
      }
    }
    img.src = preview
  }, [])

  const handleProcess = async () => {
    if (!uploadedImage) return

    const cost = getCost(selectedFactor)

    // Re-check credits before processing
    if (credits < cost) {
      setProcessingStatus("Insufficient credits")
      return
    }

    setIsProcessing(true)
    setProcessingStatus("Uploading image...")

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', uploadedImage)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      const imageUrl = uploadData.url

      if (!isMountedRef.current) return
      setProcessingStatus("Creating upscale task...")

      const upscaleResponse = await fetch('/api/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          upscaleFactor: selectedFactor.replace('x', ''),
        }),
      })

      const upscaleData = await upscaleResponse.json()

      if (!upscaleResponse.ok) {
        // Credits were pre-deducted, refresh to show correct balance
        fetchCredits()
        throw new Error(upscaleData.error || 'Upscale task failed')
      }

      const taskId = upscaleData.taskId

      // Credits deducted by API, refresh display
      fetchCredits()

      if (!isMountedRef.current) return
      setProcessingStatus("Processing... (usually takes 1-2 minutes)")

      // Poll for status with error handling
      let attempts = 0

      while (attempts < MAX_POLL_ATTEMPTS && isMountedRef.current) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

        // Check if component is still mounted
        if (!isMountedRef.current) return

        try {
          const statusResponse = await fetch(`/api/upscale?taskId=${taskId}`)

          if (!statusResponse.ok) {
            // Non-200 response, log but continue polling
            console.warn('Status check failed:', statusResponse.status)
            attempts++
            continue
          }

          const statusData = await statusResponse.json()
          console.log('Poll response:', statusData)

          if (statusData.status === 'completed') {
            // Preload image before displaying
            setProcessingStatus("Loading result...")
            const img = new window.Image()
            img.onload = () => {
              if (isMountedRef.current) {
                setProcessedImage(statusData.result?.url)
                fetchCredits()
                setIsProcessing(false)
                setProcessingStatus("")
              }
            }
            img.onerror = () => {
              if (isMountedRef.current) {
                setProcessedImage(statusData.result?.url)
                fetchCredits()
                setIsProcessing(false)
                setProcessingStatus("")
              }
            }
            img.src = statusData.result?.url
            return
          }

          if (statusData.status === 'failed') {
            fetchCredits()
            throw new Error(statusData.refunded ? 'Processing failed - credits refunded' : 'Processing failed')
          }

          attempts++
        } catch (pollError) {
          // Network error during polling, log and retry
          console.warn('Poll error:', pollError)
          attempts++

          // If too many consecutive errors, fail
          if (attempts >= MAX_POLL_ATTEMPTS) {
            throw new Error('Failed to check processing status. Please refresh the page.')
          }
        }
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new Error('Processing timeout')
      }

    } catch (error) {
      console.error('Processing error:', error)
      if (isMountedRef.current) {
        setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsProcessing(false)
      }
    }
  }

  const handleDownload = () => {
    if (!processedImage) return
    const link = document.createElement('a')
    link.href = processedImage
    link.download = `upscaled-${selectedFactor}-${Date.now()}.png`
    link.click()
  }

  const handleReset = useCallback(() => {
    setProcessedImage(null)
    setImagePreview(null)
    setUploadedImage(null)
    setProcessingStatus("")
    setIsProcessing(false)
  }, [])

  const handleCancelUpload = useCallback(() => {
    setUploadedImage(null)
    setImagePreview(null)
  }, [])

  const getUpscaledDimensions = () => {
    const multiplier = parseInt(selectedFactor)
    return {
      width: imageDimensions.width * multiplier,
      height: imageDimensions.height * multiplier
    }
  }

  const currentCost = getCost(selectedFactor)

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Enhance Your Image</h1>
        <p className="text-muted-foreground">Upload an image and choose your upscale factor</p>
      </div>

      {!imagePreview ? (
        <UploadArea onImageUpload={handleImageUpload} />
      ) : !processedImage ? (
        <div className="space-y-8">
          {/* Uploaded Image Preview */}
          <div className="flex justify-center">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Uploaded image preview"
                width={400}
                height={400}
                className="max-w-md rounded-lg border border-border"
                unoptimized
              />
            ) : (
              <div className="w-64 h-64 rounded-lg border border-border bg-secondary/20 flex items-center justify-center">
                <p className="text-muted-foreground">No image</p>
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="max-w-2xl mx-auto space-y-6 p-6 rounded-xl bg-secondary/20 border border-border">
            <UpscaleSelector
              selectedFactor={selectedFactor}
              onSelect={setSelectedFactor}
            />

            {/* Cost Display */}
            <div className="text-center text-sm text-muted-foreground">
              Cost: <span className="font-semibold text-primary">{currentCost} Credit{currentCost > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleProcess}
              disabled={isProcessing || credits < currentCost}
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>✨</span>
              {isProcessing ? processingStatus : credits < currentCost ? `Insufficient Credits${credits === 0 ? ' (Please sign in)' : ''}` : "Enhance Image"}
            </button>
            {!isProcessing && (
              <button
                onClick={handleCancelUpload}
                className="px-6 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <ComparisonSlider
          beforeImage={imagePreview || ""}
          afterImage={processedImage}
          originalWidth={imageDimensions.width}
          originalHeight={imageDimensions.height}
          upscaledWidth={getUpscaledDimensions().width}
          upscaledHeight={getUpscaledDimensions().height}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )}
    </main>
  )
}
