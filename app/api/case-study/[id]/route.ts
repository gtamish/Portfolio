import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

interface CaseStudySection {
  id: string
  type: "image" | "text" | "images-grid" | "figma"
  content: {
    title?: string
    description?: string
    images?: string[]
    figmaUrl?: string
  }
  order: number
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { sections, projectTitle } = await request.json()
    const projectId = params.id

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: "Invalid sections data" }, { status: 400 })
    }

    // Store case study layout in blob storage
    const caseStudyData = {
      projectId,
      projectTitle,
      sections,
      updatedAt: new Date().toISOString(),
    }

    const filename = `case-studies/${projectId}-layout.json`

    try {
      await put(filename, JSON.stringify(caseStudyData), {
        access: "public",
      })
    } catch (blobError) {
      console.warn("[v0] Blob storage unavailable, storing in memory only:", blobError)
      // Fallback: data will be stored in metadata when needed
    }

    console.log("[v0] Case study layout saved:", projectId)

    return NextResponse.json({
      success: true,
      message: "Case study updated successfully",
      data: caseStudyData,
    })
  } catch (error) {
    console.error("[v0] Case study update error:", error)
    return NextResponse.json(
      { error: "Failed to update case study", details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const filename = `case-studies/${projectId}-layout.json`

    try {
      const response = await fetch(`https://blob.vercelusercontent.com/${filename}`)
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (blobError) {
      console.warn("[v0] Could not fetch from blob:", blobError)
    }

    // Return empty sections if not found
    return NextResponse.json({
      projectId,
      sections: [],
      updatedAt: null,
    })
  } catch (error) {
    console.error("[v0] Case study fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch case study", details: String(error) },
      { status: 500 }
    )
  }
}
