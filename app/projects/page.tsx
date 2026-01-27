"use client"

import { useState } from "react"
import { FloatingDock } from "@/components/floating-dock"
import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import { StickyHeader } from "@/components/sticky-header"
import { UploadPopup } from "@/components/upload-popup"
import { ProjectGallery } from "@/components/project-gallery"

export default function Projects() {
  const [showUploadPopup, setShowUploadPopup] = useState(false)

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <StickyHeader title="Projects" />
      <section className="pt-24 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl tracking-tight text-foreground md:text-4xl font-semibold animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Projects
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              A collection of my design work and case studies.
            </p>
          </div>
          <ProjectGallery />
        </div>
      </section>
      <FloatingDock onUploadClick={() => setShowUploadPopup(true)} />
      <AnimatedThemeToggle />
      <UploadPopup isOpen={showUploadPopup} onClose={() => setShowUploadPopup(false)} />
    </main>
  )
}
