"use client"

import { useState, useEffect, useRef } from "react"
import { X, Lock, Edit2, Upload, Trash2, Loader2, Plus, Check, AlertCircle, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
  url?: string
  tag?: "Visuals" | "Case Studies"
  featured?: boolean
}

interface CaseStudySection {
  id: string
  type: "image" | "text" | "images-grid" | "figma"
  content: {
    title?: string
    description?: string
    images?: string[]
    figmaUrl?: string
  }
  order: number
}

interface CaseStudyEditModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
  onSave?: () => void
}

export function CaseStudyEditModal({ isOpen, onClose, projectId, projectTitle, onSave }: CaseStudyEditModalProps) {
  const [mounted, setMounted] = useState(false)
  const [passkey, setPasskey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  // Edit state
  const [sections, setSections] = useState<CaseStudySection[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [draggedSection, setDraggedSection] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (!isOpen) return null

  const handlePasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsChecking(true)

    try {
      const response = await fetch("/api/verify-passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setPasskey("")
      } else {
        setError("Invalid passkey")
      }
    } catch (err) {
      setError("Verification failed")
    } finally {
      setIsChecking(false)
    }
  }

  const addSection = (type: "image" | "text" | "images-grid" | "figma") => {
    const newSection: CaseStudySection = {
      id: Date.now().toString(),
      type,
      content: {},
      order: sections.length,
    }
    setSections([...sections, newSection])
  }

  const updateSection = (id: string, content: Partial<CaseStudySection["content"]>) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, content: { ...s.content, ...content } } : s))
    )
  }

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
  }

  const handleDragStart = (id: string) => {
    setDraggedSection(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetId: string) => {
    if (!draggedSection) return

    const draggedIndex = sections.findIndex((s) => s.id === draggedSection)
    const targetIndex = sections.findIndex((s) => s.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newSections = [...sections]
    const [draggedItem] = newSections.splice(draggedIndex, 1)
    newSections.splice(targetIndex, 0, draggedItem)

    setSections(newSections.map((s, i) => ({ ...s, order: i })))
    setDraggedSection(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/case-study/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections,
          projectTitle,
        }),
      })

      if (response.ok) {
        toast({ description: "Case study updated successfully" })
        onSave?.()
        onClose()
      } else {
        setError("Failed to save changes")
      }
    } catch (err) {
      setError("Save failed")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Edit Case Study</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isAuthenticated ? (
            /* Authentication Form */
            <form onSubmit={handlePasskeySubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="size-4" />
                  Enter Passkey
                </label>
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter passkey to edit"
                  className="w-full px-4 py-2 rounded-lg border border-border/30 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isChecking}
                className="w-full px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isChecking && <Loader2 className="size-4 animate-spin" />}
                Verify & Continue
              </button>
            </form>
          ) : (
            /* Edit Form */
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Project: {projectTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  {sections.length} section{sections.length !== 1 ? "s" : ""} added
                </p>
              </div>

              {/* Sections List */}
              <div className="space-y-3">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => handleDragStart(section.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(section.id)}
                    className="border border-border/30 rounded-lg p-4 space-y-3 cursor-move hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="size-4 text-muted-foreground" />
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent capitalize">
                        {section.type}
                      </span>
                      <button
                        onClick={() => removeSection(section.id)}
                        className="ml-auto p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </button>
                    </div>

                    {/* Section Content Editor */}
                    {section.type === "image" && (
                      <input
                        type="text"
                        placeholder="Image URL"
                        value={section.content.images?.[0] || ""}
                        onChange={(e) => updateSection(section.id, { images: [e.target.value] })}
                        className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    )}

                    {section.type === "text" && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Section title"
                          value={section.content.title || ""}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                        <textarea
                          placeholder="Section content"
                          value={section.content.description || ""}
                          onChange={(e) => updateSection(section.id, { description: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                        />
                      </div>
                    )}

                    {section.type === "figma" && (
                      <input
                        type="text"
                        placeholder="Figma prototype URL (e.g., https://www.figma.com/embed?url=...)"
                        value={section.content.figmaUrl || ""}
                        onChange={(e) => updateSection(section.id, { figmaUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Add Section Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => addSection("image")}
                  className="px-4 py-2 rounded-lg border border-border/30 hover:bg-accent/10 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="size-4" />
                  Image
                </button>
                <button
                  onClick={() => addSection("text")}
                  className="px-4 py-2 rounded-lg border border-border/30 hover:bg-accent/10 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="size-4" />
                  Text
                </button>
                <button
                  onClick={() => addSection("images-grid")}
                  className="px-4 py-2 rounded-lg border border-border/30 hover:bg-accent/10 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="size-4" />
                  Grid
                </button>
                <button
                  onClick={() => addSection("figma")}
                  className="px-4 py-2 rounded-lg border border-border/30 hover:bg-accent/10 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="size-4" />
                  Figma
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border/20">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg border border-border/30 hover:bg-accent/10 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="size-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
