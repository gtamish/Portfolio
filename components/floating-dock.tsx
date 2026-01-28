"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Home, FolderOpen, User } from "lucide-react"
import { useInitialAnimation } from "./animation-provider"
import { MoreDropdown } from "./more-dropdown"

interface DockItem {
  icon: React.ReactNode
  label: string
  href: string
}

interface FloatingDockProps {
  onUploadClick?: () => void
}

export function FloatingDock({ onUploadClick }: FloatingDockProps) {
  const pathname = usePathname()
  const shouldAnimate = useInitialAnimation()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border/50 bg-background/70 px-3 py-2 shadow-lg backdrop-blur-xl">
          {items.map((item) => {
            const isActive = getIsActive(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
                  transition-all duration-200 ease-out
                  outline-none
                  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  active:scale-95
                  ${isActive 
                    ? "bg-foreground text-background shadow-sm opacity-100" 
                    : "opacity-50 hover:opacity-100 hover:bg-accent hover:text-accent-foreground"
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
        <MoreDropdown onUploadClick={onUploadClick} />
      </div>
    </nav>
  )
}
