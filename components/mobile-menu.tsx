"use client"

import { useState, useRef, useEffect } from "react"
import { MoreVertical, Edit3, FileText, Linkedin, Palette } from "lucide-react"
import { usePathname } from "next/navigation"

interface MobileMenuProps {
  onEditClick?: () => void
}

export function MobileMenu({ onEditClick }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const isProjectsPage = pathname === "/projects"
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleEdit = () => {
    onEditClick?.()
    setIsOpen(false)
  }

  const externalLinks = [
    { icon: <FileText className="size-4" strokeWidth={1.5} />, label: "Resume", href: "https://drive.google.com/file/d/1Fs0_uBrwJeFSUChm3arClNDuuF9CCNaA/view?usp=drive_link" },
    { icon: <Linkedin className="size-4" strokeWidth={1.5} />, label: "LinkedIn", href: "https://www.linkedin.com/in/amishgautam/" },
    { icon: <Palette className="size-4" strokeWidth={1.5} />, label: "Behance", href: "https://www.behance.net/amishgautam" },
  ]

  if (!mounted) return null

  return (
    <div ref={menuRef} className="relative sm:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="icon-button inline-flex items-center justify-center rounded-full bg-background/60 p-3 backdrop-blur-2xl shadow-lg transition-all"
        aria-label="Menu"
      >
        <MoreVertical className={`size-5 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} strokeWidth={1.5} />
      </button>

      <div
        className={`
          absolute bottom-full right-0 mb-3 w-48
          rounded-xl popup-container shadow-xl
          overflow-hidden
          transition-all duration-300 ease-out origin-bottom-right
          ${isOpen 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
          }
        `}
      >
        <div className="py-2">
          {/* Edit Button - Only on Projects Page */}
          {isProjectsPage && (
            <button
              onClick={handleEdit}
              className="dropdown-item w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 transition-all"
            >
              <Edit3 className="size-4" strokeWidth={1.5} />
              <span>Edit Projects</span>
            </button>
          )}

          {/* Divider */}
          <div className="my-2 h-px bg-border" />

          {/* External Links */}
          {externalLinks.map((link) => (
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
