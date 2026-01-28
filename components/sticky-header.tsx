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
        fixed top-0 left-0 right-0 z-20
        flex items-center justify-center
        py-4 px-6
        transition-all duration-300 ease-out
        ${isSticky 
          ? "opacity-100 translate-y-0 bg-background/80 backdrop-blur-xl border-b border-border/50" 
          : "opacity-0 -translate-y-full"
        }
      `}
    >
      <h1 className="text-lg font-medium text-foreground">{title}</h1>
    </div>
  )
}
