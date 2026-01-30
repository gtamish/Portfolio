"use client"

import { Grid3x3 } from "lucide-react"
import { useEffect, useState } from "react"

interface LayoutToggleProps {
  isEditMode: boolean
  onToggle: () => void
  onSave?: () => void
  isSaving?: boolean
}

export function LayoutToggle({ isEditMode, onToggle, onSave, isSaving }: LayoutToggleProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        disabled
        className="icon-button inline-flex items-center justify-center rounded-full bg-background/60 p-3 backdrop-blur-2xl shadow-lg transition-colors"
        aria-label="Edit layout"
      >
        <Grid3x3 className="size-5" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isEditMode && onSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="icon-button inline-flex items-center justify-center rounded-full bg-accent hover:bg-accent/90 text-background p-3 backdrop-blur-2xl shadow-lg transition-all disabled:opacity-50"
          aria-label="Save layout"
          title={isSaving ? "Saving..." : "Save layout"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        </button>
      )}
      <button
        onClick={onToggle}
        className="icon-button inline-flex items-center justify-center rounded-full bg-background/60 p-3 backdrop-blur-2xl shadow-lg transition-all"
        aria-label={isEditMode ? "Lock layout" : "Edit layout"}
        title={isEditMode ? "Lock layout" : "Edit layout"}
      >
        <Grid3x3 className={`size-5 transition-transform ${isEditMode ? "opacity-60" : ""}`} />
      </button>
    </div>
  )
}
