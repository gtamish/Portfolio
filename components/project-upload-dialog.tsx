"use client"

import { useState } from "react"
import { X, Plus, Trash2, Eye } from "lucide-react"

interface StagedImage {
  file: File
  id: string
  preview: string
}

interface ProjectUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (data: { title: string; description: string; tag: "Visuals" | "Case Studies"; images: StagedImage[] }) => Promise<void>
  isUploading: boolean
}

export function ProjectUploadDialog({ isOpen, onClose, onUpload, isUploading }: ProjectUploadDialogProps) {
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tag, setTag] = useState<"Visuals" | "Case Studies">("Visuals")
  const [previewImage, setPreviewImage] = useState<StagedImage | null>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file)
        setStagedImages(prev => [...prev, {
          file,
          id: Date.now().toString() + Math.random(),
          preview
        }])
      }
    })
    e.currentTarget.value = ""
  }

  const removeImage = (id: string) => {
    setStagedImages(prev => {
      const updated = prev.filter(img => img.id !== id)
      if (previewImage?.id === id) setPreviewImage(null)
      return updated
    })
  }

  const handleSubmit = async () => {
    if (!title.trim() || stagedImages.length === 0) return

    try {
      await onUpload({ title: title.trim(), description: description.trim(), tag, images: stagedImages })
      
      // Reset form
      setStagedImages([])
      setTitle("")
      setDescription("")
      setTag("Visuals")
      setPreviewImage(null)
    } catch (error) {
      console.error("[v0] Upload error:", error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 backdrop-overlay" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-white/5">
          <h2 className="text-xl font-bold text-foreground">Upload New Project</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent/20 rounded-lg transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Project Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
              className="w-full px-4 py-2 rounded-lg bg-background/40 border border-white/10 dark:border-white/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Project Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-background/40 border border-white/10 dark:border-white/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Tag Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Project Type</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value as "Visuals" | "Case Studies")}
              className="w-full px-4 py-2 rounded-lg bg-background/40 border border-white/10 dark:border-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="Visuals">Visuals</option>
              <option value="Case Studies">Case Studies</option>
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Project Images ({stagedImages.length})
            </label>
            
            {/* Preview */}
            {previewImage && (
              <div className="mb-4 rounded-lg overflow-hidden bg-background/40 p-2">
                <img
                  src={previewImage.preview}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded"
                />
              </div>
            )}

            {/* Upload Zone */}
            <label className="block relative border-2 border-dashed border-accent/30 hover:border-accent/50 rounded-lg p-8 text-center cursor-pointer transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="sr-only"
              />
              <div className="space-y-2">
                <Plus className="size-8 text-accent mx-auto" />
                <div>
                  <p className="text-sm font-medium text-foreground">Click to upload or drag images</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each</p>
                </div>
              </div>
            </label>

            {/* Image Grid */}
            {stagedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {stagedImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.preview}
                      alt="Staged"
                      className={`w-full h-20 object-cover rounded cursor-pointer transition-opacity ${
                        previewImage?.id === img.id ? "ring-2 ring-accent" : ""
                      }`}
                      onClick={() => setPreviewImage(img)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded flex items-center justify-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(img.id)
                        }}
                        className="p-1 bg-destructive rounded hover:bg-destructive/80"
                      >
                        <Trash2 className="size-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 dark:border-white/5 p-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-4 py-3 rounded-lg bg-background/40 hover:bg-accent/20 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || stagedImages.length === 0 || isUploading}
            className="flex-1 px-4 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload Project"}
          </button>
        </div>
      </div>
    </div>
  )
}
