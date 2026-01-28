"use client"

import { useState, useRef } from "react"
import { ChevronDown, ChevronUp, Trash2, GripVertical, Edit2, Plus } from "lucide-react"

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

interface ImageEditPanelProps {
  projectId: string
  images: MediaItem[]
  onUpdateImage: (projectId: string, imageId: string, updates: Partial<MediaItem>) => void
  onDeleteImage: (projectId: string, imageId: string) => void
  onReorderImages: (projectId: string, fromIndex: number, toIndex: number) => void
  onAddImages?: (projectId: string, files: File[]) => Promise<void>
}

export function ImageEditPanel({
  projectId,
  images,
  onUpdateImage,
  onDeleteImage,
  onReorderImages,
  onAddImages,
}: ImageEditPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || !onAddImages) return

    const imageFiles = Array.from(files).filter(file => file.type.startsWith("image/"))
    if (imageFiles.length === 0) return

    try {
      setIsUploading(true)
      await onAddImages(projectId, imageFiles)
    } catch (error) {
      console.error("[v0] Error adding images:", error)
    } finally {
      setIsUploading(false)
      e.currentTarget.value = ""
    }
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="btn-interactive w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-muted-foreground hover:text-foreground"
      >
        <div className="flex items-center gap-2">
          <Edit2 className="size-4" strokeWidth={1.5} />
          <span>Edit Images ({images.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="size-4" strokeWidth={1.5} />
        ) : (
          <ChevronDown className="size-4" strokeWidth={1.5} />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 bg-white/5 rounded-lg p-3 max-h-[400px] overflow-y-auto">
          {/* Add Images Button */}
          {onAddImages && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-accent/10 hover:bg-accent/20 disabled:opacity-50 border border-dashed border-accent/50 rounded-lg transition-colors text-sm text-accent font-medium"
            >
              {isUploading ? (
                <>
                  <div className="size-3 border border-accent border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="size-4" strokeWidth={2} />
                  Add Images
                </>
              )}
            </button>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />

          {/* Images List */}
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => setDraggedImageIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedImageIndex !== null && draggedImageIndex !== index) {
                  onReorderImages(projectId, draggedImageIndex, index)
                  setDraggedImageIndex(null)
                }
              }}
              className="group p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all space-y-2 cursor-move"
            >
              {/* Image Preview and Reorder Handle */}
              <div className="flex items-start gap-2">
                <GripVertical className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                {image.url && (
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground/70 truncate">{image.filename}</p>
                </div>
                <button
                  onClick={() => onDeleteImage(projectId, image.id)}
                  className="btn-interactive flex-shrink-0 p-1.5 rounded text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Delete image"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Image Title Input */}
              <input
                type="text"
                value={image.title}
                onChange={(e) =>
                  onUpdateImage(projectId, image.id, { title: e.target.value })
                }
                className="w-full text-xs bg-white/5 border border-white/10 rounded px-2 py-1.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
                placeholder="Image title"
              />

              {/* Image Description Input */}
              <textarea
                value={image.description}
                onChange={(e) =>
                  onUpdateImage(projectId, image.id, { description: e.target.value })
                }
                className="w-full text-xs bg-white/5 border border-white/10 rounded px-2 py-1.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors resize-none"
                placeholder="Image description (optional)"
                rows={2}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
