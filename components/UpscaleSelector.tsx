"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import type { UpscaleFactor, UpscaleOption } from "@/types"
import { UPSCALE_OPTIONS } from "@/types"

interface UpscaleSelectorProps {
  selectedFactor: UpscaleFactor
  onSelect: (factor: UpscaleFactor) => void
}

export default function UpscaleSelector({ selectedFactor, onSelect }: UpscaleSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-muted-foreground mb-3">
        Select Upscale Factor:
      </label>
      <div className="inline-flex rounded-xl bg-secondary/30 p-1 gap-1">
        {UPSCALE_OPTIONS.map((option) => {
          const isSelected = selectedFactor === option.factor

          return (
            <button
              key={option.factor}
              onClick={() => onSelect(option.factor)}
              className={`
                relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isSelected
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {option.label}
                {option.recommended && !isSelected && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                    {option.description}
                  </span>
                )}
              </span>
              {isSelected && (
                <motion.div
                  layoutId="upscaleIndicator"
                  className="absolute inset-0 bg-primary rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
