"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Edit3 } from "lucide-react"

interface EditButtonProps {
  onEditClick?: () => void
}

export function EditButton({ onEditClick }: EditButtonProps) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const isProjectsPage = pathname === "/projects"

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isProjectsPage) return null

  return (
    <button
      onClick={onEditClick}
      className="inline-flex items-center justify-center rounded-full bg-background/60 p-3 backdrop-blur-2xl shadow-lg hover:bg-background/70 transition-colors"
      aria-label="Edit projects"
      title="Edit projects"
    >
      <Edit3 className="size-5" strokeWidth={1.5} />
    </button>
  )
}
