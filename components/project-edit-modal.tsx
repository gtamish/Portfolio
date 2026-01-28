"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Lock, Upload, Trash2, GripVertical, Loader2, Plus } from "lucide-react"

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
  url?: string
}

interface Project {
  id: string
  title: string
  description: string
  images: MediaItem[]
  createdAt: string
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
  
  // Edit mode state
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [draggedProject, setDraggedProject] = useState<string | null>(null)
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
      } else {
        setError("Invalid passkey")
        setPasskey("")
      }
    } catch (err) {
      setError("Authentication failed")
    } finally {
      setIsChecking(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", "New Project")
      formData.append("description", "")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        await fetchProjects()
        onProjectsUpdated?.()
      } else {
        setError("Failed to upload project")
      }
    } catch (err) {
      setError("Upload failed")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const response = await fetch("/api/delete-project", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${passkey}`,
        },
        body: JSON.stringify({ projectId }),
      })

      if (response.ok) {
        await fetchProjects()
        onProjectsUpdated?.()
      } else {
        setError("Failed to delete project")
      }
    } catch (err) {
      setError("Delete failed")
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
      
      // Save projects order and metadata
      const metadata = projects.flatMap(project => 
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
        onProjectsUpdated?.()
        setError("")
      } else {
        setError("Failed to save changes")
      }
    } catch (err) {
      setError("Save failed")
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
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-interactive w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-accent/30 hover:border-accent/50 text-accent hover:bg-accent/5 transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Add New Project
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Projects List */}
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
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {project.images.length} image{project.images.length !== 1 ? 's' : ''}
                          </p>
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
    </div>
  )
}
