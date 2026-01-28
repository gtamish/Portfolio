import { FloatingDock } from "@/components/floating-dock"
import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import { StickyHeader } from "@/components/sticky-header"

export default function Home() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <StickyHeader title="Amish Gautam" />
      <section className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl tracking-tight text-foreground md:text-4xl font-semibold animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Amish Gautam
          </h1>
          <h2 className="mt-4 text-lg font-medium text-foreground/80 md:text-xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Experience Designer
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Senior Experience Designer with 4+ years of experience in crafting digital experiences. Specialized in UI/UX design, SaaS design, and visual communication.
          </p>
        </div>
      </section>
      <FloatingDock />
      <AnimatedThemeToggle />
    </main>
  )
}
