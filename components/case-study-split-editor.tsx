"use client"

import { useState, useRef, useCallback } from "react"
import { GripVertical, Trash2, Copy, Loader2, Link as LinkIcon, Image as ImageIcon, Type, Grid, Figma, X, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CaseStudyBlock {
  id: string
  type: "heading" | "paragraph" | "image" | "gallery" | "divider" | "link" | "quote" | "video"
  content: {
    text?: string
    url?: string
    images?: string[]
    caption?: string
  }
  order: number
}

interface CaseStudySplitEditorProps {
  projectId: string
  projectTitle: string
  projectDescription: string
  initialImages: Array<{ id: string; url?: string; filename: string }>
  onClose: () => void
}

const blockTypeIcons: Record<CaseStudyBlock["type"], React.ReactNode> = {
  heading: <Type className="size-4" />,
  paragraph: <Type className="size-4" />,
  image: <ImageIcon className="size-4" />,
  gallery: <Grid className="size-4" />,
  link: <LinkIcon className="size-4" />,
  quote: <Type className="size-4" />,
  divider: <div className="size-4 border-t" />,
  video: <Figma className="size-4" />,
}

export function CaseStudySplitEditor({ projectId, projectTitle, projectDescription, initialImages, onClose }: CaseStudySplitEditorProps) {
  const [blocks, setBlocks] = useState<CaseStudyBlock[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const dragOverIndex = useRef<number>(-1)
  const { toast } = useToast()

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const addBlock = (type: CaseStudyBlock["type"]) => {
    const newBlock: CaseStudyBlock = {
      id: generateId(),
      type,
      order: blocks.length,
      content: { text: "", url: "", images: [] },
    }
    setBlocks([...blocks, newBlock])
    setSelectedBlockId(newBlock.id)
  }

  const updateBlock = (blockId: string, updates: Partial<CaseStudyBlock["content"]>) => {
    setBlocks(blocks.map(b => 
      b.id === blockId ? { ...b, content: { ...b.content, ...updates } } : b
    ))
  }

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId))
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null)
    }
  }

  const duplicateBlock = (blockId: string) => {
    const blockToDuplicate = blocks.find(b => b.id === blockId)
    if (!blockToDuplicate) return
    const newBlock: CaseStudyBlock = {
      ...blockToDuplicate,
      id: generateId(),
      order: blocks.length,
    }
    setBlocks([...blocks, newBlock])
  }

  const handleDragStart = (blockId: string) => {
    setDraggedBlockId(blockId)
  }

  const handleDragOver = (index: number) => {
    dragOverIndex.current = index
  }

  const handleDrop = () => {
    if (!draggedBlockId) return
    const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId)
    const targetIndex = dragOverIndex.current
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedBlockId(null)
      return
    }
    const newBlocks = [...blocks]
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1)
    newBlocks.splice(targetIndex, 0, draggedBlock)
    newBlocks.forEach((b, idx) => (b.order = idx))
    setBlocks(newBlocks)
    setDraggedBlockId(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/case-study/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: blocks }),
      })
      if (response.ok) {
        toast({
          title: "Saved",
          description: "Case study content saved successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to save case study",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Save error:", error)
      toast({
        title: "Error",
        description: "Failed to save case study",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background grid grid-cols-1 lg:grid-cols-2">
      {/* Editor Panel */}
      <div className="lg:border-r border-border/20 p-6 lg:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-2xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Edit Content</h2>
              <p className="text-sm text-muted-foreground mt-1">{projectTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
              title="Close editor"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {blocks.map((block, idx) => (
              <div
                key={block.id}
                draggable
                onDragStart={() => handleDragStart(block.id)}
                onDragOver={() => handleDragOver(idx)}
                onDrop={handleDrop}
                onMouseEnter={() => setSelectedBlockId(block.id)}
                onMouseLeave={() => setSelectedBlockId(null)}
                className={`group relative p-4 rounded-lg border-2 transition-colors ${
                  selectedBlockId === block.id
                    ? "border-accent/50 bg-accent/5"
                    : "border-border/20 hover:border-border/40"
                } ${draggedBlockId === block.id ? "opacity-50" : ""}`}
              >
                <div className="absolute -left-10 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    draggable
                    className="p-1 rounded cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <GripVertical className="size-4" />
                  </button>
                </div>

                <div className="absolute -right-12 top-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="p-1.5 rounded hover:bg-accent/10"
                    title="Duplicate"
                  >
                    <Copy className="size-4" />
                  </button>
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {blockTypeIcons[block.type]}
                  <span className="text-xs font-semibold text-muted-foreground uppercase">{block.type}</span>
                </div>

                <div className="space-y-3">
                  {block.type === "heading" && (
                    <input
                      type="text"
                      placeholder="Add heading..."
                      value={block.content.text || ""}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-lg font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  )}

                  {block.type === "paragraph" && (
                    <textarea
                      placeholder="Add content..."
                      value={block.content.text || ""}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                      rows={3}
                    />
                  )}

                  {block.type === "image" && (
                    <div className="space-y-2">
                      <input
                        type="url"
                        placeholder="Image URL"
                        value={block.content.url || ""}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      {block.content.url && (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border/30">
                          <img
                            src={block.content.url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {block.type === "link" && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Link text"
                        value={block.content.text || ""}
                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={block.content.url || ""}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                  )}

                  {block.type === "quote" && (
                    <textarea
                      placeholder="Add quote..."
                      value={block.content.text || ""}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border-l-4 border-accent bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none resize-none italic"
                      rows={2}
                    />
                  )}

                  {block.type === "gallery" && (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Paste image URLs, one per line"
                        value={block.content.images?.join("\n") || ""}
                        onChange={(e) => updateBlock(block.id, { images: e.target.value.split("\n").filter(u => u.trim()) })}
                        className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 mb-8">
            <p className="text-xs font-medium text-muted-foreground uppercase">Add Block</p>
            <div className="grid grid-cols-2 gap-2">
              {(["heading", "paragraph", "image", "gallery", "link", "quote", "divider", "video"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="px-3 py-2 rounded-lg border border-border/30 hover:bg-accent/10 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  {blockTypeIcons[type]}
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            <Save className="size-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="p-6 lg:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block mb-6">
            <div className="px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold">
              Case Study
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight">
            {projectTitle}
          </h1>

          {projectDescription && (
            <p className="text-base text-foreground/80 leading-relaxed mb-12">
              {projectDescription}
            </p>
          )}

          {initialImages.length > 0 && (
            <div className="relative rounded-2xl overflow-hidden bg-muted mb-12">
              <img
                src={initialImages[0].url || `/media/${initialImages[0].filename}`}
                alt={projectTitle}
                className="w-full h-auto object-contain max-h-[400px]"
              />
            </div>
          )}

          <div className="space-y-8">
            {blocks.map((block) => (
              <div key={block.id} className="space-y-4">
                {block.type === "heading" && block.content.text && (
                  <h2 className="text-2xl font-bold text-foreground">{block.content.text}</h2>
                )}

                {block.type === "paragraph" && block.content.text && (
                  <p className="text-base text-foreground/80 leading-relaxed">{block.content.text}</p>
                )}

                {block.type === "image" && block.content.url && (
                  <div className="relative rounded-xl overflow-hidden bg-muted">
                    <img
                      src={block.content.url}
                      alt="Content"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}

                {block.type === "link" && block.content.url && block.content.text && (
                  <a
                    href={block.content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-accent hover:underline font-medium"
                  >
                    {block.content.text}
                    <LinkIcon className="size-4" />
                  </a>
                )}

                {block.type === "quote" && block.content.text && (
                  <blockquote className="border-l-4 border-accent pl-4 italic text-foreground/70">
                    "{block.content.text}"
                  </blockquote>
                )}

                {block.type === "divider" && (
                  <div className="my-8 border-t border-border/20" />
                )}

                {block.type === "gallery" && block.content.images && block.content.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {block.content.images.map((url, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden bg-muted">
                        <img
                          src={url}
                          alt={`Gallery ${idx}`}
                          className="w-full h-auto object-cover aspect-square"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {blocks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No content blocks yet. Add some to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
