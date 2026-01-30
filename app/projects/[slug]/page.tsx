'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Edit2, X, Save, Plus, Trash2, Copy, Move, GripVertical } from 'lucide-react'
import { createSlug } from '@/lib/slug'

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
  url?: string
  tag?: 'Visuals' | 'Case Studies'
  featured?: boolean
}

interface Project {
  id: string
  title: string
  description: string
  images: MediaItem[]
  tag?: 'Visuals' | 'Case Studies'
  featured?: boolean
}

interface ContentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'image' | 'divider'
  content: {
    text?: string
    url?: string
  }
  order: number
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/upload')
        if (!response.ok) throw new Error('Failed to fetch projects')

        const data = await response.json()

        let foundProject: Project | null = null

        if (data.length > 0 && 'images' in data[0]) {
          foundProject = data.find((p: Project) => createSlug(p.title) === params.slug) || null
        } else {
          const groupedByProject: { [key: string]: MediaItem[] } = {}
          data.forEach((item: MediaItem) => {
            const projectName = item.title || 'Untitled'
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
                description: images[0].description || '',
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
        }
      } catch (error) {
        console.error('[v0] Failed to fetch project:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [params.slug])

  const handleAddBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: { text: '', url: '' },
      order: blocks.length,
    }
    setBlocks([...blocks, newBlock])
    setSelectedBlockId(newBlock.id)
  }

  const handleUpdateBlock = (blockId: string, updates: Partial<ContentBlock['content']>) => {
    setBlocks(blocks.map(b => (b.id === blockId ? { ...b, content: { ...b.content, ...updates } } : b)))
  }

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId))
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/case-study/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          blocks,
          projectId: project?.id,
        }),
      })

      if (response.ok) {
        alert('Case study saved successfully!')
        setIsEditMode(false)
      } else {
        alert('Failed to save case study')
      }
    } catch (error) {
      console.error('[v0] Save error:', error)
      alert('Error saving case study')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 text-accent animate-spin" />
      </main>
    )
  }

  if (!project) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">Case Study Not Found</h1>
        <Link href="/projects" className="text-accent hover:underline">
          Back to Projects
        </Link>
      </main>
    )
  }

  if (isEditMode) {
    return (
      <main className="min-h-screen bg-background">
        <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/20">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <span className="text-accent font-medium text-sm">Edit Mode - Real-time editing</span>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                <Save className="size-4" />
                {isSaving ? 'Saving...' : 'Publish'}
              </button>
              <button
                onClick={() => setIsEditMode(false)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 text-accent transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </nav>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Metadata Editing */}
            <div className="mb-12 pb-8 border-b border-border/20">
              <div className="mb-6">
                <label className="block text-xs font-semibold text-foreground/60 mb-2">TITLE</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-4xl font-bold text-foreground bg-transparent border-b-2 border-accent/20 focus:border-accent pb-2 focus:outline-none transition-colors"
                  placeholder="Case Study Title"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 mb-2">DESCRIPTION</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-lg text-foreground/80 bg-transparent border-b-2 border-accent/20 focus:border-accent pb-2 focus:outline-none transition-colors resize-none"
                  placeholder="Project description..."
                  rows={3}
                />
              </div>
            </div>

            {/* Content Blocks */}
            <div className="space-y-4 mb-8">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className={`group p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedBlockId === block.id ? 'border-accent bg-accent/5' : 'border-border/30 hover:border-border/60'
                  }`}
                  onClick={() => setSelectedBlockId(block.id)}
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="size-4 text-foreground/40 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {block.type === 'heading' && (
                        <input
                          type="text"
                          value={block.content.text || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-xl font-bold text-foreground bg-transparent focus:outline-none"
                          placeholder="Heading..."
                        />
                      )}
                      {block.type === 'paragraph' && (
                        <textarea
                          value={block.content.text || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-foreground/80 bg-transparent focus:outline-none resize-none"
                          placeholder="Write something..."
                          rows={3}
                        />
                      )}
                      {block.type === 'image' && (
                        <input
                          type="url"
                          value={block.content.url || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { url: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-foreground bg-transparent focus:outline-none border-b border-border/20 pb-2"
                          placeholder="Image URL..."
                        />
                      )}
                      {block.type === 'divider' && <div className="h-px bg-border/20 my-2"></div>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteBlock(block.id)
                      }}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-red-500 rounded transition-all"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Block Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleAddBlock('heading')}
                className="p-3 rounded-lg border border-border/30 hover:bg-accent/10 transition-colors text-sm font-medium text-foreground/70"
              >
                <Plus className="size-4 mx-auto mb-1" />
                Heading
              </button>
              <button
                onClick={() => handleAddBlock('paragraph')}
                className="p-3 rounded-lg border border-border/30 hover:bg-accent/10 transition-colors text-sm font-medium text-foreground/70"
              >
                <Plus className="size-4 mx-auto mb-1" />
                Text
              </button>
              <button
                onClick={() => handleAddBlock('image')}
                className="p-3 rounded-lg border border-border/30 hover:bg-accent/10 transition-colors text-sm font-medium text-foreground/70"
              >
                <Plus className="size-4 mx-auto mb-1" />
                Image
              </button>
              <button
                onClick={() => handleAddBlock('divider')}
                className="p-3 rounded-lg border border-border/30 hover:bg-accent/10 transition-colors text-sm font-medium text-foreground/70"
              >
                <Plus className="size-4 mx-auto mb-1" />
                Divider
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/projects" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium">
            <ArrowLeft className="size-4" />
            Back to Projects
          </Link>

          <button
            onClick={async () => {
              const passkey = prompt('Enter passkey to edit:')
              if (passkey) {
                setIsAuthenticating(true)
                try {
                  const response = await fetch('/api/verify-passkey', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ passkey }),
                  })
                  if (response.ok) {
                    setIsEditMode(true)
                  } else {
                    alert('Invalid passkey')
                  }
                } catch (err) {
                  alert('Error verifying passkey')
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
        </div>
      </nav>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {project.featured && <div className="inline-block mb-6 featured-chip px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg">Featured Case Study</div>}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">{project.title}</h1>
          {project.description && <p className="text-lg text-foreground/80 mb-12">{project.description}</p>}
          {project.images.length > 0 && (
            <div className="rounded-2xl overflow-hidden bg-muted mb-12">
              <img src={project.images[0].url || `/media/${project.images[0].filename}`} alt={project.title} className="w-full h-auto object-cover max-h-[600px]" />
            </div>
          )}

          {/* Render Content Blocks */}
          {blocks.length > 0 && (
            <div className="prose prose-invert max-w-none space-y-6 mb-12">
              {blocks.map((block) => (
                <div key={block.id}>
                  {block.type === 'heading' && <h2 className="text-3xl font-bold text-foreground">{block.content.text}</h2>}
                  {block.type === 'paragraph' && <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{block.content.text}</p>}
                  {block.type === 'image' && block.content.url && <img src={block.content.url} alt="Content" className="w-full h-auto rounded-lg" />}
                  {block.type === 'divider' && <hr className="border-border/20 my-8" />}
                </div>
              ))}
            </div>
          )}

          {project.images.length > 1 && (
            <div className="space-y-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Project Details</h2>
              <div className="grid gap-8">
                {project.images.slice(1).map((image) => (
                  <div key={image.id} className="rounded-xl overflow-hidden bg-muted">
                    <img src={image.url || `/media/${image.filename}`} alt={image.title} className="w-full h-auto object-contain" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 pt-12 border-t border-border/20">
            <Link href="/projects" className="px-6 py-3 rounded-full bg-accent text-background font-medium hover:opacity-90 transition-opacity inline-block">
              Back to Gallery
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
