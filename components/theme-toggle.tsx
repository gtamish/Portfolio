"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center rounded-full border border-border bg-background p-3 transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="size-5" />
      </button>
    )
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-full border border-border bg-background p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="size-5" />
      ) : (
        <Sun className="size-5" />
      )}
    </button>
  )
}
