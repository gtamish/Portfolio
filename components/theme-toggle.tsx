"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  useEffect(() => {
    // Check for saved theme preference, default to dark
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const initialTheme = savedTheme || "dark"
    
    setTheme(initialTheme)
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
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
