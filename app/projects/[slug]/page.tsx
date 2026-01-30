'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Edit2, X, Save } from 'lucide-react'
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

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/case-study/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
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

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {isEditMode ? (
            <span className="text-accent font-medium text-sm">Edit Mode</span>
          ) : (
            <Link href="/projects" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium">
              <ArrowLeft className="size-4" />
              Back to Projects
            </Link>
          )}

          <div className="flex items-center gap-3">
            {isEditMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  <Save className="size-4" />
                  {isSaving ? 'Saving...' : 'Publish'}
                </button>
                <button onClick={() => setIsEditMode(false)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 text-accent transition-colors">
                  <X className="size-4" />
                </button>
              </>
            ) : (
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
            )}
          </div>
        </div>
      </nav>

      {isEditMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[calc(100vh-80px)]">
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
          </div>

          <div className="overflow-y-auto bg-background p-6 sm:p-8">
            <div className="max-w-3xl">
              {project.featured && <div className="inline-block mb-6 featured-chip px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg">Featured Case Study</div>}
              {editTitle && <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">{editTitle}</h1>}
              {editDescription && <p className="text-lg text-foreground/80 mb-12">{editDescription}</p>}
              {project.images.length > 0 && (
                <div className="rounded-2xl overflow-hidden bg-muted mb-12">
                  <img src={project.images[0].url || `/media/${project.images[0].filename}`} alt={project.title} className="w-full h-auto object-cover max-h-[400px]" />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {project.featured && <div className="inline-block mb-6 featured-chip px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg">Featured Case Study</div>}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">{project.title}</h1>
            {project.description && <p className="text-lg text-foreground/80 mb-12">{project.description}</p>}
            {project.images.length > 0 && (
              <div className="rounded-2xl overflow-hidden bg-muted mb-12">
                <img src={project.images[0].url || `/media/${project.images[0].filename}`} alt={project.title} className="w-full h-auto object-cover max-h-[600px]" />
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
      )}
    </main>
  )
}
