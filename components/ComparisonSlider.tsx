"use client"

import { Download, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"
import { ReactCompareSlider } from "react-compare-slider"
import Image from "next/image"

interface ComparisonSliderProps {
  beforeImage: string
  afterImage: string
  originalWidth: number
  originalHeight: number
  upscaledWidth: number
  upscaledHeight: number
  onDownload: () => void
  onReset: () => void
}

export default function ComparisonSlider({
  beforeImage,
  afterImage,
  originalWidth,
  originalHeight,
  upscaledWidth,
  upscaledHeight,
  onDownload,
  onReset,
}: ComparisonSliderProps) {
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

      {/* Resolution Info */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="px-4 py-2 bg-secondary/50 rounded-lg">
          <span className="text-muted-foreground">Original: </span>
          <span className="font-medium">{originalWidth} × {originalHeight}</span>
        </div>
        <div className="px-4 py-2 bg-primary/10 rounded-lg">
          <span className="text-primary">Upscaled: </span>
          <span className="font-medium text-primary">{upscaledWidth} × {upscaledHeight}</span>
        </div>
      </div>

      {/* Comparison Slider */}
      <div className="max-w-2xl mx-auto rounded-xl overflow-hidden border-2 border-border">
        <ReactCompareSlider
          itemOne={
            <div className="relative w-full h-full">
              <Image
                src={beforeImage}
                alt="Before - Original image"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white text-sm font-medium rounded-full">
                Original
              </div>
            </div>
          }
          itemTwo={
            <div className="relative w-full h-full">
              <Image
                src={afterImage}
                alt="After - Upscaled image"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-white text-sm font-medium rounded-full">
                Upscaled
              </div>
            </div>
          }
          className="h-[400px] md:h-[500px]"
        />
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
