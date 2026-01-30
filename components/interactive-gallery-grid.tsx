"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Lock, Unlock, Save, X, GripHorizontal, GripVertical, ChevronRight, Grid3x3 } from "lucide-react"

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
}: InteractiveGalleryGridProps) {
  const [layout, setLayout] = useState<ProjectLayout>(currentLayout)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState>({
    projectId: null,
    startX: 0,
    startY: 0,
    originalColSpan: 1,
    originalRowSpan: 1,
    handle: null,
  })

  const visualProjects = projects.filter(p => p.images && p.images.length > 0)

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
    if (!isEditMode) return
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

  return (
    <div className="w-full">
      {/* Floating Controls - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
        {isEditMode && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center p-3 rounded-full bg-accent hover:bg-accent/90 text-background transition-colors disabled:opacity-50 shadow-lg"
            title={isSaving ? "Saving..." : "Save layout"}
          >
            <Save className="size-5" />
          </button>
        )}
        
        <button
          onClick={isEditMode ? () => setIsEditMode(false) : handleAuthenticate}
          className="inline-flex items-center justify-center p-3 rounded-full bg-accent/10 hover:bg-accent/20 text-accent transition-colors shadow-lg"
          title={isEditMode ? "Lock grid" : "Edit layout"}
        >
          {isEditMode ? (
            <Lock className="size-5" />
          ) : (
            <Grid3x3 className="size-5" />
          )}
        </button>
      </div>

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
              onMouseEnter={() => isEditMode && setSelectedProjectId(project.id)}
              onMouseLeave={() => setSelectedProjectId(null)}
              onClick={() => !isEditMode && onProjectClick && onProjectClick(project)}
              className={`group relative cursor-pointer rounded-2xl overflow-visible transition-all duration-300 ${
                isEditMode ? "ring-2 ring-accent/30" : ""
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

              {/* Project Overlay - Show for all projects when not in edit mode */}
              {!isEditMode && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-start justify-end pointer-events-none p-4 sm:p-6">
                  <div className="text-left">
                    <h4 className="text-white font-semibold text-sm sm:text-base mb-2">
                      {project.title}
                    </h4>
                    {project.description && (
                      <p className="text-white/80 text-xs sm:text-sm line-clamp-2 mb-3">
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
                </div>
              )}

              {/* Edit Mode Overlay */}
              {isEditMode && (
                <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="space-y-4 text-center">
                    <h4 className="text-white font-semibold text-sm">
                      {project.title}
                    </h4>
                    <p className="text-white/70 text-xs">
                      {layout[project.id]?.colSpan || 1}×{layout[project.id]?.rowSpan || 1}
                    </p>
                    <p className="text-white/50 text-xs">
                      Drag borders to resize
                    </p>
                  </div>
                </div>
              )}

              {/* Right border drag handle */}
              {isEditMode && (
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
              {isEditMode && (
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
              {isEditMode && (
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
      {isEditMode && (
        <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
          <p className="text-sm text-foreground/80">
            <strong>Edit Mode:</strong> Hover over boxes to reveal resize handles. Drag the borders (right edge for width, bottom edge for height, corner for both) to resize. Changes update in real-time. Click Save Layout to persist.
          </p>
        </div>
      )}
    </div>
  )
}
