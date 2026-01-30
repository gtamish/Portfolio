"use client"

import { useState, useEffect } from "react"

interface StickyHeaderProps {
  title: string
}

export function StickyHeader({ title }: StickyHeaderProps) {
  const [isSticky, setIsSticky] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsSticky(window.scrollY > 200)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div
      className={`
        fixed inset-x-0 top-0 z-20
        transition-all duration-300 ease-out
        ${isSticky 
          ? "opacity-100 translate-y-0 bg-background/70 backdrop-blur-xl border-b border-white/5 dark:border-white/5 shadow-lg" 
          : "opacity-0 -translate-y-full"
        }
      `}
    >
      <div className="flex items-center justify-center py-3 sm:py-4 px-6 sm:px-8">
        <h1 className="text-base sm:text-lg font-semibold text-foreground whitespace-nowrap mix-blend-mode-lighten">{title}</h1>
      </div>
    </div>
  )
}
