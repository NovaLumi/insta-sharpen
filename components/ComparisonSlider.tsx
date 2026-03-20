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
        <p className="text-muted-foreground">Drag the slider to compare before and after.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <div className="rounded-lg bg-secondary/50 px-4 py-2">
          <span className="text-muted-foreground">Original: </span>
          <span className="font-medium">{originalWidth} x {originalHeight}</span>
        </div>
        <div className="rounded-lg bg-primary/10 px-4 py-2">
          <span className="text-primary">Upscaled: </span>
          <span className="font-medium text-primary">{upscaledWidth} x {upscaledHeight}</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border-2 border-border">
        <ReactCompareSlider
          itemOne={
            <div className="relative h-full w-full">
              <Image
                src={beforeImage}
                alt="Before - Original image"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-4 left-4 rounded-full bg-black/70 px-3 py-1 text-sm font-medium text-white">
                Original
              </div>
            </div>
          }
          itemTwo={
            <div className="relative h-full w-full">
              <Image
                src={afterImage}
                alt="After - Upscaled image"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-4 right-4 rounded-full bg-primary px-3 py-1 text-sm font-medium text-white">
                Upscaled
              </div>
            </div>
          }
          className="h-[400px] md:h-[500px]"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 transition-colors hover:bg-secondary"
        >
          <RotateCcw className="h-4 w-4" />
          New Image
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDownload}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download High-Quality Image
        </motion.button>
      </div>
    </motion.div>
  )
}
