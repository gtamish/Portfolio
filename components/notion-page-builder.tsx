"use client"

import { useState, useRef, useEffect } from "react"
import { GripVertical, Plus, Trash2, Copy, Loader2, ChevronDown, Link as LinkIcon, Image as ImageIcon, Type, Grid, Figma, Lock, Edit2, X, AlertCircle, Check } from "lucide-react"
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

interface NotionPageBuilderProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
  onSave?: () => void
  isInline?: boolean
}

export function NotionPageBuilder({ isOpen, onClose, projectId, projectTitle, onSave, isInline = false }: NotionPageBuilderProps) {
  const [mounted, setMounted] = useState(false)
  const [passkey, setPasskey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  // Editor state
  const [blocks, setBlocks] = useState<CaseStudyBlock[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
  const dragOverIndex = useRef<number>(-1)

  useEffect(() => {
    setMounted(true)
    if (isInline) {
      // For inline mode, load directly without modal
      loadExistingContent()
    }
  }, [isInline])

  if (!mounted) return null
  
  // For inline mode, always show
  if (!isInline && !isOpen) return null
  
  // For modal mode, show authentication screen or editor
  const showModal = !isInline && isOpen

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
        // Load existing blocks
        await loadExistingContent()
      } else {
        setError("Invalid passkey")
      }
    } catch (err) {
      setError("Verification failed")
    } finally {
      setIsChecking(false)
    }
  }

  const loadExistingContent = async () => {
    try {
      const response = await fetch(`/api/case-study/${projectId}`)
      const data = await response.json()
      if (data.sections && Array.isArray(data.sections)) {
        // Convert old format to new block format if needed
        setBlocks(data.sections || [])
      }
    } catch (err) {
      console.log("[v0] No existing content found")
    }
  }

  const addBlock = (type: CaseStudyBlock["type"]) => {
    const newBlock: CaseStudyBlock = {
      id: Date.now().toString(),
      type,
      content: {},
      order: blocks.length,
    }
    setBlocks([...blocks, newBlock])
    setFocusedBlockId(newBlock.id)
  }

  const updateBlock = (id: string, content: Partial<CaseStudyBlock["content"]>) => {
    setBlocks(
      blocks.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b))
    )
  }

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id))
  }

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find((b) => b.id === id)
    if (!blockToDuplicate) return

    const newBlock: CaseStudyBlock = {
      ...blockToDuplicate,
      id: Date.now().toString(),
      order: blocks.length,
    }
    setBlocks([...blocks, newBlock])
  }

  const handleDragStart = (id: string) => {
    setDraggedBlockId(id)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOverIndex.current = index
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedBlockId) return

    const draggedIndex = blocks.findIndex((b) => b.id === draggedBlockId)
    const targetIndex = dragOverIndex.current

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return

    const newBlocks = [...blocks]
    const [draggedItem] = newBlocks.splice(draggedIndex, 1)
    newBlocks.splice(targetIndex, 0, draggedItem)

    setBlocks(newBlocks.map((b, i) => ({ ...b, order: i })))
    setDraggedBlockId(null)
    dragOverIndex.current = -1
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/case-study/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: blocks,
          projectTitle,
        }),
      })

      if (response.ok) {
        toast({ description: "Case study published successfully" })
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

  const blockTypeIcons: Record<CaseStudyBlock["type"], React.ReactNode> = {
    heading: <Type className="size-4" />,
    paragraph: <Type className="size-4" />,
    image: <ImageIcon className="size-4" />,
    gallery: <Grid className="size-4" />,
    divider: <div className="size-4 border-t-2 border-muted-foreground" />,
    link: <LinkIcon className="size-4" />,
    quote: <Type className="size-4" />,
    video: <Figma className="size-4" />,
  }

  return (
    <>
      {isInline ? (
        /* Inline Editor Mode */
        <div className="min-h-screen bg-background pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-background rounded-xl border border-border/20">
              {/* Header */}
              <div className="sticky top-24 z-10 bg-background border-b border-border/20 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Page Builder</h2>
                  <p className="text-sm text-muted-foreground">{projectTitle}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                  title="Exit edit mode"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {!isAuthenticated ? (
                  /* Already authenticated for inline, just show editor */
                  null
                ) : (
                  /* Editor Blocks */
                  <div className="max-w-2xl space-y-4">
                    {blocks.map((block, idx) => (
                      <div
                        key={block.id}
                        onMouseEnter={() => setSelectedBlockId(block.id)}
                        onMouseLeave={() => setSelectedBlockId(null)}
                        className={`group relative p-4 rounded-lg border-2 transition-colors ${
                          selectedBlockId === block.id
                            ? "border-accent/50 bg-accent/5"
                            : "border-border/20 hover:border-border/40"
                        }`}
                      >
                        {/* Block Controls */}
                        <div className="absolute -left-12 top-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            draggable
                            onDragStart={() => setDraggedBlockId(block.id)}
                            className="p-1.5 rounded hover:bg-accent/10 cursor-grab"
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
                            onClick={() => deleteBlock(block.id)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        {/* Block Type and Content */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">{block.type}</span>
                          </div>

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
                                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border/30">
                                  <img
                                    src={block.content.url}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={() => console.log("[v0] Image failed to load")}
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

                          {block.type === "divider" && (
                            <div className="py-2 text-xs text-muted-foreground text-center">Divider line</div>
                          )}

                          {block.type === "video" && (
                            <input
                              type="text"
                              placeholder="Figma embed URL"
                              value={block.content.url || ""}
                              onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
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

                    {/* Add Block Buttons */}
                    <div className="mt-8 pt-4 border-t border-border/20 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Add Block</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border/20 bg-background/50 px-6 py-4 flex gap-3 justify-end rounded-b-xl">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-border/30 hover:bg-accent/10 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="size-4 animate-spin" />}
                  <Check className="size-4" />
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Modal Mode */
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/20 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Page Builder</h2>
            <p className="text-sm text-muted-foreground">{projectTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isAuthenticated ? (
            /* Authentication Form */
            <form onSubmit={handlePasskeySubmit} className="max-w-md mx-auto space-y-4 py-8">
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
            /* Page Builder */
            <div className="max-w-2xl mx-auto space-y-2">
              {blocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-4">Start building your page by adding blocks below</p>
                </div>
              ) : (
                blocks.map((block, index) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(block.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={handleDrop}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`group relative px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedBlockId === block.id
                        ? "border-accent bg-accent/5"
                        : "border-transparent hover:border-border/50 hover:bg-background/50"
                    }`}
                  >
                    {/* Drag Handle & Controls */}
                    <div className="flex items-start gap-2 mb-2">
                      <GripVertical className="size-4 text-muted-foreground mt-1 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs font-medium bg-accent/20 text-accent px-2 py-1 rounded-full capitalize flex items-center gap-1">
                          {blockTypeIcons[block.type]}
                          {block.type}
                        </span>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateBlock(block.id)
                          }}
                          className="p-1.5 hover:bg-accent/20 rounded text-muted-foreground hover:text-accent transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeBlock(block.id)
                          }}
                          className="p-1.5 hover:bg-red-500/20 rounded text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Block Content Editor */}
                    <div className="space-y-2 ml-6">
                      {block.type === "heading" && (
                        <input
                          type="text"
                          placeholder="Add heading..."
                          value={block.content.text || ""}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          onFocus={() => setFocusedBlockId(block.id)}
                          className="w-full text-lg font-bold bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                      )}

                      {block.type === "paragraph" && (
                        <textarea
                          placeholder="Add text..."
                          value={block.content.text || ""}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          onFocus={() => setFocusedBlockId(block.id)}
                          className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                          rows={3}
                        />
                      )}

                      {block.type === "image" && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Image URL"
                            value={block.content.url || ""}
                            onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                          />
                          <input
                            type="text"
                            placeholder="Image caption (optional)"
                            value={block.content.caption || ""}
                            onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                          />
                          {block.content.url && (
                            <div className="rounded-lg overflow-hidden border border-border/20 h-48 bg-background/50">
                              <img
                                src={block.content.url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={() => console.log("[v0] Image failed to load")}
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

                      {block.type === "divider" && (
                        <div className="py-2 text-xs text-muted-foreground text-center">Divider line</div>
                      )}

                      {block.type === "video" && (
                        <input
                          type="text"
                          placeholder="Figma embed URL"
                          value={block.content.url || ""}
                          onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
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
                ))
              )}

              {/* Add Block Buttons */}
              <div className="sticky bottom-0 mt-6 pt-4 border-t border-border/20 bg-background/95 backdrop-blur-sm rounded-lg p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Add Block</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
            </div>
          )}
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="border-t border-border/20 bg-background px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border/30 hover:bg-accent/10 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              <Check className="size-4" />
              Publish
            </button>
          </div>
        )}
      </div>
        </div>
      )}
    </>
  )
}
