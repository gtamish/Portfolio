"use client"

import { useState, useCallback } from "react"
import { FloatingDock } from "@/components/floating-dock"
import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import { StickyHeader } from "@/components/sticky-header"
import { ProjectGallery } from "@/components/project-gallery"
import { ProjectEditModal } from "@/components/project-edit-modal"
import { GalleryLayoutEditor } from "@/components/gallery-layout-editor"
import { ProjectFilter } from "@/components/project-filter"

type ProjectTag = "Visuals" | "Case Studies"

interface LayoutProject {
  id: string
  title: string
}

export default function Projects() {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLayoutEditor, setShowLayoutEditor] = useState(false)
  const [galleryKey, setGalleryKey] = useState(0)
  const [selectedFilter, setSelectedFilter] = useState<ProjectTag | null>(null)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [layoutProjects, setLayoutProjects] = useState<LayoutProject[]>([])

  const handleProjectsUpdated = () => {
    setGalleryKey(k => k + 1)
    setTimeout(() => {
      setShowEditModal(false)
    }, 300)
  }

  const handleLayoutEditorOpen = useCallback(() => {
    // Fetch projects for layout editor
    fetch("/api/upload")
      .then(res => res.json())
      .then(data => {
        const projects = Array.isArray(data)
          ? data.map(item => ({
              id: item.id,
              title: item.title || "Untitled",
            }))
          : []
        setLayoutProjects(projects)
        setShowLayoutEditor(true)
      })
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <StickyHeader title="Projects" />
      <section className="pt-20 sm:pt-24 pb-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={`text-center mb-8 sm:mb-12 transition-opacity duration-300 ${isFullscreenOpen ? "opacity-10 pointer-events-none" : "opacity-100"}`}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground font-bold animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              My Projects
            </h1>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              A curated collection of my creative work, case studies, and design explorations.
            </p>
          </div>

          {/* Filter */}
          <div className={`transition-opacity duration-300 ${isFullscreenOpen ? "opacity-10 pointer-events-none" : "opacity-100"}`}>
            <ProjectFilter onFilterChange={setSelectedFilter} />
          </div>

          {/* Gallery */}
          <div className="relative">
            <ProjectGallery 
              key={galleryKey} 
              filter={selectedFilter} 
              onFullscreenChange={setIsFullscreenOpen} 
              onLayoutEditorOpen={handleLayoutEditorOpen}
            />
          </div>
        </div>
      </section>
      <div className={`transition-opacity duration-300 ${isFullscreenOpen ? "opacity-10" : "opacity-100"}`}>
        <FloatingDock />
        <AnimatedThemeToggle onEditClick={() => setShowEditModal(true)} />
      </div>
      <ProjectEditModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        onProjectsUpdated={handleProjectsUpdated}
      />
      <GalleryLayoutEditor
        isOpen={showLayoutEditor}
        onClose={() => setShowLayoutEditor(false)}
        projects={layoutProjects}
        onLayoutSave={async (layout) => {
          const passkey = prompt("Enter passkey to save layout:")
          if (!passkey) return
          
          const response = await fetch("/api/gallery-layout", {
            method: "PUT",
            body: JSON.stringify({ passkey, layout }),
          })
          
          if (response.ok) {
            setGalleryKey(k => k + 1)
          }
        }}
        onPasskeyPrompt={async () => {
          const passkey = prompt("Enter passkey to edit layout:")
          return passkey || ""
        }}
      />
    </main>
  )
}
