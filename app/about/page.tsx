import { FloatingDock } from "@/components/floating-dock"
import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import { StickyHeader } from "@/components/sticky-header"

export default function About() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <StickyHeader title="About" />
      <section className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl tracking-tight text-foreground md:text-4xl font-semibold animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            About
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Learn more about my background and experience.
          </p>
        </div>
      </section>
      <FloatingDock />
      <AnimatedThemeToggle />
    </main>
  )
}
