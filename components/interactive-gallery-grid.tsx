"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Lock, Unlock, Save, X, GripHorizontal } from "lucide-react"

interface ProjectLayout {
  [projectId: string]: { colSpan: number; rowSpan: number }
}

interface InteractiveGalleryGridProps {
  projects: Array<{
    id: string
    title: string
    images: Array<{ id: string; url?: string; filename: string }>
  }>
  onLayoutChange: (layout: ProjectLayout) => void
  currentLayout: ProjectLayout
}

export function InteractiveGalleryGrid({
  projects,
  onLayoutChange,
  currentLayout,
}: InteractiveGalleryGridProps) {
  const [layout, setLayout] = useState<ProjectLayout>(currentLayout)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [draggedProject, setDraggedProject] = useState<string | null>(null)
  const [dragHandle, setDragHandle] = useState<"horizontal" | "vertical" | null>(null)

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
    handle: "horizontal" | "vertical"
  ) => {
    if (!isEditMode) return
    setDraggedProject(projectId)
    setDragHandle(handle)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedProject || !dragHandle) return

    const currentSpan = layout[draggedProject]
    if (!currentSpan) return

    if (dragHandle === "horizontal") {
      // Horizontal resize - change colSpan
      const change = Math.round((e.movementX || 0) / 100)
      if (change !== 0) {
        updateProjectSpan(
          draggedProject,
          currentSpan.colSpan + change,
          currentSpan.rowSpan
        )
        setDragHandle(null)
        setDraggedProject(null)
      }
    } else if (dragHandle === "vertical") {
      // Vertical resize - change rowSpan
      const change = Math.round((e.movementY || 0) / 100)
      if (change !== 0) {
        updateProjectSpan(
          draggedProject,
          currentSpan.colSpan,
          currentSpan.rowSpan + change
        )
        setDragHandle(null)
        setDraggedProject(null)
      }
    }
  }, [draggedProject, dragHandle, layout])

  const handleMouseUp = () => {
    setDraggedProject(null)
    setDragHandle(null)
  }

  useEffect(() => {
    if (draggedProject) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [draggedProject, dragHandle, handleMouseMove])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const passkey = prompt("Enter passkey to save layout:")
      if (!passkey) {
        setIsSaving(false)
        return
      }

      const response = await fetch("/api/gallery-layout", {
        method: "PUT",
        body: JSON.stringify({ passkey, layout }),
      })

      if (response.ok) {
        alert("Layout saved successfully!")
        setIsEditMode(false)
        setIsAuthenticated(false)
      } else {
        alert("Failed to save layout")
      }
    } catch (error) {
      console.error("[v0] Failed to save layout:", error)
      alert("Error saving layout")
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
      {/* Controls */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <button
          onClick={isEditMode ? () => setIsEditMode(false) : handleAuthenticate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors font-medium"
        >
          {isEditMode ? (
            <>
              <Lock className="size-4" />
              <span>Lock Grid</span>
            </>
          ) : (
            <>
              <Unlock className="size-4" />
              <span>Edit Layout</span>
            </>
          )}
        </button>

        {isEditMode && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-background transition-colors font-medium disabled:opacity-50"
          >
            <Save className="size-4" />
            <span>{isSaving ? "Saving..." : "Save Layout"}</span>
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-[300px]">
        {visualProjects.map((project) => {
          const heroImage = project.images[0]
          if (!heroImage) return null

          const span = getGridSpan(project.id)
          const isSelected = selectedProjectId === project.id

          return (
            <div
              key={project.id}
              onMouseEnter={() => isEditMode && setSelectedProjectId(project.id)}
              onMouseLeave={() => setSelectedProjectId(null)}
              className={`group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${
                isEditMode ? "ring-2 ring-accent/30" : ""
              } ${isSelected ? "ring-2 ring-accent" : ""} ${span}`}
            >
              {/* Image */}
              <img
                src={heroImage.url || `/media/${heroImage.filename}`}
                alt={project.title}
                className="w-full h-full object-cover"
              />

              {/* Edit Mode Overlay */}
              {isEditMode && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-white font-semibold text-sm mb-2">
                        {project.title}
                      </h4>
                      <p className="text-white/70 text-xs">
                        {layout[project.id]?.colSpan || 1}×{layout[project.id]?.rowSpan || 1}
                      </p>
                    </div>

                    {/* Resize Controls */}
                    <div className="flex gap-2">
                      <button
                        onMouseDown={() => handleResizeStart(project.id, "horizontal")}
                        className="px-3 py-1 bg-accent/20 hover:bg-accent/40 text-white text-xs rounded transition-colors"
                      >
                        W: {layout[project.id]?.colSpan || 1}
                      </button>
                      <button
                        onMouseDown={() => handleResizeStart(project.id, "vertical")}
                        className="px-3 py-1 bg-accent/20 hover:bg-accent/40 text-white text-xs rounded transition-colors"
                      >
                        H: {layout[project.id]?.rowSpan || 1}
                      </button>
                    </div>

                    <p className="text-white/50 text-xs text-center">
                      Drag buttons to resize
                    </p>
                  </div>
                </div>
              )}

              {/* Corner resize indicator */}
              {isEditMode && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripHorizontal className="size-4 text-white" />
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
            <strong>Edit Mode:</strong> Hover over boxes and drag the Width/Height buttons to resize. Changes update in real-time. Click Save Layout to persist changes.
          </p>
        </div>
      )}
    </div>
  )
}
