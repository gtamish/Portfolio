"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Lock, Unlock, Save, X, GripHorizontal, GripVertical, ChevronRight, Grid3x3, Star, Sparkles } from "lucide-react"
import { getAverageImageColor, getContrastTextColor } from "@/lib/contrast"

interface ProjectLayout {
  [projectId: string]: { colSpan: number; rowSpan: number }
}

interface InteractiveGalleryGridProps {
  projects: Array<{
    id: string
    title: string
    description?: string
    tag?: "Visuals" | "Case Studies"
    featured?: boolean
    images: Array<{ id: string; url?: string; filename: string }>
  }>
  onLayoutChange: (layout: ProjectLayout) => void
  currentLayout: ProjectLayout
  onProjectClick?: (project: any) => void
}

interface DragState {
  projectId: string | null
  startX: number
  startY: number
  originalColSpan: number
  originalRowSpan: number
  handle: "right" | "bottom" | "corner" | null
}

export function InteractiveGalleryGrid({
  projects,
  onLayoutChange,
  currentLayout,
  onProjectClick,
  isEditMode,
  onEditModeChange,
  onSave,
}: InteractiveGalleryGridProps & {
  isEditMode?: boolean
  onEditModeChange?: (mode: boolean) => void
  onSave?: () => void
}) {
  const [layout, setLayout] = useState<ProjectLayout>(currentLayout)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [textColors, setTextColors] = useState<{ [key: string]: "light" | "dark" }>({})
  const [gradientOverlays, setGradientOverlays] = useState<{ [key: string]: string }>({})
  const editMode = isEditMode ?? false
  const [dragState, setDragState] = useState<DragState>({
    projectId: null,
    startX: 0,
    startY: 0,
    originalColSpan: 1,
    originalRowSpan: 1,
    handle: null,
  })

  const visualProjects = projects
    .filter(p => p.images && p.images.length > 0)
    .sort((a, b) => {
      // Featured projects come first
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      // Otherwise maintain original order
      return 0
    })

  const handleAuthenticate = async () => {
    const passkey = prompt("Enter passkey to edit layout:")
    if (passkey) {
      // Verify passkey with backend
      try {
        const response = await fetch("/api/verify-passkey", {
          method: "POST",
          body: JSON.stringify({ passkey }),
        })
        if (response.ok) {
          setIsAuthenticated(true)
          setIsEditMode(true)
        } else {
          alert("Invalid passkey")
        }
      } catch (error) {
        console.error("[v0] Passkey verification failed:", error)
      }
    }
  }

  const updateProjectSpan = (projectId: string, colSpan: number, rowSpan: number) => {
    const newLayout = {
      ...layout,
      [projectId]: {
        colSpan: Math.max(1, Math.min(4, colSpan)),
        rowSpan: Math.max(1, Math.min(2, rowSpan)),
      },
    }
    setLayout(newLayout)
    onLayoutChange(newLayout)
  }

  const handleResizeStart = (
    projectId: string,
    handle: "right" | "bottom" | "corner",
    e: React.MouseEvent
  ) => {
    if (!editMode) return
    e.preventDefault()
    e.stopPropagation()

    const current = layout[projectId] || { colSpan: 1, rowSpan: 1 }
    setDragState({
      projectId,
      startX: e.clientX,
      startY: e.clientY,
      originalColSpan: current.colSpan,
      originalRowSpan: current.rowSpan,
      handle,
    })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.projectId || !dragState.handle) return

    const deltaX = e.clientX - dragState.startX
    const deltaY = e.clientY - dragState.startY

    let newColSpan = dragState.originalColSpan
    let newRowSpan = dragState.originalRowSpan

    // Grid cell is approximately 300px + gap (24px) = ~325px per column
    // and auto-rows-[300px] + gap = ~325px per row
    const cellSize = 325

    if (dragState.handle === "right" || dragState.handle === "corner") {
      const change = Math.round(deltaX / cellSize)
      newColSpan = Math.max(1, Math.min(4, dragState.originalColSpan + change))
    }

    if (dragState.handle === "bottom" || dragState.handle === "corner") {
      const change = Math.round(deltaY / cellSize)
      newRowSpan = Math.max(1, Math.min(2, dragState.originalRowSpan + change))
    }

    if (
      newColSpan !== dragState.originalColSpan ||
      newRowSpan !== dragState.originalRowSpan
    ) {
      const newLayout = {
        ...layout,
        [dragState.projectId]: { colSpan: newColSpan, rowSpan: newRowSpan },
      }
      setLayout(newLayout)
      onLayoutChange(newLayout)
    }
  }, [dragState, layout, onLayoutChange])

  const handleMouseUp = () => {
    setDragState({
      projectId: null,
      startX: 0,
      startY: 0,
      originalColSpan: 1,
      originalRowSpan: 1,
      handle: null,
    })
  }

  useEffect(() => {
    if (dragState.projectId) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [dragState.projectId, dragState, handleMouseMove])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const passkey = prompt("Enter passkey to save layout:")
      if (!passkey) {
        setIsSaving(false)
        return
      }

      console.log("[v0] Saving layout with", Object.keys(layout).length, "projects")

      const response = await fetch("/api/gallery-layout", {
        method: "PUT",
        body: JSON.stringify({ passkey, layout }),
      })

      console.log("[v0] Save response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Save response data:", data)
        alert("Layout saved successfully!")
        setIsEditMode(false)
        setIsAuthenticated(false)
      } else {
        const error = await response.json()
        console.error("[v0] Save error response:", error)
        alert(`Failed to save layout: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("[v0] Failed to save layout:", error)
      alert("Error saving layout: " + String(error))
    } finally {
      setIsSaving(false)
    }
  }

  const getGridSpan = (projectId: string): string => {
    const span = layout[projectId]
    if (!span) return "col-span-1 row-span-1"
    return `col-span-${span.colSpan} row-span-${span.rowSpan}`
  }

  // Gradient options
  const gradientOptions = [
    { label: "None", value: "" },
    { label: "Warm", value: "bg-gradient-to-br from-orange-500/40 via-red-500/30 to-transparent" },
    { label: "Cool", value: "bg-gradient-to-br from-blue-500/40 via-purple-500/30 to-transparent" },
    { label: "Forest", value: "bg-gradient-to-br from-green-500/40 via-emerald-500/30 to-transparent" },
    { label: "Sunset", value: "bg-gradient-to-br from-amber-500/40 via-orange-500/30 to-transparent" },
    { label: "Midnight", value: "bg-gradient-to-br from-slate-600/40 via-blue-900/30 to-transparent" },
    { label: "Neon", value: "bg-gradient-to-br from-cyan-400/40 via-pink-500/30 to-transparent" },
  ]

  const toggleGradient = (projectId: string, gradientClass: string) => {
    setGradientOverlays(prev => ({
      ...prev,
      [projectId]: prev[projectId] === gradientClass ? "" : gradientClass
    }))
  }

  // Calculate text colors for all projects on mount and when projects change
  useEffect(() => {
    const calculateColors = async () => {
      const colors: { [key: string]: "light" | "dark" } = {}
      for (const project of projects) {
        const heroImage = project.images[0]
        if (heroImage) {
          try {
            const avgColor = await getAverageImageColor(heroImage.url || `/media/${heroImage.filename}`)
            colors[project.id] = getContrastTextColor(avgColor)
          } catch {
            colors[project.id] = "light" // Fallback to light text
          }
        }
      }
      setTextColors(colors)
    }
    calculateColors()
  }, [projects])

  return (
    <div className="w-full">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-[300px]">
        {visualProjects.map((project) => {
          const heroImage = project.images[0]
          if (!heroImage) return null

          const span = getGridSpan(project.id)
          const isSelected = selectedProjectId === project.id
          const isDragging = dragState.projectId === project.id
          const isCaseStudy = project.tag === "Case Studies"

          return (
            <div
              key={project.id}
              onMouseEnter={() => editMode && setSelectedProjectId(project.id)}
              onMouseLeave={() => setSelectedProjectId(null)}
              onClick={() => !editMode && onProjectClick && onProjectClick(project)}
              className={`group relative cursor-pointer rounded-2xl overflow-visible transition-all duration-300 ${
                editMode ? "ring-2 ring-accent/30" : ""
              } ${isSelected ? "ring-2 ring-accent" : ""} ${isDragging ? "ring-2 ring-accent" : ""} ${span}`}
            >
              {/* Image Container */}
              <div className="w-full h-full rounded-2xl overflow-hidden">
                <img
                  src={heroImage.url || `/media/${heroImage.filename}`}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Gradient Overlay */}
              {gradientOverlays[project.id] && (
                <div className={`absolute inset-0 rounded-2xl pointer-events-none ${gradientOverlays[project.id]}`} />
              )}

              {/* Gradient Feature Button - Top Left */}
              {editMode && (
                <div className="absolute top-3 left-3 z-20 group/gradient">
                  <button
                    className="p-2 rounded-full bg-accent/90 backdrop-blur-md hover:bg-accent transition-all group"
                    title="Add gradient overlay"
                  >
                    <Sparkles className="size-4 text-background" />
                  </button>
                  {/* Gradient Menu */}
                  <div className="hidden group-hover/gradient:flex absolute top-12 left-0 flex-col gap-1 p-2 bg-background/95 backdrop-blur-md rounded-lg border border-border/30 shadow-lg w-28">
                    {gradientOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => toggleGradient(project.id, option.value)}
                        className={`px-2 py-1 text-xs rounded transition-colors text-left ${
                          gradientOverlays[project.id] === option.value
                            ? "bg-accent text-background"
                            : "hover:bg-accent/20 text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Badge - Animated Gradient */}
              {project.featured && !editMode && (
                <div className="absolute top-3 left-3 z-10">
                  <style>{`
                    @keyframes gradientShift {
                      0%, 100% { background-position: 0% 50%; }
                      50% { background-position: 100% 50%; }
                    }
                    .featured-gradient {
                      background: linear-gradient(-45deg, #ff6b6b, #ff8e72, #feca57, #48dbfb, #ff6b6b);
                      background-size: 300% 300%;
                      animation: gradientShift 6s ease infinite;
                    }
                  `}</style>
                  <div className="featured-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                    <Star className="size-3.5 fill-current text-current" />
                    <span className="text-xs font-semibold text-current">Featured</span>
                  </div>
                </div>
              )}

              {/* Project Info Overlay - Bottom, visible always for Case Studies, on hover for Visuals */}
              {!editMode && (
                <div
                  className={`absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-card/80 backdrop-blur-md rounded-b-2xl flex flex-col justify-end h-auto transition-opacity ${
                    isCaseStudy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <h4 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1 text-card-foreground mix-blend-mode-lighten">
                    {project.title}
                  </h4>
                  {project.description && (
                    <p className="text-xs sm:text-sm line-clamp-2 mb-2 text-card-foreground/90 mix-blend-mode-lighten">
                      {project.description}
                    </p>
                  )}
                  {isCaseStudy && (
                    <div className="flex items-center gap-2 text-accent font-semibold text-xs sm:text-sm group-hover:translate-x-1 transition-transform">
                      <span>Read case study</span>
                      <ChevronRight className="size-4" />
                    </div>
                  )}
                </div>
              )}

              {/* Edit Mode Overlay */}
              {editMode && (
                <div className="absolute inset-0 rounded-2xl bg-card/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="space-y-4 text-center">
                    <h4 className="text-card-foreground font-semibold text-sm">
                      {project.title}
                    </h4>
                    <p className="text-card-foreground/70 text-xs">
                      {layout[project.id]?.colSpan || 1}×{layout[project.id]?.rowSpan || 1}
                    </p>
                    <p className="text-card-foreground/50 text-xs">
                      Drag borders to resize
                    </p>
                  </div>
                </div>
              )}

              {/* Right border drag handle */}
              {editMode && (
                <div
                  onMouseDown={(e) => handleResizeStart(project.id, "right", e)}
                  className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:w-2 hover:bg-accent/60 transition-all opacity-0 group-hover:opacity-100 ${
                    dragState.projectId === project.id && dragState.handle === "right"
                      ? "w-2 bg-accent"
                      : "bg-accent/30"
                  }`}
                  title="Drag to resize width"
                />
              )}

              {/* Bottom border drag handle */}
              {editMode && (
                <div
                  onMouseDown={(e) => handleResizeStart(project.id, "bottom", e)}
                  className={`absolute bottom-0 left-0 h-1 w-full cursor-row-resize hover:h-2 hover:bg-accent/60 transition-all opacity-0 group-hover:opacity-100 ${
                    dragState.projectId === project.id && dragState.handle === "bottom"
                      ? "h-2 bg-accent"
                      : "bg-accent/30"
                  }`}
                  title="Drag to resize height"
                />
              )}

              {/* Corner drag handle */}
              {editMode && (
                <div
                  onMouseDown={(e) => handleResizeStart(project.id, "corner", e)}
                  className={`absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-nwse-resize ${
                    dragState.projectId === project.id && dragState.handle === "corner"
                      ? "opacity-100"
                      : ""
                  }`}
                >
                  <div className="flex gap-1">
                    <GripVertical className="size-4 text-accent" />
                    <GripHorizontal className="size-4 text-accent" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Help Text */}
      {editMode && (
        <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
          <p className="text-sm text-foreground/80">
            <strong>Edit Mode:</strong> Hover over boxes to reveal resize handles. Drag the borders (right edge for width, bottom edge for height, corner for both) to resize. Changes update in real-time. Click Save Layout to persist.
          </p>
        </div>
      )}
    </div>
  )
}
