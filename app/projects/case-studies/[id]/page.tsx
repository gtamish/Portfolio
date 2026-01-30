"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"

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

export default function CaseStudyPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
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

        // Filter to get only case studies (flat MediaItem array)
        const caseStudyItems = data.filter((item: MediaItem) => item.tag === "Case Studies")
        
        // Get the case study by index
        const projectIndex = parseInt(params.id)
        if (projectIndex < caseStudyItems.length) {
          const caseStudyItem = caseStudyItems[projectIndex]
          
          // Group all items with the same title (same project)
          const projectItems = data.filter((item: MediaItem) => item.title === caseStudyItem.title)
          
          setProject({
            id: caseStudyItem.id,
            title: caseStudyItem.title,
            description: caseStudyItem.description,
            images: projectItems,
            tag: "Case Studies",
            featured: caseStudyItem.featured,
          })
        } else {
          console.warn("[v0] Case study index out of bounds:", projectIndex)
        }
      } catch (error) {
        console.error("[v0] Error fetching case study:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [params.id])

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/projects"
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Projects</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Featured Badge */}
          {project.featured && (
            <div className="inline-block mb-6">
              <div className="featured-chip px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg">
                Featured Case Study
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight text-balance">
            {project.title}
          </h1>

          {/* Description */}
          {project.description && (
            <p className="text-base sm:text-lg lg:text-xl text-foreground/80 leading-relaxed max-w-3xl mb-12">
              {project.description}
            </p>
          )}

          {/* First Image - Hero */}
          {project.images.length > 0 && (
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
          {project.images.length > 1 && (
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
    </main>
  )
}
