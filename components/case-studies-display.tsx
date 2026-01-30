"use client"

import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"

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

export function CaseStudiesDisplay({ projects, onImageLoad }: { projects: Project[]; onImageLoad: (id: string) => void }) {
  const router = useRouter()

  const caseStudies = projects.filter(p => p.tag === "Case Studies")

  if (caseStudies.length === 0) {
    return null
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {caseStudies.map((project, index) => {
        const heroImage = project.images[0]
        if (!heroImage) return null

        return (
          <div
            key={project.id}
            onClick={() => {
              const caseStudyIndex = caseStudies.findIndex(p => p.id === project.id)
              router.push(`/projects/case-studies/${caseStudyIndex}`)
            }}
            className="group cursor-pointer rounded-2xl overflow-hidden bg-muted transition-all duration-300 hover:shadow-lg hover:shadow-accent/20"
          >
            {/* 1:2 Horizontal Layout */}
            <div className="grid grid-cols-3 gap-0 min-h-80 sm:min-h-96">
              {/* Left: Image (1 part) */}
              <div className="col-span-1 relative overflow-hidden">
                <img
                  src={heroImage.url || `/media/${heroImage.filename}`}
                  alt={project.title}
                  loading="lazy"
                  onLoad={() => onImageLoad(heroImage.id)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Right: Content (2 parts) */}
              <div className="col-span-2 flex flex-col justify-center p-6 sm:p-8 lg:p-10 bg-card/40 backdrop-blur-md">
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground line-clamp-2">
                    {project.title}
                  </h3>
                  
                  {project.description && (
                    <p className="text-sm sm:text-base text-foreground/80 leading-relaxed line-clamp-4">
                      {project.description}
                    </p>
                  )}

                  {/* Read Case Study CTA */}
                  <div className="flex items-center gap-2 text-accent font-semibold mt-6 group-hover:translate-x-2 transition-transform duration-300">
                    <span>Read case study</span>
                    <ChevronRight className="size-5" strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
