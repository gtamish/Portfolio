"use client"

import { useState, useEffect } from "react"
import { ThemeToggle } from "./theme-toggle"
import { MoreDropdown } from "./more-dropdown"
import { EditButton } from "./edit-button"
import { LayoutToggle } from "./layout-toggle"
import { MobileMenu } from "./mobile-menu"
import { useInitialAnimation } from "./animation-provider"

interface AnimatedThemeToggleProps {
  onEditClick?: () => void
  isLayoutEditMode?: boolean
  onLayoutEditModeChange?: (mode: boolean) => void
  onLayoutSave?: () => void
  isLayoutSaving?: boolean
}

export function AnimatedThemeToggle({ 
  onEditClick, 
  isLayoutEditMode = false,
  onLayoutEditModeChange,
  onLayoutSave,
  isLayoutSaving = false,
}: AnimatedThemeToggleProps = {}) {
  const shouldAnimate = useInitialAnimation()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null)
  const [mounted, setMounted] = useState(false)
  const [cursorNearBottom, setCursorNearBottom] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle cursor position near bottom
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const viewportHeight = window.innerHeight
      const distanceFromBottom = viewportHeight - e.clientY
      // Show toggle if cursor is within 100px of bottom
      setCursorNearBottom(distanceFromBottom < 100)
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight
      const viewportHeight = window.innerHeight
      const scrollableHeight = scrollHeight - viewportHeight
      const isNearBottom = currentScrollY > scrollableHeight - 300
      
      // Hide only when scrolling down AND not at top AND near bottom, unless cursor is near bottom
      if (currentScrollY > lastScrollY && currentScrollY > 100 && isNearBottom && !cursorNearBottom) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)

      if (scrollTimeout) clearTimeout(scrollTimeout)
      const timeout = setTimeout(() => {
        setIsVisible(true)
      }, 2000)
      setScrollTimeout(timeout)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [lastScrollY, scrollTimeout, cursorNearBottom])

  return (
    <div 
      className={`fixed bottom-6 right-6 z-30 flex items-center gap-2 transition-all duration-500 ease-out ${shouldAnimate ? "animate-slide-in-bottom-right" : ""} ${isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"}`}
      style={shouldAnimate ? { animationDelay: "0.5s" } : undefined}
    >
      {/* Mobile menu - visible only on small screens */}
      <MobileMenu onEditClick={onEditClick} />
      
      {/* Desktop menu - hidden on small screens */}
      <div className="hidden sm:flex items-center gap-2">
        <MoreDropdown />
        <LayoutToggle 
          isEditMode={isLayoutEditMode}
          onToggle={() => {
            if (!isLayoutEditMode) {
              const passkey = prompt("Enter passkey to edit layout:")
              if (passkey) {
                fetch("/api/verify-passkey", {
                  method: "POST",
                  body: JSON.stringify({ passkey }),
                }).then(res => {
                  if (res.ok) {
                    onLayoutEditModeChange?.(true)
                  } else {
                    alert("Invalid passkey")
                  }
                }).catch(err => {
                  console.error("[v0] Passkey verification failed:", err)
                  alert("Error verifying passkey")
                })
              }
            } else {
              onLayoutEditModeChange?.(false)
            }
          }}
          onSave={onLayoutSave}
          isSaving={isLayoutSaving}
        />
        <EditButton onEditClick={onEditClick} />
        <ThemeToggle />
      </div>
    </div>
  )
}
