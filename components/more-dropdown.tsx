"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, FileText, Linkedin, Palette } from "lucide-react"

export function MoreDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const links = [
    { icon: <FileText className="size-4" strokeWidth={1.5} />, label: "Resume", href: "https://drive.google.com/file/d/1Fs0_uBrwJeFSUChm3arClNDuuF9CCNaA/view?usp=drive_link" },
    { icon: <Linkedin className="size-4" strokeWidth={1.5} />, label: "LinkedIn", href: "https://www.linkedin.com/in/amishgautam/" },
    { icon: <Palette className="size-4" strokeWidth={1.5} />, label: "Behance", href: "https://www.behance.net/amishgautam" },
  ]

  if (!mounted) return null

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="icon-button inline-flex items-center justify-center rounded-full bg-background/60 p-3 backdrop-blur-2xl shadow-lg transition-all"
        aria-label="More options"
      >
        <Plus className={`size-5 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} strokeWidth={1.5} />
      </button>

      <div
        className={`
          absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-44
          rounded-xl popup-container shadow-xl
          overflow-hidden
          transition-all duration-300 ease-out origin-bottom
          ${isOpen 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
          }
        `}
      >
        <div className="py-2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="dropdown-item flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 transition-all"
            >
              {link.icon}
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
