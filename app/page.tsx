"use client"

import { useState } from "react"
import Header from "@/components/Header"
import Hero from "@/components/Hero"
import UploadArea from "@/components/UploadArea"
import EngineSelector from "@/components/EngineSelector"
import ComparisonSlider from "@/components/ComparisonSlider"
import PricingModal from "@/components/PricingModal"
import type { EngineMode } from "@/types"

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedEngine, setSelectedEngine] = useState<EngineMode>('pro')
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [credits, setCredits] = useState(3)
  const [showPricing, setShowPricing] = useState(false)

  const handleImageUpload = (file: File) => {
    setUploadedImage(file)
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    setProcessedImage(null)
  }

  const handleProcess = async () => {
    if (!uploadedImage || credits < 1) return

    setIsProcessing(true)
    setCredits(prev => prev - 1)

    // Simulate processing (replace with actual API call)
    setTimeout(() => {
      // For demo, use the same image
      setProcessedImage(imagePreview!)
      setIsProcessing(false)
    }, 2000)
  }

  const handleDownload = () => {
    if (!processedImage) return
    const link = document.createElement('a')
    link.href = processedImage
    link.download = `upscaled-${Date.now()}.png`
    link.click()
  }

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
            <div className="flex justify-center">
              <img
                src={imagePreview}
                alt="Uploaded"
                className="max-w-md rounded-lg border border-border"
              />
            </div>

            <EngineSelector
              selectedMode={selectedEngine}
              onSelect={setSelectedEngine}
            />

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setUploadedImage(null)
                  setImagePreview(null)
                }}
                className="px-6 py-3 rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProcess}
                disabled={isProcessing || credits < 1}
                className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : credits < 1 ? "No Credits" : "Enhance Image"}
              </button>
            </div>
          </div>
        ) : (
          <ComparisonSlider
            beforeImage={imagePreview}
            afterImage={processedImage}
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
