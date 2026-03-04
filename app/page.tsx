"use client"

import { useState } from "react"
import Header from "@/components/Header"
import Hero from "@/components/Hero"
import UploadArea from "@/components/UploadArea"
import UpscaleSelector from "@/components/UpscaleSelector"
import ComparisonSlider from "@/components/ComparisonSlider"
import PricingModal from "@/components/PricingModal"
import type { UpscaleFactor } from "@/types"
import { UPSCALE_OPTIONS } from "@/types"

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFactor, setSelectedFactor] = useState<UpscaleFactor>('4x')
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [credits, setCredits] = useState(3)
  const [showPricing, setShowPricing] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  const getCost = (factor: UpscaleFactor) => {
    return UPSCALE_OPTIONS.find(opt => opt.factor === factor)?.cost || 1
  }

  const handleImageUpload = (file: File) => {
    setUploadedImage(file)
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    setProcessedImage(null)

    // Get image dimensions
    const img = new Image()
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height })
    }
    img.src = preview
  }

  const handleProcess = async () => {
    if (!uploadedImage || credits < getCost(selectedFactor)) return

    setIsProcessing(true)
    setProcessingStatus("Uploading image...")
    const cost = getCost(selectedFactor)

    try {
      // Step 1: Upload image to get public URL
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

      // Note: For kie.ai to work, we need a publicly accessible URL
      // Data URLs won't work. In production, use Supabase Storage or similar.
      const imageUrl = uploadData.url

      setProcessingStatus("Creating upscale task...")

      // Step 2: Create upscale task
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
        throw new Error(upscaleData.error || 'Upscale task failed')
      }

      const taskId = upscaleData.taskId

      // Step 3: Poll for task completion
      setProcessingStatus("Processing with Topaz AI...")
      let attempts = 0
      const maxAttempts = 60 // 5 minutes max (5 second intervals)

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000))

        const statusResponse = await fetch(`/api/upscale?taskId=${taskId}`)
        const statusData = await statusResponse.json()

        if (statusData.status === 'completed' || statusData.status === 'succeeded') {
          setProcessedImage(statusData.result?.url || statusData.result?.output_url)
          setCredits(prev => prev - cost)
          setIsProcessing(false)
          setProcessingStatus("")
          return
        }

        if (statusData.status === 'failed' || statusData.status === 'error') {
          throw new Error('Processing failed')
        }

        attempts++
        setProcessingStatus(`Processing... (${attempts * 5}s)`)
      }

      throw new Error('Processing timeout')

    } catch (error) {
      console.error('Processing error:', error)
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!processedImage) return
    const link = document.createElement('a')
    link.href = processedImage
    link.download = `upscaled-${selectedFactor}-${Date.now()}.png`
    link.click()
  }

  const getUpscaledDimensions = () => {
    const multiplier = parseInt(selectedFactor)
    return {
      width: imageDimensions.width * multiplier,
      height: imageDimensions.height * multiplier
    }
  }

  const currentCost = getCost(selectedFactor)

  return (
    <div className="min-h-screen bg-background">
      <Header
        credits={credits}
        onCreditsClick={() => setShowPricing(true)}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Hero />

        {!imagePreview ? (
          <UploadArea onImageUpload={handleImageUpload} />
        ) : !processedImage ? (
          <div className="space-y-8">
            {/* Uploaded Image Preview */}
            <div className="flex justify-center">
              <img
                src={imagePreview}
                alt="Uploaded"
                className="max-w-md rounded-lg border border-border"
              />
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
                {isProcessing ? processingStatus : credits < currentCost ? "Insufficient Credits" : `Enhance Image (Topaz)`}
              </button>
              {!isProcessing && (
                <button
                  onClick={() => {
                    setUploadedImage(null)
                    setImagePreview(null)
                  }}
                  className="px-6 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <ComparisonSlider
            beforeImage={imagePreview}
            afterImage={processedImage}
            originalWidth={imageDimensions.width}
            originalHeight={imageDimensions.height}
            upscaledWidth={getUpscaledDimensions().width}
            upscaledHeight={getUpscaledDimensions().height}
            onDownload={handleDownload}
            onReset={() => {
              setProcessedImage(null)
              setImagePreview(null)
              setUploadedImage(null)
            }}
          />
        )}
      </main>

      {showPricing && (
        <PricingModal onClose={() => setShowPricing(false)} />
      )}
    </div>
  )
}
