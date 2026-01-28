"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
  url?: string
}

export function ProjectGallery() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
    fetchMedia()

    // Listen for upload events
    const handleProjectUploaded = () => {
      fetchMedia()
    }
    window.addEventListener('projectUploaded', handleProjectUploaded)
    return () => window.removeEventListener('projectUploaded', handleProjectUploaded)
  }, [])

  const fetchMedia = async () => {
    try {
      const response = await fetch("/api/upload")
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setMedia(data.reverse())
        } else {
          setMedia([])
        }
      } else {
        setMedia([])
      }
    } catch (error) {
      console.error("Failed to fetch media:", error)
      setMedia([])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    if (!selectedItem) return
    const currentIndex = media.findIndex((item) => item.id === selectedItem.id)
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : media.length - 1
    setSelectedItem(media[previousIndex])
  }

  const handleNext = () => {
    const currentIndex = media.findIndex((item) => item.id === selectedItem?.id)
    const nextIndex = (currentIndex + 1) % media.length
    setSelectedItem(media[nextIndex])
  }

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set([...prev, id]))
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return
      if (e.key === "Escape") setSelectedItem(null)
      if (e.key === "ArrowLeft") handlePrevious()
      if (e.key === "ArrowRight") handleNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedItem, media])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading gallery...</div>
      </div>
    )
  }

  if (media.length === 0) {
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
            <div
              key={i}
              className="aspect-[4/3] rounded-2xl bg-accent/10 border border-border/50 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          {media.map((item, index) => {
            const isImageLoaded = loadedImages.has(item.id)
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-muted border border-border/50 transition-all duration-300 hover:border-accent hover:shadow-lg hover:shadow-accent/30"
                style={{ animationDelay: `${0.3 + index * 0.05}s` }}
              >
                {/* Loading State */}
                {!isImageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-accent/10 z-10">
                    <Loader2 className="size-6 text-muted-foreground animate-spin" />
                  </div>
                )}
                {/* Image */}
                <img
                  src={item.url || `/media/${item.filename}`}
                  alt={item.title}
                  loading="lazy"
                  onLoad={() => handleImageLoad(item.id)}
                  className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <h3 className="text-foreground font-semibold text-base sm:text-lg truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Image Viewer Popup */}
      {selectedItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-2xl transition-opacity duration-300 animate-fade-in"
            onClick={() => setSelectedItem(null)}
          />

          {/* Viewer */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 p-3 rounded-full bg-background/60 backdrop-blur-md border border-border/60 hover:bg-accent hover:border-accent transition-all duration-200 z-10 group"
              aria-label="Close"
            >
              <X className="size-5 sm:size-6 text-foreground group-hover:scale-110 transition-transform" />
            </button>

            {/* Navigation */}
            {media.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/60 backdrop-blur-md border border-border/60 hover:bg-accent hover:border-accent transition-all duration-200 z-10 group"
                  aria-label="Previous project"
                >
                  <ChevronLeft className="size-5 sm:size-6 text-foreground group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/60 backdrop-blur-md border border-border/60 hover:bg-accent hover:border-accent transition-all duration-200 z-10 group"
                  aria-label="Next project"
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
              {/* Left: Image */}
              <div className="flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-background/40 border border-border/30 min-h-[300px] lg:min-h-[500px]">
                <img
                  src={selectedItem.url || `/media/${selectedItem.filename}`}
                  alt={selectedItem.title}
                  className="max-w-full max-h-[60vh] lg:max-h-[75vh] object-contain p-4"
                />
              </div>

              {/* Right: Title and Description */}
              <div className="flex-1 flex flex-col justify-start lg:justify-center lg:sticky lg:top-0 py-4 lg:py-0">
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 lg:mb-6">{selectedItem.title}</h2>
                  {selectedItem.description && (
                    <div className="space-y-4">
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedItem.description}
                      </p>
                    </div>
                  )}
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setSelectedItem(null)}
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
