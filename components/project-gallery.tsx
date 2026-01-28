"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
  url?: string
  projectId?: string
}

interface Project {
  id: string
  title: string
  description: string
  images: MediaItem[]
  createdAt: string
}

export function ProjectGallery() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isClosing, setIsClosing] = useState(false)
  const [heroImageRotation, setHeroImageRotation] = useState<{ [key: string]: number }>({})

  const fetchMedia = useCallback(async () => {
    try {
      console.log("[v0] Fetching projects...")
      const response = await fetch(`/api/upload?t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Fetched media:", data)
        if (Array.isArray(data)) {
          // Group images by title (project)
          const groupedByProject: { [key: string]: MediaItem[] } = {}
          data.forEach((item: MediaItem) => {
            if (!groupedByProject[item.title]) {
              groupedByProject[item.title] = []
            }
            groupedByProject[item.title].push(item)
          })
          
          // Convert to projects array
          const projectsArray: Project[] = Object.entries(groupedByProject).map(([title, images]) => ({
            id: images[0].id,
            title,
            description: images[0].description,
            images: images.reverse(),
            createdAt: images[0].uploadedAt,
          }))
          
          setProjects(projectsArray.reverse())
          console.log("[v0] Projects updated:", projectsArray.length)
        } else {
          setProjects([])
        }
      } else {
        console.error("[v0] API response not ok:", response.status)
        setProjects([])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch media:", error)
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }, [setProjects, setIsLoading])

  useEffect(() => {
    setMounted(true)
    fetchMedia()

    // Listen for upload events with immediate and polling refresh
    const handleProjectUploaded = () => {
      console.log("[v0] Project uploaded event received!")
      // Try to fetch immediately
      setTimeout(() => {
        console.log("[v0] Attempting to refresh gallery after upload")
        fetchMedia()
      }, 300)
      
      // Also poll for updates in case of timing issues
      let pollCount = 0
      const pollInterval = setInterval(() => {
        pollCount++
        if (pollCount > 5) {
          clearInterval(pollInterval)
          return
        }
        console.log("[v0] Polling for updates, attempt", pollCount)
        fetchMedia()
      }, 800)
    }
    
    window.addEventListener('projectUploaded', handleProjectUploaded)
    return () => window.removeEventListener('projectUploaded', handleProjectUploaded)
  }, [fetchMedia])



  const handleImageLoad = (id: string) => {
    console.log("[v0] Image loaded:", id)
    setLoadedImages((prev) => new Set([...prev, id]))
  }

  const handleImageError = (id: string, src: string) => {
    console.error("[v0] Image failed to load:", id, "from URL:", src)
    setLoadedImages((prev) => new Set([...prev, id]))
  }

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project)
    setCurrentImageIndex(0)
  }

  const handleCloseModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setSelectedProject(null)
      setCurrentImageIndex(0)
      setIsClosing(false)
    }, 300)
  }

  const handleNextImage = () => {
    if (!selectedProject) return
    setCurrentImageIndex((prev) => (prev + 1) % selectedProject.images.length)
  }

  const handlePrevImage = () => {
    if (!selectedProject) return
    setCurrentImageIndex((prev) => (prev - 1 + selectedProject.images.length) % selectedProject.images.length)
  }

  // Auto-rotate hero images in cards
  useEffect(() => {
    const rotationIntervals = projects.map((project) => {
      const interval = setInterval(() => {
        setHeroImageRotation((prev) => ({
          ...prev,
          [project.id]: ((prev[project.id] || 0) + 1) % project.images.length,
        }))
      }, 4000) // Change image every 4 seconds
      return interval
    })

    return () => rotationIntervals.forEach((interval) => clearInterval(interval))
  }, [projects])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedProject) return
      if (e.key === "Escape") handleCloseModal()
      if (e.key === "ArrowLeft") handlePrevImage()
      if (e.key === "ArrowRight") handleNextImage()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedProject])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading gallery...</div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <div className="w-24 h-24 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mb-6">
          <svg className="size-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">No projects yet</h3>
        <p className="text-muted-foreground max-w-md mb-2">Start by uploading your first project to showcase your creative work</p>
        <p className="text-sm text-muted-foreground/70">Use the upload button in the floating dock to add projects</p>
      </div>
    )
  }

  return (
    <>
      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-accent/10 border border-border/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          {projects.map((project, index) => {
            const heroImageIdx = heroImageRotation[project.id] || 0
            const heroImage = project.images[heroImageIdx]
            const isImageLoaded = loadedImages.has(heroImage.id)

            return (
              <div
                key={project.id}
                onClick={() => handleOpenProject(project)}
                className="group relative cursor-pointer rounded-2xl overflow-hidden border border-border/50 transition-all duration-300 hover:border-accent hover:shadow-lg hover:shadow-accent/30 bg-muted"
                style={{ animationDelay: `${0.3 + index * 0.05}s` }}
              >
                {/* Hero Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* Loading State */}
                  {!isImageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-accent/10 z-10">
                      <Loader2 className="size-6 text-muted-foreground animate-spin" />
                    </div>
                  )}
                  {/* Hero Image */}
                  <img
                    src={heroImage.url || `/media/${heroImage.filename}`}
                    alt={project.title}
                    loading="lazy"
                    onLoad={() => handleImageLoad(heroImage.id)}
                    onError={() => handleImageError(heroImage.id, heroImage.url || `/media/${heroImage.filename}`)}
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
                  />
                  {/* Image Counter Badge */}
                  {project.images.length > 1 && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-border/50">
                      <span className="text-xs font-medium text-foreground">{heroImageIdx + 1}/{project.images.length}</span>
                    </div>
                  )}
                </div>

                {/* Project Info */}
                <div className="absolute inset-0 flex flex-col justify-end">
                  <div className="bg-gradient-to-t from-background/95 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 sm:p-6">
                    <h3 className="text-foreground font-semibold text-base sm:text-lg truncate">{project.title}</h3>
                    {project.description && (
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                </div>

                {/* Thumbnail Strips for Multiple Images */}
                {project.images.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-2 bg-gradient-to-t from-background/80 to-transparent">
                    {project.images.slice(0, 4).map((img, idx) => (
                      <div
                        key={idx}
                        className={`h-8 flex-1 rounded-sm overflow-hidden border-2 transition-all ${
                          idx === heroImageIdx ? "border-accent" : "border-border/50 opacity-60"
                        }`}
                      >
                        <img src={img.url || `/media/${img.filename}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-2xl transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
            onClick={handleCloseModal}
          />

          {/* Viewer */}
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 ${isClosing ? "animate-scale-down" : "animate-scale-up"}`}>
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 p-3 rounded-full bg-background/60 backdrop-blur-md border border-border/60 hover:bg-accent hover:border-accent transition-all duration-200 z-10 group"
              aria-label="Close"
            >
              <X className="size-5 sm:size-6 text-foreground group-hover:scale-110 transition-transform" />
            </button>

            {/* Image Navigation */}
            {selectedProject.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/60 backdrop-blur-md border border-border/60 hover:bg-accent hover:border-accent transition-all duration-200 z-10 group"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5 sm:size-6 text-foreground group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/60 backdrop-blur-md border border-border/60 hover:bg-accent hover:border-accent transition-all duration-200 z-10 group"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5 sm:size-6 text-foreground group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}

            {/* Content Container */}
            <div
              className="relative w-full max-w-6xl flex flex-col lg:flex-row gap-6 lg:gap-12 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Main Image */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-background/40 border border-border/30 min-h-[300px] lg:min-h-[500px]">
                  <img
                    src={selectedProject.images[currentImageIndex].url || `/media/${selectedProject.images[currentImageIndex].filename}`}
                    alt={selectedProject.title}
                    className="max-w-full max-h-[60vh] lg:max-h-[75vh] object-contain p-4"
                    onError={() => console.error("[v0] Modal image failed to load")}
                  />
                </div>
                
                {/* Image Thumbnails */}
                {selectedProject.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedProject.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-16 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex ? "border-accent" : "border-border/50 opacity-60 hover:opacity-80"
                        }`}
                      >
                        <img src={img.url || `/media/${img.filename}`} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Title and Description */}
              <div className="flex-1 flex flex-col justify-start lg:justify-center lg:sticky lg:top-0 py-4 lg:py-0">
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 lg:mb-6">{selectedProject.title}</h2>
                  {selectedProject.description && (
                    <div className="space-y-4">
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedProject.description}
                      </p>
                    </div>
                  )}
                  {selectedProject.images.length > 1 && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      Image {currentImageIndex + 1} of {selectedProject.images.length}
                    </div>
                  )}
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
