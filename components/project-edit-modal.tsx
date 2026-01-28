"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Lock, Upload, Trash2, GripVertical, Loader2, Plus, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProjectUploadDialog } from "./project-upload-dialog"

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

interface Project {
  id: string
  title: string
  description: string
  images: MediaItem[]
  createdAt: string
  tag?: "Visuals" | "Case Studies"
  featured?: boolean
}

interface ProjectEditModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectsUpdated?: () => void
}

export function ProjectEditModal({ isOpen, onClose, onProjectsUpdated }: ProjectEditModalProps) {
  const [mounted, setMounted] = useState(false)
  const [passkey, setPasskey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()
  
  // Edit mode state
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [draggedProject, setDraggedProject] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects()
    }
  }, [isAuthenticated])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/upload?t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          const groupedByProject: { [key: string]: MediaItem[] } = {}
          data.forEach((item: MediaItem) => {
            if (!groupedByProject[item.title]) {
              groupedByProject[item.title] = []
            }
            groupedByProject[item.title].push(item)
          })
          
          const projectsArray: Project[] = Object.entries(groupedByProject).map(([title, images]) => ({
            id: images[0].id,
            title,
            description: images[0].description,
            images: images.reverse(),
            createdAt: images[0].uploadedAt,
            tag: (images[0].tag || "Visuals") as "Visuals" | "Case Studies",
            featured: images[0].featured || false,
          }))
          
          setProjects(projectsArray.reverse())
        }
      }
    } catch (err) {
      setError("Failed to load projects")
    } finally {
      setIsLoading(false)
    }
  }

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
        toast({
          title: "Authenticated",
          description: "You can now manage your projects.",
        })
      } else {
        setError("Invalid passkey")
        setPasskey("")
        toast({
          title: "Authentication Failed",
          description: "Invalid passkey. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Authentication failed")
      toast({
        title: "Error",
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleUpdateTag = (projectId: string, newTag: "Visuals" | "Case Studies") => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, tag: newTag } : p
    ))
  }

  const handleToggleFeatured = (projectId: string) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, featured: !p.featured } : { ...p, featured: false }
    ))
  }

  const handleProjectUpload = async ({ title, description, tag, images }: { 
    title: string
    description: string
    tag: "Visuals" | "Case Studies"
    images: Array<{ file: File; id: string; preview: string }>
  }) => {
    try {
      setIsUploading(true)

      // Upload all images
      const uploadPromises = images.map(async (img) => {
        const formData = new FormData()
        formData.append("file", img.file)
        formData.append("title", title)
        formData.append("description", description)
        formData.append("tag", tag)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Upload failed")
        return response.json()
      })

      await Promise.all(uploadPromises)

      await fetchProjects()
      setShowUploadDialog(false)
      toast({
        title: "Success",
        description: `Project "${title}" uploaded with ${images.length} image(s).`,
      })
      onProjectsUpdated?.()
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: "Could not upload project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      // Update local state immediately
      const projectToDelete = projects.find(p => p.id === projectId)
      if (!projectToDelete) return

      setProjects(projects.filter(p => p.id !== projectId))
      
      // Delete all images for this project
      const deletePromises = projectToDelete.images.map(img =>
        fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: img.id }),
        })
      )

      await Promise.all(deletePromises)
      
      // Save updated metadata
      const metadata = projects.flatMap(project => 
        project.images.map(img => ({
          ...img,
          title: project.title,
          description: project.description,
        }))
      ).filter(img => img.title !== projectToDelete.title)

      const response = await fetch("/api/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata }),
      })

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Project deleted successfully.",
        })
        onProjectsUpdated?.()
      } else {
        setError("Failed to delete project")
        await fetchProjects() // Restore on error
        toast({
          title: "Error",
          description: "Failed to delete project.",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Delete failed")
      await fetchProjects() // Restore on error
      toast({
        title: "Error",
        description: "Delete failed. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReorder = async (draggedId: string, targetId: string) => {
    const draggedIndex = projects.findIndex(p => p.id === draggedId)
    const targetIndex = projects.findIndex(p => p.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newProjects = [...projects]
    const [draggedProject] = newProjects.splice(draggedIndex, 1)
    newProjects.splice(targetIndex, 0, draggedProject)
    
    setProjects(newProjects)

    // Save the new order immediately
    try {
      const metadata = newProjects.flatMap(project => 
        project.images.map(img => ({
          ...img,
          title: project.title,
          description: project.description,
        }))
      )

      const response = await fetch("/api/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata }),
      })

      if (response.ok) {
        console.log("[v0] Project order updated")
      }
    } catch (err) {
      console.error("[v0] Failed to save project order:", err)
    }
  }

  const handleUpdateTitle = (projectId: string, newTitle: string) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, title: newTitle } : p
    ))
  }

  const handleUpdateDescription = (projectId: string, newDescription: string) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, description: newDescription } : p
    ))
  }

  const handleSaveChanges = async () => {
    try {
      setIsUploading(true)
      
      // Save projects order, metadata, tags, and featured status
      const metadata = projects.flatMap(project => 
        project.images.map(img => ({
          ...img,
          title: project.title,
          description: project.description,
          tag: project.tag || "Visuals",
          featured: project.featured || false,
        }))
      )

      const response = await fetch("/api/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata }),
      })

      if (response.ok) {
        toast({
          title: "Saved",
          description: "All changes saved successfully.",
        })
        onProjectsUpdated?.()
        setError("")
      } else {
        setError("Failed to save changes")
        toast({
          title: "Error",
          description: "Failed to save changes.",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Save failed")
      toast({
        title: "Error",
        description: "Save failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (!mounted || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 backdrop-overlay" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl glass-panel shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-white/5 flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Manage Projects</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg hover:bg-accent/20 p-2 transition-colors"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isAuthenticated ? (
            <form onSubmit={handlePasskeySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enter Passkey
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    type="password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter passkey to continue"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    disabled={isChecking}
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-destructive mt-2">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={isChecking || !passkey}
                className="w-full px-4 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChecking ? "Verifying..." : "Authenticate"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Add Project Button */}
              <button
                onClick={() => setShowUploadDialog(true)}
                disabled={isUploading}
                className="btn-interactive w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-accent/30 hover:border-accent/50 text-accent hover:bg-accent/5 transition-all disabled:opacity-50"
              >
                <Plus className="size-5" />
                <span>Add New Project</span>
              </button>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={() => setDraggedProject(project.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedProject) {
                          handleReorder(draggedProject, project.id)
                          setDraggedProject(null)
                        }
                      }}
                      className="group btn-interactive p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-move"
                    >
                      <div className="flex items-start gap-4">
                        <GripVertical className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground mt-1 flex-shrink-0" strokeWidth={1.5} />
                        
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={project.title}
                            onChange={(e) => handleUpdateTitle(project.id, e.target.value)}
                            className="w-full font-medium text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-accent outline-none transition-colors px-0 mb-2"
                            placeholder="Project title"
                          />
                          <textarea
                            value={project.description}
                            onChange={(e) => handleUpdateDescription(project.id, e.target.value)}
                            className="w-full text-sm text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-accent outline-none transition-colors px-0 resize-none"
                            placeholder="Project description"
                            rows={2}
                          />
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <p className="text-xs text-muted-foreground/70">
                              {project.images.length} image{project.images.length !== 1 ? 's' : ''}
                            </p>
                            <select
                              value={project.tag || "Visuals"}
                              onChange={(e) => handleUpdateTag(project.id, e.target.value as "Visuals" | "Case Studies")}
                              className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:border-accent/50 text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                            >
                              <option value="Visuals">Visuals</option>
                              <option value="Case Studies">Case Studies</option>
                            </select>
                            <button
                              onClick={() => handleToggleFeatured(project.id)}
                              className={`btn-interactive text-xs px-3 py-1 rounded-full font-medium transition-all ${
                                project.featured
                                  ? "bg-gradient-to-r from-orange-400 to-pink-400 text-white"
                                  : "bg-white/10 border border-white/20 hover:border-accent/50 text-foreground"
                              }`}
                            >
                              {project.featured ? "★ Featured" : "☆ Featured"}
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="btn-interactive flex-shrink-0 p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="size-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No projects yet. Add one to get started!</p>
                </div>
              )}

              {error && <p className="text-sm text-destructive p-3 rounded-lg bg-destructive/10">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="border-t border-white/10 dark:border-white/5 p-6 flex gap-3 flex-shrink-0">
            <button
              onClick={() => {
                setIsAuthenticated(false)
                setProjects([])
              }}
              className="btn-interactive flex-1 px-4 py-3 rounded-lg bg-background/40 hover:bg-accent/20 transition-all"
            >
              Close
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isUploading}
              className="btn-interactive flex-1 px-4 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isUploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <ProjectUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleProjectUpload}
        isUploading={isUploading}
      />
    </div>
  )
}
