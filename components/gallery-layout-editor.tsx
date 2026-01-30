"use client"

import { useState, useCallback, useRef } from "react"
import { X, GripHorizontal, Lock, Unlock } from "lucide-react"

interface GridLayout {
  [projectId: string]: { colSpan: number; rowSpan: number }
}

interface GalleryLayoutEditorProps {
  isOpen: boolean
  onClose: () => void
  projects: Array<{ id: string; title: string }>
  onLayoutSave: (layout: GridLayout) => Promise<void>
  onPasskeyPrompt: () => Promise<string>
}

export function GalleryLayoutEditor({
  isOpen,
  onClose,
  projects,
  onLayoutSave,
  onPasskeyPrompt,
}: GalleryLayoutEditorProps) {
  const [layout, setLayout] = useState<GridLayout>({})
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleAuthenticate = async () => {
    const passkey = await onPasskeyPrompt()
    if (passkey) {
      setIsAuthenticated(true)
    }
  }

  const handleProjectSelect = (projectId: string) => {
    if (!isAuthenticated) {
      handleAuthenticate()
      return
    }
    setSelectedProjectId(projectId)
  }

  const updateLayout = (projectId: string, colSpan: number, rowSpan: number) => {
    setLayout((prev) => ({
      ...prev,
      [projectId]: {
        colSpan: Math.max(1, Math.min(4, colSpan)),
        rowSpan: Math.max(1, Math.min(2, rowSpan)),
      },
    }))
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      await handleAuthenticate()
      return
    }

    setIsSaving(true)
    try {
      await onLayoutSave(layout)
      onClose()
    } catch (error) {
      console.error("[v0] Failed to save layout:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-background border border-border/50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/20">
          <h2 className="text-2xl font-bold text-foreground">Grid Layout Editor</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Unlock className="size-12 text-muted-foreground" />
              <p className="text-center text-foreground/80">
                Authentication required to edit grid layout
              </p>
              <button
                onClick={handleAuthenticate}
                className="px-6 py-2 bg-accent text-background rounded-lg font-medium hover:bg-accent/90 transition-colors"
              >
                Enter Passkey
              </button>
            </div>
          ) : (
            <div className="space-y-6" ref={containerRef}>
              {projects.map((project) => {
                const projectLayout = layout[project.id] || { colSpan: 1, rowSpan: 1 }
                const isSelected = selectedProjectId === project.id

                return (
                  <div
                    key={project.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border/30 hover:border-border/60 bg-muted/30"
                    }`}
                    onClick={() => handleProjectSelect(project.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <GripHorizontal className="size-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">{project.title}</h3>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {projectLayout.colSpan}×{projectLayout.rowSpan}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Size Preview */}
                        <div className="grid grid-cols-4 gap-2 p-3 bg-background/50 rounded-lg">
                          {[...Array(Math.max(projectLayout.colSpan, 1))].map((_, i) => (
                            <div
                              key={i}
                              className={`bg-accent/20 rounded h-8 ${
                                i < projectLayout.colSpan ? "bg-accent/40" : ""
                              }`}
                            />
                          ))}
                        </div>

                        {/* Column Span Control */}
                        <div>
                          <label className="text-sm font-medium text-foreground/80">
                            Width: {projectLayout.colSpan} columns
                          </label>
                          <div className="flex gap-2 mt-2">
                            {[1, 2, 3, 4].map((span) => (
                              <button
                                key={span}
                                onClick={() =>
                                  updateLayout(
                                    project.id,
                                    span,
                                    projectLayout.rowSpan
                                  )
                                }
                                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                                  projectLayout.colSpan === span
                                    ? "bg-accent text-background"
                                    : "bg-muted hover:bg-muted/80 text-foreground"
                                }`}
                              >
                                {span}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Row Span Control */}
                        <div>
                          <label className="text-sm font-medium text-foreground/80">
                            Height: {projectLayout.rowSpan} rows
                          </label>
                          <div className="flex gap-2 mt-2">
                            {[1, 2].map((span) => (
                              <button
                                key={span}
                                onClick={() =>
                                  updateLayout(
                                    project.id,
                                    projectLayout.colSpan,
                                    span
                                  )
                                }
                                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                                  projectLayout.rowSpan === span
                                    ? "bg-accent text-background"
                                    : "bg-muted hover:bg-muted/80 text-foreground"
                                }`}
                              >
                                {span}×
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border/20 bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg hover:bg-muted transition-colors font-medium text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isAuthenticated || isSaving}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isAuthenticated && !isSaving
                ? "bg-accent text-background hover:bg-accent/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isSaving ? "Saving..." : "Save Layout"}
          </button>
        </div>
      </div>
    </div>
  )
}
