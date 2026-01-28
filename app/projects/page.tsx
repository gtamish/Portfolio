"use client"

import { useState } from "react"
import { FloatingDock } from "@/components/floating-dock"
import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import { StickyHeader } from "@/components/sticky-header"
import { ProjectGallery } from "@/components/project-gallery"
import { ProjectEditModal } from "@/components/project-edit-modal"
import { ProjectFilter } from "@/components/project-filter"

type ProjectTag = "Visuals" | "Case Studies"

export default function Projects() {
  const [showEditModal, setShowEditModal] = useState(false)
  const [galleryKey, setGalleryKey] = useState(0)
  const [selectedFilter, setSelectedFilter] = useState<ProjectTag | null>(null)

  const handleProjectsUpdated = () => {
    setGalleryKey(k => k + 1)
    setTimeout(() => {
      setShowEditModal(false)
    }, 300)
  }

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <StickyHeader title="Projects" />
      <section className="pt-20 sm:pt-24 pb-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground font-bold animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              My Projects
            </h1>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              A curated collection of my creative work, case studies, and design explorations.
            </p>
          </div>

          {/* Filter */}
          <ProjectFilter onFilterChange={setSelectedFilter} />

          {/* Gallery */}
          <div className="relative">
            <ProjectGallery key={galleryKey} filter={selectedFilter} />
          </div>
        </div>
      </section>
      <FloatingDock />
      <AnimatedThemeToggle onEditClick={() => setShowEditModal(true)} />
      <ProjectEditModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        onProjectsUpdated={handleProjectsUpdated}
      />
    </main>
  )
}
