"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FolderOpen, User } from "lucide-react"
import { useInitialAnimation } from "./animation-provider"

interface DockItem {
  icon: React.ReactNode
  label: string
  href: string
}

export function FloatingDock() {
  const pathname = usePathname()
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
      // Show dock if cursor is within 100px of bottom
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

  const items: DockItem[] = [
    { icon: <Home className="size-5" strokeWidth={1.5} />, label: "Home", href: "/" },
    { icon: <FolderOpen className="size-5" strokeWidth={1.5} />, label: "Projects", href: "/projects" },
    { icon: <User className="size-5" strokeWidth={1.5} />, label: "About", href: "/about" },
  ]

  const getIsActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <nav 
      className={`fixed bottom-6 left-1/2 z-30 -translate-x-1/2 transition-all duration-500 ease-out ${shouldAnimate ? "animate-slide-in-bottom" : ""} ${isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"}`}
      style={shouldAnimate ? { animationDelay: "0.4s" } : undefined}
    >
      <div className="flex items-center gap-1 rounded-full bg-background/60 px-3 py-2 shadow-lg backdrop-blur-2xl hover:bg-background/70 transition-colors">
          {items.map((item) => {
            const isActive = getIsActive(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  btn-interactive inline-flex items-center justify-center gap-3 rounded-full px-4 py-2 text-sm font-medium
                  outline-none
                  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  ${isActive 
                    ? "bg-white text-black dark:bg-white dark:text-black shadow-md opacity-100" 
                    : "opacity-60 hover:opacity-100 hover:bg-accent/30"
                  }
                `}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
    </nav>
  )
}
