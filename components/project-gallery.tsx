"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { InteractiveGalleryGrid } from "@/components/interactive-gallery-grid"

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
  url?: string
  projectId?: string
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

export function ProjectGallery({ filter, onFullscreenChange, onLayoutEditorOpen }: { filter?: string | null; onFullscreenChange?: (isFullscreen: boolean) => void; onLayoutEditorOpen?: () => void }) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [imageDimensions, setImageDimensions] = useState<{ [key: string]: { width: number; height: number } }>({})
  const [customLayout, setCustomLayout] = useState<{ [key: string]: { colSpan: number; rowSpan: number } }>({})
  const [isClosing, setIsClosing] = useState(false)
  const [thumbRect, setThumbRect] = useState<DOMRect | null>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  // Filter projects based on tag
  const filteredProjects = filter 
    ? projects.filter(p => p.tag === filter)
    : projects

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchProjects = useCallback(async () => {
    try {
      console.log("[v0] Fetching projects...")
      const response = await fetch("/api/upload", { method: "GET" })
      const data = await response.json()

      let projectsArray: Project[] = []

      // Handle both structures: new project-based and old flat image array
      if (Array.isArray(data) && data.length > 0) {
        if ('images' in data[0]) {
          // New project-based structure
          projectsArray = data as Project[]
        } else {
          // Old flat image array structure - group by title
          const groupedByProject: { [key: string]: MediaItem[] } = {}
          data.forEach((item: MediaItem) => {
            const projectName = item.title || "Untitled"
            if (!groupedByProject[projectName]) {
              groupedByProject[projectName] = []
            }
            groupedByProject[projectName].push(item)
          })

          projectsArray = Object.entries(groupedByProject).map(([title, images]) => ({
            id: images[0].id,
            title,
            description: images[0].description,
            images: images.reverse(),
            createdAt: images[0].uploadedAt,
            tag: (images[0].tag || "Visuals") as "Visuals" | "Case Studies",
            featured: images[0].featured || false,
          }))
        }
      }

      setProjects(projectsArray)
      console.log("[v0] Projects updated:", projectsArray.length)
    } catch (error) {
      console.error("[v0] Failed to fetch projects:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchProjects()
      // Load custom layout
      fetch("/api/gallery-layout")
        .then(res => {
          if (!res.ok) {
            console.warn("[v0] Layout API returned status:", res.status)
            return {}
          }
          return res.json()
        })
        .then(layout => {
          if (layout && typeof layout === "object") {
            console.log("[v0] Layout loaded:", Object.keys(layout).length, "items")
            setCustomLayout(layout)
          }
        })
        .catch(err => {
          console.warn("[v0] Failed to load layout:", err.message)
          setCustomLayout({})
        })
    }
  }, [mounted, fetchProjects])

  // Disable scroll when fullscreen is open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = "hidden"
      onFullscreenChange?.(true)
    } else {
      document.body.style.overflow = "unset"
      onFullscreenChange?.(false)
    }
    
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [selectedProject, onFullscreenChange])

  const handleImageLoad = (id: string) => {
    console.log("[v0] Image loaded:", id)
    setLoadedImages((prev) => new Set([...prev, id]))
  }

  const handleImageLoadWithDimensions = (id: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    const dimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight,
    }
    setImageDimensions((prev) => ({
      ...prev,
      [id]: dimensions,
    }))
    handleImageLoad(id)
  }

  const handleOpenProject = (project: Project, event?: React.MouseEvent) => {
    if (event && thumbRef.current) {
      const rect = thumbRef.current.getBoundingClientRect()
      setThumbRect(rect)
    }
    setSelectedProject(project)
    setCurrentImageIndex(0)
  }

  const handleCaseStudyClick = (projectIndex: number) => {
    router.push(`/projects/case-studies/${projectIndex}`)
  }

  const handleCloseModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setSelectedProject(null)
      setIsClosing(false)
      setThumbRect(null)
    }, 300)
  }

  const handleNextImage = () => {
    if (selectedProject) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedProject.images.length)
    }
  }

  const handlePrevImage = () => {
    if (selectedProject) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedProject.images.length) % selectedProject.images.length)
    }
  }

  // Calculate grid span based on aspect ratio or custom layout
  const getGridSpan = (projectId: string, id: string): string => {
    // Check custom layout first
    if (customLayout[projectId]) {
      const { colSpan, rowSpan } = customLayout[projectId]
      return `col-span-${colSpan} row-span-${rowSpan}`
    }

    // Fall back to aspect ratio-based sizing
    const dims = imageDimensions[id]
    if (!dims) return "col-span-1 row-span-1"
    
    const aspectRatio = dims.width / dims.height
    
    if (aspectRatio > 1.5) return "col-span-2 row-span-1"
    if (aspectRatio < 0.67) return "col-span-1 row-span-2"
    return "col-span-1 row-span-1"
  }

  if (!mounted) return null

  return (
    <>
      {/* Gallery Grid - Decrease opacity when fullscreen is open */}
      <div className={`transition-opacity duration-300 ${selectedProject ? "opacity-10 pointer-events-none" : "opacity-100"}`}>
        {isLoading ? (
          <div className="flex justify-center">
            <div className="space-y-8">
              {/* Case Study Skeleton */}
              <div className="rounded-2xl bg-accent/10 border animate-pulse h-96" />
              {/* Visual Projects Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-[300px]">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl bg-accent/10 border animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No projects found in this category</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-full space-y-6 sm:space-y-8">
              {/* Interactive Grid for ALL Projects (Case Studies + Visuals) */}
              {filteredProjects.length > 0 && (
                <InteractiveGalleryGrid
                  projects={filteredProjects}
                  currentLayout={customLayout}
                  onLayoutChange={setCustomLayout}
                  onProjectClick={(project) => {
                    if (project.tag === "Case Studies") {
                      const caseStudyIndex = filteredProjects.filter(p => p.tag === "Case Studies").findIndex(p => p.id === project.id)
                      router.push(`/projects/case-studies/${caseStudyIndex}`)
                    } else {
                      handleOpenProject(project)
                    }
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Viewer */}
      {selectedProject && (
        <>
          {/* Backdrop - Increased Opacity with Blur */}
          <div
            className={`fixed inset-0 z-40 bg-background/40 backdrop-blur-md transition-opacity duration-300 ${
              isClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={handleCloseModal}
          />

          {/* Viewer Container */}
          <div
            className={`fixed inset-0 z-50 flex flex-col transition-all duration-500 ${
              isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
            onClick={handleCloseModal}
          >
            {/* Header with Close Button */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
              <button
                onClick={handleCloseModal}
                className="btn-interactive p-3 rounded-full bg-background/60 backdrop-blur-md hover:bg-accent/20 group"
                aria-label="Close"
              >
                <X className="size-5 sm:size-6 text-foreground group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Title and Description - Top Center */}
            <div className="pt-6 sm:pt-8 lg:pt-10 px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-6">{selectedProject.title}</h2>
                {selectedProject.description && (
                  <p className="text-sm sm:text-base text-foreground/80">{selectedProject.description}</p>
                )}
              </div>
            </div>

            {/* Main Content - Centered Image */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
              <img
                src={
                  selectedProject.images[currentImageIndex].url ||
                  `/media/${selectedProject.images[currentImageIndex].filename}`
                }
                alt={selectedProject.title}
                className="max-w-[85vw] max-h-[60vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Footer - Navigation and Thumbnails */}
            <div className="flex flex-col items-center justify-center gap-4 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {/* Left Button */}
                {selectedProject.images.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePrevImage()
                    }}
                    className="btn-interactive p-3 rounded-full bg-background/60 backdrop-blur-md hover:bg-accent/20 group"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="size-5 sm:size-6 text-foreground group-hover:scale-110 transition-transform" />
                  </button>
                )}

                {/* Thumbnail Strip */}
                {selectedProject.images.length > 1 && (
                  <div className="flex gap-2 px-2 overflow-x-auto max-w-[60vw] scrollbar-hide">
                    {selectedProject.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentImageIndex(idx)
                        }}
                        className={`btn-interactive h-12 w-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                          idx === currentImageIndex ? "border-accent scale-110" : "border-border/50 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img.url || `/media/${img.filename}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Right Button */}
                {selectedProject.images.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNextImage()
                    }}
                    className="btn-interactive p-3 rounded-full bg-background/60 backdrop-blur-md hover:bg-accent/20 group"
                    aria-label="Next image"
                  >
                    <ChevronRight className="size-5 sm:size-6 text-foreground group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>

              {/* Image Counter */}
              {selectedProject.images.length > 1 && (
                <p className="text-xs sm:text-sm text-foreground/70">
                  {currentImageIndex + 1} / {selectedProject.images.length}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
