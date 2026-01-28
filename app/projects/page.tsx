"use client"

import { useState } from "react"
import { FloatingDock } from "@/components/floating-dock"
import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import { StickyHeader } from "@/components/sticky-header"
import { ProjectGallery } from "@/components/project-gallery"
import { ProjectEditModal } from "@/components/project-edit-modal"

export default function Projects() {
  const [showEditModal, setShowEditModal] = useState(false)
  const [galleryKey, setGalleryKey] = useState(0)

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
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground font-bold animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              My Projects
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              A curated collection of my creative work, case studies, and design explorations.
            </p>
          </div>

          {/* Gallery */}
          <div className="relative">
            <ProjectGallery key={galleryKey} />
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
