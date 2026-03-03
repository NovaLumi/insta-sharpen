"use client"

import { Zap, Sparkles, User } from "lucide-react"
import { motion } from "framer-motion"
import type { EngineMode } from "@/types"

interface EngineSelectorProps {
  selectedMode: EngineMode
  onSelect: (mode: EngineMode) => void
}

const engines = [
  {
    id: 'standard' as EngineMode,
    name: 'Standard Upscale',
    description: '2x upscaling, fast processing',
    icon: Zap,
  },
  {
    id: 'pro' as EngineMode,
    name: 'Pro Enhance',
    description: '4x upscaling + extreme clarity',
    icon: Sparkles,
    recommended: true,
  },
  {
    id: 'face' as EngineMode,
    name: 'Face Restore',
    description: 'Specialized for old photos/facial blur',
    icon: User,
  },
]

export default function EngineSelector({ selectedMode, onSelect }: EngineSelectorProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {engines.map((engine, index) => {
          const Icon = engine.icon
          const isSelected = selectedMode === engine.id

          return (
            <motion.div
              key={engine.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(engine.id)}
              className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all
                ${isSelected
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-border hover:border-primary/50 bg-secondary/20'
                }
              `}
            >
              {engine.recommended && (
                <span className="absolute -top-2 -right-2 px-2 py-1 text-xs font-semibold bg-gradient-to-r from-primary to-purple-500 text-white rounded-full">
                  Recommended
                </span>
              )}

              <div className="space-y-3">
                <div className={`flex items-center gap-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Icon className="w-6 h-6" />
                  <h3 className="font-semibold">{engine.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {engine.description}
                </p>
              </div>

              {isSelected && (
                <motion.div
                  layoutId="selectedIndicator"
                  className="absolute bottom-2 left-2 right-2 h-1 bg-primary rounded-full"
                />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
