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
        fixed top-0 left-1/2 -translate-x-1/2 z-20
        py-3 sm:py-4 px-6 sm:px-8
        transition-all duration-300 ease-out
        ${isSticky 
          ? "opacity-100 translate-y-0 bg-background/70 backdrop-blur-2xl border-b border-border/40 shadow-sm" 
          : "opacity-0 -translate-y-full"
        }
      `}
    >
      <h1 className="text-base sm:text-lg font-semibold text-foreground whitespace-nowrap">{title}</h1>
    </div>
  )
}
