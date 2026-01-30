"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Edit2, X, Save, Trash2, Copy, ChevronUp, ChevronDown } from "lucide-react"
import { useTheme } from "next-themes"
import { createSlug } from "@/lib/slug"

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
  tag?: "Visuals" | "Case Studies"
  featured?: boolean
}

interface CaseStudyBlock {
  id: string
  type: "heading" | "paragraph" | "image" | "gallery" | "divider" | "link" | "quote" | "video"
  content: {
    text?: string
    url?: string
    images?: string[]
    caption?: string
  }
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Editor state
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editImages, setEditImages] = useState<MediaItem[]>([])
  const [blocks, setBlocks] = useState<CaseStudyBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [newImageUrl, setNewImageUrl] = useState("")

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/upload")
        if (!response.ok) throw new Error("Failed to fetch projects")
        
        const data = await response.json()
        if (!Array.isArray(data)) return

        let foundProject: Project | null = null
        
        if (data.length > 0 && 'images' in data[0]) {
          foundProject = data.find((p: Project) => createSlug(p.title) === params.slug) || null
        } else {
          const groupedByProject: { [key: string]: MediaItem[] } = {}
          data.forEach((item: MediaItem) => {
            const projectName = item.title || "Untitled"
            if (!groupedByProject[projectName]) {
              groupedByProject[projectName] = []
            }
            groupedByProject[projectName].push(item)
          })

          for (const [title, images] of Object.entries(groupedByProject)) {
            if (createSlug(title) === params.slug) {
              foundProject = {
                id: images[0].id,
                title,
                description: images[0].description || "",
                images,
                tag: images[0].tag,
                featured: images[0].featured,
              }
              break
            }
          }
        }

        if (foundProject) {
          setProject(foundProject)
          setEditTitle(foundProject.title)
          setEditDescription(foundProject.description)
          setEditImages(foundProject.images)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch project:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [params.slug])

  const handleImageLoad = (imageId: string) => {
    setLoadedImages(prev => new Set([...prev, imageId]))
  }

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const addBlock = (type: CaseStudyBlock["type"]) => {
    const newBlock: CaseStudyBlock = {
      id: generateId(),
      type,
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
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }

  const duplicateBlock = (blockId: string) => {
    const blockToDuplicate = blocks.find(b => b.id === blockId)
    if (!blockToDuplicate) return
    const newBlock: CaseStudyBlock = { ...blockToDuplicate, id: generateId() }
    setBlocks([...blocks, newBlock])
  }

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const index = blocks.findIndex(b => b.id === blockId)
    if ((direction === "up" && index === 0) || (direction === "down" && index === blocks.length - 1)) return
    
    const newBlocks = [...blocks]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
    setBlocks(newBlocks)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        images: editImages,
        blocks: blocks,
        projectId: project?.id
      }
      
      const response = await fetch("/api/case-study/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        alert("Case study saved successfully!")
        setIsEditMode(false)
        if (project) {
          setProject({
            ...project,
            title: editTitle,
            description: editDescription,
            images: editImages
          })
        }
      } else {
        alert("Failed to save case study")
      }
    } catch (error) {
      console.error("[v0] Save error:", error)
      alert("Error saving case study")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">Case Study Not Found</h1>
        <Link href="/projects" className="text-accent hover:underline">← Back to Projects</Link>
      </div>
    )
  }

  const blockTypeIcons: Record<CaseStudyBlock["type"], string> = {
    heading: "H", paragraph: "¶", image: "📷", gallery: "🖼",
    divider: "—", link: "🔗", quote: '"', video: "▶",
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {isEditMode ? (
            <span className="text-accent font-medium text-sm">Edit Mode - Changes appear in real time</span>
          ) : (
            <Link href="/projects" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium">
              <ArrowLeft className="size-4" />
              <span>Back to Projects</span>
            </Link>
          )}

          <div className="flex items-center gap-3">
            {isEditMode && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  <Save className="size-4" />
                  {isSaving ? "Saving..." : "Publish"}
                </button>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 text-accent transition-colors"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <button
                onClick={async () => {
                  const passkey = prompt("Enter passkey to edit:")
                  if (passkey) {
                    setIsAuthenticating(true)
                    try {
                      const response = await fetch("/api/verify-passkey", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ passkey }),
                      })
                      if (response.ok) {
                        setIsEditMode(true)
                      } else {
                        alert("Invalid passkey")
                      }
                    } catch (err) {
                      alert("Error verifying passkey")
                    } finally {
                      setIsAuthenticating(false)
                    }
                  }
                }}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 text-accent transition-colors disabled:opacity-50"
              >
                <Edit2 className="size-4" />
                <span className="hidden sm:inline text-sm font-medium">Edit</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {isEditMode ? (
        /* Split-View Editor */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[calc(100vh-80px)]">
          {/* Editor Panel */}
          <div className="overflow-y-auto border-r border-border/20 bg-muted/30 p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Hero Images ({editImages.length})</label>
              <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                {editImages.slice(0, 3).map((img, idx) => (
                  <div key={img.id} className="flex items-center justify-between p-2 rounded bg-background border border-border/20 text-sm">
                    <span className="truncate text-foreground/70">{idx + 1}. {img.filename}</span>
                    <button onClick={() => setEditImages(editImages.filter(i => i.id !== img.id))} className="text-red-500 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border/20 pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Content Blocks ({blocks.length})</h3>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {blocks.map((block, idx) => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedBlockId === block.id ? "border-accent bg-accent/10" : "border-border/20 hover:border-border/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{blockTypeIcons[block.type]}</span>
                        <span className="text-xs font-medium text-foreground/70 capitalize">{block.type}</span>
                        {block.content.text && <span className="text-xs text-foreground/50 truncate">{block.content.text.substring(0, 15)}</span>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "up") }} className="p-1 hover:bg-accent/20 rounded" title="Move up">
                          <ChevronUp className="size-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "down") }} className="p-1 hover:bg-accent/20 rounded" title="Move down">
                          <ChevronDown className="size-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id) }} className="p-1 hover:bg-accent/20 rounded" title="Duplicate">
                          <Copy className="size-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id) }} className="p-1 hover:bg-red-500/20 text-red-500 rounded" title="Delete">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedBlockId && blocks.find(b => b.id === selectedBlockId) && (
                <div className="bg-background p-4 rounded-lg border border-border/20 space-y-2">
                  {(() => {
                    const block = blocks.find(b => b.id === selectedBlockId)!
                    if (block.type === "heading" || block.type === "paragraph") {
                      return (
                        <textarea
                          value={block.content.text || ""}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          placeholder={`Add ${block.type}...`}
                          className="w-full px-3 py-2 rounded border border-border/30 bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                          rows={3}
                        />
                      )
                    }
                    if (block.type === "image") {
                      return (
                        <input
                          type="url"
                          value={block.content.url || ""}
                          onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                          placeholder="Image URL"
                          className="w-full px-3 py-2 rounded border border-border/30 bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      )
                    }
                    if (block.type === "link") {
                      return (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={block.content.text || ""}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                            placeholder="Link text"
                            className="w-full px-3 py-2 rounded border border-border/30 bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                          />
                          <input
                            type="url"
                            value={block.content.url || ""}
                            onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                            placeholder="URL"
                            className="w-full px-3 py-2 rounded border border-border/30 bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                          />
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 mt-4">
                {(["heading", "paragraph", "image", "gallery", "link", "quote", "divider", "video"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    className="py-2 rounded text-xs font-medium border border-border/30 hover:bg-accent/10 transition-colors"
                    title={`Add ${type}`}
                  >
                    {blockTypeIcons[type]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="overflow-y-auto bg-background p-6 sm:p-8 lg:p-12">
            <div className="max-w-3xl mx-auto">
              {project.featured && (
                <div className="inline-block mb-6 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg bg-gradient-to-r from-accent to-accent/80">
                  Featured Case Study
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight text-balance">
                {editTitle || "Untitled"}
              </h1>

              {editDescription && (
                <p className="text-base sm:text-lg text-foreground/80 leading-relaxed mb-12">
                  {editDescription}
                </p>
              )}

              {editImages.length > 0 && (
                <div className="rounded-2xl overflow-hidden bg-muted mb-12">
                  <img
                    src={editImages[0].url || `/media/${editImages[0].filename}`}
                    alt={editTitle}
                    className="w-full h-auto object-cover max-h-[500px]"
                  />
                </div>
              )}

              <div className="space-y-8">
                {blocks.map((block) => (
                  <div key={block.id}>
                    {block.type === "heading" && <h2 className="text-3xl font-bold text-foreground">{block.content.text}</h2>}
                    {block.type === "paragraph" && <p className="text-foreground/80 leading-relaxed">{block.content.text}</p>}
                    {block.type === "image" && block.content.url && <img src={block.content.url} alt="Content" className="w-full h-auto rounded-lg" />}
                    {block.type === "link" && block.content.url && (
                      <a href={block.content.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {block.content.text || block.content.url}
                      </a>
                    )}
                    {block.type === "quote" && <blockquote className="border-l-4 border-accent pl-4 italic text-foreground/70">{block.content.text}</blockquote>}
                    {block.type === "divider" && <hr className="border-border/20 my-8" />}
                  </div>
                ))}
              </div>

              {editImages.length > 1 && (
                <div className="mt-12 pt-12 border-t border-border/20">
                  <h2 className="text-2xl font-bold text-foreground mb-8">Project Details</h2>
                  <div className="space-y-8">
                    {editImages.slice(1).map((img) => (
                      <div key={img.id} className="rounded-lg overflow-hidden bg-muted">
                        <img src={img.url || `/media/${img.filename}`} alt={img.title} className="w-full h-auto object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Normal View */
        <>
          <section className="relative pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {project?.featured && (
                <div className="inline-block mb-6 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg bg-gradient-to-r from-accent to-accent/80">
                  Featured Case Study
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight text-balance">
                {project?.title}
              </h1>

              {project?.description && (
                <p className="text-base sm:text-lg lg:text-xl text-foreground/80 leading-relaxed max-w-3xl mb-12">
                  {project.description}
                </p>
              )}

              {project && project.images.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden bg-muted mb-12">
                  <div className={`relative w-full transition-opacity duration-300 ${loadedImages.has(project.images[0].id) ? "opacity-100" : "opacity-0"}`}>
                    <img
                      src={project.images[0].url || `/media/${project.images[0].filename}`}
                      alt={project.title}
                      onLoad={() => handleImageLoad(project.images[0].id)}
                      className="w-full h-auto object-contain max-h-[600px]"
                    />
                  </div>
                  {!loadedImages.has(project.images[0].id) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="size-8 text-accent animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {project && project.images.length > 1 && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Project Details</h2>
                    <div className="grid gap-8">
                      {project.images.slice(1).map((image, idx) => (
                        <div key={image.id} className="group relative rounded-xl overflow-hidden bg-muted">
                          <div className={`relative w-full transition-opacity duration-300 ${loadedImages.has(image.id) ? "opacity-100" : "opacity-0"}`}>
                            <img
                              src={image.url || `/media/${image.filename}`}
                              alt={`${project.title} - Detail ${idx + 2}`}
                              onLoad={() => handleImageLoad(image.id)}
                              className="w-full h-auto object-contain"
                            />
                          </div>
                          {!loadedImages.has(image.id) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="size-6 text-accent animate-spin" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-16 pt-12 border-t border-border/20">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div>
                    <p className="text-foreground/70 text-sm mb-2">Ready to see more projects?</p>
                    <h3 className="text-lg font-semibold text-foreground">Explore More Work</h3>
                  </div>
                  <Link href="/projects" className="btn-interactive px-6 py-3 rounded-full bg-accent text-background font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                    Back to Gallery
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
