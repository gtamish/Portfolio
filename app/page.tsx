import { FloatingDock } from "@/components/floating-dock"
import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import { StickyHeader } from "@/components/sticky-header"

export default function Home() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <StickyHeader title="Amish Gautam" />
      
      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <div className="max-w-3xl text-center space-y-8">
          {/* Name */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-tight text-foreground font-bold animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Amish Gautam
          </h1>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground/90 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Experience Designer
            </h2>
            <div className="h-1 w-16 bg-accent mx-auto animate-fade-in-up" style={{ animationDelay: "0.25s" }}></div>
          </div>

          {/* Description */}
          <p className="text-base sm:text-lg leading-relaxed text-foreground/70 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Senior Experience Designer with 4+ years of expertise in crafting elegant digital experiences. I specialize in UI/UX design, SaaS platforms, and visual communication that bridges the gap between aesthetics and functionality.
          </p>

          {/* CTA Button */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <a 
              href="/projects"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity"
            >
              View My Work
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <FloatingDock />
      <AnimatedThemeToggle />
    </main>
  )
}
