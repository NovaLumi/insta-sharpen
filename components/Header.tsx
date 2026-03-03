"use client"

import { Coins } from "lucide-react"

interface HeaderProps {
  credits: number
  onCreditsClick: () => void
}

export default function Header({ credits, onCreditsClick }: HeaderProps) {
  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          InstaSharpen
        </h1>

        <button
          onClick={onCreditsClick}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <Coins className="w-4 h-4 text-primary" />
          <span className="font-medium">Credits: {credits}</span>
        </button>
      </div>
    </header>
  )
}
