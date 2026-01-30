"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Edit2 } from "lucide-react"
import { useTheme } from "next-themes"
import { NotionPageBuilder } from "@/components/notion-page-builder"
import { createSlug, decodeSlug } from "@/lib/slug"

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

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isScrolled, setIsScrolled] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/upload")
        if (!response.ok) throw new Error("Failed to fetch projects")
        
        const data = await response.json()
        
        if (!Array.isArray(data)) {
          console.warn("[v0] Invalid data structure")
          return
        }

        // Find project by matching slug with title
        let foundProject: Project | null = null
        
        if (data.length > 0 && 'images' in data[0]) {
          // New project-based structure
          foundProject = data.find((p: Project) => createSlug(p.title) === params.slug) || null
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

          // Find project by slug
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
        } else {
          console.error("[v0] Project not found:", params.slug)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch project:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [params.slug])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 150)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleImageLoad = (imageId: string) => {
    setLoadedImages(prev => new Set([...prev, imageId]))
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
        <Link href="/projects" className="text-accent hover:underline">
          ← Back to Projects
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {isEditMode ? (
            <span className="text-accent font-medium text-sm">Edit Mode</span>
          ) : (
            <Link 
              href="/projects"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Projects</span>
            </Link>
          )}
          
          {/* Center Title - Shows on scroll */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ${
              isScrolled ? "opacity-100 visible" : "opacity-0 pointer-events-none"
            }`}
          >
            <h2 className="text-lg sm:text-xl font-bold text-foreground line-clamp-1 whitespace-nowrap">
              {project?.title}
            </h2>
          </div>

          {/* Edit Button */}
          <button
            onClick={async () => {
              if (!isEditMode) {
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
              } else {
                setIsEditMode(false)
              }
            }}
            disabled={isAuthenticating}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 text-accent transition-colors disabled:opacity-50"
            title={isEditMode ? "Exit edit mode" : "Edit case study"}
          >
            <Edit2 className="size-4" />
            <span className="hidden sm:inline text-sm font-medium">{isEditMode ? "Done" : "Edit"}</span>
          </button>
        </div>
      </nav>

      {/* Content - Editor or View Mode */}
      {isEditMode ? (
        <NotionPageBuilder
          isOpen={true}
          onClose={() => setIsEditMode(false)}
          projectId={project?.id || ""}
          projectTitle={project?.title || ""}
          onSave={() => {
            setIsEditMode(false)
            // Optionally refresh the page content
          }}
          isInline={true}
        />
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {/* Featured Badge */}
              {project?.featured && (
                <div className="inline-block mb-6">
                  <div className="featured-chip px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg">
                    Featured Case Study
                  </div>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight text-balance">
                {project?.title}
              </h1>

              {/* Description */}
              {project?.description && (
                <p className="text-base sm:text-lg lg:text-xl text-foreground/80 leading-relaxed max-w-3xl mb-12">
                  {project.description}
                </p>
              )}

              {/* First Image - Hero */}
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

          {/* Content Sections */}
          <section className="pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {/* Additional Images Gallery */}
              {project && project.images.length > 1 && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Project Details</h2>
                    
                    <div className="grid gap-8">
                      {project.images.slice(1).map((image, idx) => (
                        <div
                          key={image.id}
                          className="group relative rounded-xl overflow-hidden bg-muted"
                        >
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

              {/* Footer CTA */}
              <div className="mt-16 pt-12 border-t border-border/20">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div>
                    <p className="text-foreground/70 text-sm mb-2">Ready to see more projects?</p>
                    <h3 className="text-lg font-semibold text-foreground">Explore More Work</h3>
                  </div>
                  <Link
                    href="/projects"
                    className="btn-interactive px-6 py-3 rounded-full bg-accent text-background font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
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
