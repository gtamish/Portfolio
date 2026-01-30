"use client"

import { useState } from "react"

type ProjectTag = "Visuals" | "Case Studies"

interface ProjectFilterProps {
  onFilterChange: (selectedTag: ProjectTag | null) => void
}

export function ProjectFilter({ onFilterChange }: ProjectFilterProps) {
  const [selectedTag, setSelectedTag] = useState<ProjectTag | null>(null)

  const tags: ProjectTag[] = ["Visuals", "Case Studies"]

  const handleTagClick = (tag: ProjectTag) => {
    const newTag = selectedTag === tag ? null : tag
    setSelectedTag(newTag)
    onFilterChange(newTag)
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-12 sm:mb-16">
      <button
        onClick={() => {
          setSelectedTag(null)
          onFilterChange(null)
        }}
        className={`btn-interactive px-4 py-2 rounded-full text-sm font-medium transition-all ${
          selectedTag === null
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-background/40 text-foreground hover:bg-accent/20 border border-border"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => handleTagClick(tag)}
          className={`btn-interactive px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedTag === tag
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-background/40 text-foreground hover:bg-accent/20 border border-border"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
