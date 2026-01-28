"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
}

export function ProjectGallery() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchMedia()
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
    if (!selectedItem) return
    const currentIndex = media.findIndex((item) => item.id === selectedItem.id)
    const nextIndex = currentIndex < media.length - 1 ? currentIndex + 1 : 0
    setSelectedItem(media[nextIndex])
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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-accent/50 flex items-center justify-center mb-4">
          <svg className="size-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-muted-foreground">No projects uploaded yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Use the upload button to add your first project</p>
      </div>
    )
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        {media.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer bg-accent/30"
          >
            <img
              src={`/media/${item.filename}`}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-foreground font-medium text-lg truncate">{item.title}</h3>
                {item.description && (
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{item.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Viewer Popup */}
      {selectedItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-background/90 backdrop-blur-xl transition-opacity"
            onClick={() => setSelectedItem(null)}
          />

          {/* Viewer */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-accent transition-colors z-10"
            >
              <X className="size-5 text-foreground" />
            </button>

            {/* Navigation */}
            {media.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-6 p-3 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-accent transition-colors z-10"
                >
                  <ChevronLeft className="size-5 text-foreground" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-6 p-3 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-accent transition-colors z-10"
                >
                  <ChevronRight className="size-5 text-foreground" />
                </button>
              </>
            )}

            {/* Content */}
            <div
              className="relative max-w-5xl w-full max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title and Description */}
              <div className="mb-4 text-center">
                <h2 className="text-2xl font-semibold text-foreground">{selectedItem.title}</h2>
                {selectedItem.description && (
                  <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{selectedItem.description}</p>
                )}
              </div>

              {/* Image */}
              <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl">
                <img
                  src={`/media/${selectedItem.filename}`}
                  alt={selectedItem.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
