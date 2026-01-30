import { FloatingDock } from "@/components/floating-dock"
import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import { StickyHeader } from "@/components/sticky-header"

export default function About() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <StickyHeader title="About" />
      
      {/* About Section */}
      <section className="pt-20 sm:pt-24 pb-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-16 space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground font-bold animate-fade-in-up mix-blend-mode-lighten" style={{ animationDelay: "0.1s" }}>
              About Me
            </h1>
            <div className="h-1 w-16 bg-accent animate-fade-in-up" style={{ animationDelay: "0.15s" }}></div>
            <p className="text-lg sm:text-xl text-foreground/70 animate-fade-in-up mix-blend-mode-lighten" style={{ animationDelay: "0.2s" }}>
              Designer. Problem solver. Perpetual learner.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-base sm:text-lg leading-relaxed text-foreground/70">
            <p className="animate-fade-in-up mix-blend-mode-lighten" style={{ animationDelay: "0.25s" }}>
              I'm a Senior Experience Designer with over 4 years of hands-on experience creating digital experiences that are both beautiful and functional. My passion lies at the intersection of design and human psychology — understanding how people interact with products and creating interfaces that feel intuitive and delightful.
            </p>

            <p className="animate-fade-in-up mix-blend-mode-lighten" style={{ animationDelay: "0.3s" }}>
              My journey in design began with a deep curiosity about how things work. I've spent years studying user behavior, conducting research, and iterating on designs to solve complex problems. Whether it's designing SaaS platforms, mobile applications, or web experiences, I approach each project with the mindset of putting users first.
            </p>

            <div className="my-12 p-6 rounded-lg bg-accent/10 border border-accent/20 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
              <p className="text-foreground font-medium mb-4 mix-blend-mode-lighten">What I bring to the table:</p>
              <ul className="space-y-2 text-foreground/70">
                <li className="flex gap-3 mix-blend-mode-lighten">
                  <span className="text-accent font-bold">+</span> 4+ years of UX/UI design experience
                </li>
                <li className="flex gap-3 mix-blend-mode-lighten">
                  <span className="text-accent font-bold">+</span> Proficiency in design systems and component libraries
                </li>
                <li className="flex gap-3 mix-blend-mode-lighten">
                  <span className="text-accent font-bold">+</span> Strong understanding of user research and usability testing
                </li>
                <li className="flex gap-3 mix-blend-mode-lighten">
                  <span className="text-accent font-bold">+</span> Expertise in visual communication and brand identity
                </li>
              </ul>
            </div>

            <p className="animate-fade-in-up mix-blend-mode-lighten" style={{ animationDelay: "0.4s" }}>
              When I'm not designing, you'll find me exploring new design trends, contributing to open-source projects, or mentoring aspiring designers. I believe in continuous learning and pushing the boundaries of what's possible in digital design.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <FloatingDock />
      <AnimatedThemeToggle />
    </main>
  )
}
