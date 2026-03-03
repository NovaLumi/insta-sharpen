"use client"

import { useState, useRef, useEffect } from "react"
import { Download, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"

interface ComparisonSliderProps {
  beforeImage: string
  afterImage: string
  onDownload: () => void
  onReset: () => void
}

export default function ComparisonSlider({
  beforeImage,
  afterImage,
  onDownload,
  onReset,
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = (x / rect.width) * 100
      setSliderPosition(Math.max(0, Math.min(100, percentage)))
    }

    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Enhancement Complete!</h2>
        <p className="text-muted-foreground">Drag the slider to compare before & after</p>
      </div>

      <div
        ref={containerRef}
        className="relative max-w-2xl mx-auto rounded-xl overflow-hidden border-2 border-border"
        style={{ aspectRatio: '1/1' }}
      >
        {/* Before Image */}
        <img
          src={beforeImage}
          alt="Before"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* After Image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={afterImage}
            alt="After"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ left: `-${100 - sliderPosition}%` }}
          />
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white text-sm font-medium rounded-full">
          Before
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white text-sm font-medium rounded-full">
          After
        </div>

        {/* Slider Handle */}
        <div
          className={`absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize ${isDragging ? 'w-2' : ''}`}
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="w-6 h-0.5 bg-gray-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-secondary transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          New Image
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          Download High-Quality Image
        </motion.button>
      </div>
    </motion.div>
  )
}
