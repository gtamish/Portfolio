"use client"

import { useState, useEffect } from "react"
import { ThemeToggle } from "./theme-toggle"
import { useInitialAnimation } from "./animation-provider"

export function AnimatedThemeToggle() {
  const shouldAnimate = useInitialAnimation()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)

      if (scrollTimeout) clearTimeout(scrollTimeout)
      const timeout = setTimeout(() => {
        setIsVisible(true)
      }, 1500)
      setScrollTimeout(timeout)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [lastScrollY, scrollTimeout])

  return (
    <div 
      className={`fixed bottom-6 right-6 z-30 transition-all duration-500 ease-out ${shouldAnimate ? "animate-slide-in-bottom-right" : ""} ${isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"}`}
      style={shouldAnimate ? { animationDelay: "0.5s" } : undefined}
    >
      <ThemeToggle />
    </div>
  )
}
