"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Coins, ScanSearch, ShieldCheck, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import UploadArea from "@/components/UploadArea"
import UpscaleSelector from "@/components/UpscaleSelector"
import ComparisonSlider from "@/components/ComparisonSlider"
import type { UpscaleFactor } from "@/types"
import { UPSCALE_OPTIONS } from "@/types"
import { useApp } from "@/lib/context/AppContext"

const POLL_INTERVAL_MS = 1000
const MAX_POLL_ATTEMPTS = 120

export default function EnhancePage() {
  const router = useRouter()
  const { user, credits, fetchCredits } = useApp()
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFactor, setSelectedFactor] = useState<UpscaleFactor>("4x")
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState("")
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  const objectUrlsRef = useRef<Set<string>>(new Set())
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    const urls = objectUrlsRef.current

    return () => {
      isMountedRef.current = false
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const getCost = (factor: UpscaleFactor) => {
    return UPSCALE_OPTIONS.find((opt) => opt.factor === factor)?.cost || 1
  }

  const handleImageUpload = useCallback((file: File) => {
    const preview = URL.createObjectURL(file)
    objectUrlsRef.current.add(preview)

    setUploadedImage(file)
    setImagePreview(preview)
    setProcessedImage(null)
    setProcessingStatus("")

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

    if (!user) {
      setProcessingStatus("Please sign in to enhance images and use your free credits.")
      router.push("/login?redirect=/enhance")
      return
    }

    const cost = getCost(selectedFactor)
    if (credits < cost) {
      setProcessingStatus("Insufficient credits")
      return
    }

    setIsProcessing(true)
    setProcessingStatus("Uploading image...")

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", uploadedImage)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      const uploadData = await uploadResponse.json()
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Upload failed")
      }

      if (!isMountedRef.current) return
      setProcessingStatus("Creating upscale task...")

      const upscaleResponse = await fetch("/api/upscale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          upscaleFactor: selectedFactor.replace("x", ""),
        }),
      })

      const upscaleData = await upscaleResponse.json()
      if (!upscaleResponse.ok) {
        fetchCredits()
        throw new Error(upscaleData.error || "Upscale task failed")
      }

      const taskId = upscaleData.taskId
      fetchCredits()

      if (!isMountedRef.current) return
      setProcessingStatus("Processing... (usually takes 1-2 minutes)")

      let attempts = 0

      while (attempts < MAX_POLL_ATTEMPTS && isMountedRef.current) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

        if (!isMountedRef.current) return

        try {
          const statusResponse = await fetch(`/api/upscale?taskId=${taskId}`)
          if (!statusResponse.ok) {
            attempts++
            continue
          }

          const statusData = await statusResponse.json()

          if (statusData.status === "completed") {
            setProcessingStatus("Loading result...")

            const img = new window.Image()
            const finish = () => {
              if (isMountedRef.current) {
                setProcessedImage(statusData.result?.url)
                fetchCredits()
                setIsProcessing(false)
                setProcessingStatus("")
              }
            }

            img.onload = finish
            img.onerror = finish
            img.src = statusData.result?.url
            return
          }

          if (statusData.status === "failed") {
            fetchCredits()
            throw new Error(
              statusData.refunded
                ? "Processing failed and your credits were refunded."
                : "Processing failed"
            )
          }

          attempts++
        } catch (pollError) {
          console.warn("Poll error:", pollError)
          attempts++

          if (attempts >= MAX_POLL_ATTEMPTS) {
            throw new Error("Failed to check processing status. Please refresh the page.")
          }
        }
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new Error("Processing timeout")
      }
    } catch (error) {
      console.error("Processing error:", error)
      if (isMountedRef.current) {
        setProcessingStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        setIsProcessing(false)
      }
    }
  }

  const handleDownload = () => {
    if (!processedImage) return

    const link = document.createElement("a")
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
    setProcessingStatus("")
  }, [])

  const getUpscaledDimensions = () => {
    const multiplier = parseInt(selectedFactor, 10)
    return {
      width: imageDimensions.width * multiplier,
      height: imageDimensions.height * multiplier,
    }
  }

  const currentCost = getCost(selectedFactor)
  const selectedOption = UPSCALE_OPTIONS.find((option) => option.factor === selectedFactor)
  const upscaledDimensions = getUpscaledDimensions()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,1))]">
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Enhance your image
              </h1>
              <p className="max-w-2xl text-sm text-slate-300 md:text-base">
                Upload first, then choose the upscale level that fits your output.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Session</p>
                <p className="mt-1 text-sm font-semibold">{user ? "Ready to process" : "Sign in to start"}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 px-4 py-3">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
                  <Coins className="h-3.5 w-3.5" />
                  Credits
                </p>
                <p className="mt-1 text-xl font-bold">{user ? credits : 3}</p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current mode</p>
                <p className="mt-1 text-sm font-semibold">
                  {selectedOption?.label} · {currentCost} credit{currentCost > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
          {!user && (
            <p className="mt-4 text-sm text-slate-400">
              Sign in to claim 3 free credits before processing your first image.
            </p>
          )}
        </section>

        {!imagePreview ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <UploadArea onImageUpload={handleImageUpload} />
            </div>
            <aside className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <ScanSearch className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Best input</p>
                    <p className="mt-1 text-sm text-slate-400">
                      JPG, PNG, or WebP up to 10MB. Cleaner originals still upscale better.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Quick guide</p>
                    <p className="mt-1 text-sm text-slate-400">
                      4x works best for most photos. 8x is better for aggressive crops and print work.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-primary/10 p-4 text-sm text-slate-300">
                <p className="font-medium text-primary">Pricing</p>
                <div className="mt-3 space-y-2">
                  {UPSCALE_OPTIONS.map((option) => (
                    <div key={option.factor} className="flex items-center justify-between">
                      <span>{option.label}</span>
                      <span>{option.cost} credits</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        ) : !processedImage ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Source preview</p>
                  <h2 className="text-xl font-semibold">Your uploaded image</h2>
                </div>
                {imageDimensions.width > 0 && (
                  <div className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {imageDimensions.width} x {imageDimensions.height}
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <Image
                  src={imagePreview}
                  alt="Uploaded image preview"
                  width={900}
                  height={900}
                  className="h-full max-h-[620px] w-full object-contain"
                  unoptimized
                />
              </div>
            </div>

            <aside className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <UpscaleSelector
                selectedFactor={selectedFactor}
                onSelect={setSelectedFactor}
              />

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">Profile</span>
                      <span>{selectedOption?.description || "Balanced"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">Cost</span>
                      <span>{currentCost} credit{currentCost > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">Output</span>
                      <span>{upscaledDimensions.width} x {upscaledDimensions.height}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">Balance</span>
                      <span>{user ? `${credits} credits` : "Sign in"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing || (!!user && credits < currentCost)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">AI</span>
                  {isProcessing
                    ? processingStatus
                    : !user
                      ? "Sign In to Enhance"
                      : credits < currentCost
                        ? "Insufficient Credits"
                        : "Enhance Image"}
                </button>

                {!isProcessing && (
                  <button
                    onClick={handleCancelUpload}
                    className="rounded-xl border border-white/10 px-6 py-3 text-sm transition-colors hover:bg-white/5"
                  >
                    Choose Another Image
                  </button>
                )}
              </div>

              {processingStatus && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <p className="font-medium">Status</p>
                  <p className="mt-2 text-slate-400">{processingStatus}</p>
                </div>
              )}
            </aside>
          </section>
        ) : (
          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 md:p-8">
            <ComparisonSlider
              beforeImage={imagePreview || ""}
              afterImage={processedImage}
              originalWidth={imageDimensions.width}
              originalHeight={imageDimensions.height}
              upscaledWidth={upscaledDimensions.width}
              upscaledHeight={upscaledDimensions.height}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </section>
        )}
      </div>
    </main>
  )
}
