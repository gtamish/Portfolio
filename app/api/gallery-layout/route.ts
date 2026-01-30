import { NextRequest, NextResponse } from "next/server"
import { put, list } from "@vercel/blob"

const PASSKEY = process.env.NEXT_PUBLIC_PASSKEY || "default-passkey"
const METADATA_KEY = "projects-metadata.json"

interface ProjectMetadata {
  id: string
  title: string
  description: string
  tag?: string
  featured?: boolean
  layout?: { colSpan: number; rowSpan: number }
  [key: string]: any
}

async function getMetadata(): Promise<ProjectMetadata[]> {
  try {
    const { blobs } = await list()
    const metadataBlob = blobs.find((blob) => blob.pathname === METADATA_KEY)

    if (metadataBlob) {
      const response = await fetch(metadataBlob.url)
      if (!response.ok) {
        console.error("[v0] Failed to fetch metadata blob:", response.status)
        return []
      }
      const text = await response.text()
      if (!text) {
        console.warn("[v0] Metadata blob is empty")
        return []
      }
      const data = JSON.parse(text)
      return Array.isArray(data) ? data : []
    }
  } catch (error) {
    console.error("[v0] Error getting metadata:", error)
  }
  return []
}

async function saveMetadata(metadata: ProjectMetadata[]) {
  try {
    const blob = await put(METADATA_KEY, JSON.stringify(metadata, null, 2), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    })
    console.log("[v0] Metadata with layouts saved")
  } catch (error) {
    console.error("[v0] Error saving metadata:", error)
    throw error
  }
}

export async function GET() {
  try {
    const metadata = await getMetadata()
    const layouts: { [key: string]: { colSpan: number; rowSpan: number } } = {}
    
    metadata.forEach((project) => {
      if (project.layout) {
        layouts[project.id] = project.layout
      }
    })
    
    console.log("[v0] Gallery layouts retrieved:", Object.keys(layouts).length)
    return NextResponse.json(layouts)
  } catch (error) {
    console.error("[v0] Failed to fetch layouts:", error)
    return NextResponse.json({})
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { passkey, layout } = body

    console.log("[v0] Save layout request - passkey:", passkey, "layout keys:", Object.keys(layout || {}))

    // Verify passkey
    if (passkey !== PASSKEY) {
      console.error("[v0] Invalid passkey provided")
      return NextResponse.json(
        { error: "Invalid passkey" },
        { status: 401 }
      )
    }

    if (!layout || typeof layout !== "object") {
      console.error("[v0] Invalid layout format:", layout)
      return NextResponse.json(
        { error: "Invalid layout format" },
        { status: 400 }
      )
    }

    // Get existing metadata
    console.log("[v0] Getting existing metadata...")
    const metadata = await getMetadata()
    console.log("[v0] Current metadata projects:", metadata.length)

    // Update layout for each project
    const updatedMetadata = metadata.map((project) => {
      if (layout[project.id]) {
        console.log("[v0] Updating layout for project:", project.id, layout[project.id])
        return {
          ...project,
          layout: layout[project.id],
        }
      }
      return project
    })

    // Save updated metadata
    console.log("[v0] Saving updated metadata with", updatedMetadata.length, "projects")
    await saveMetadata(updatedMetadata)

    console.log("[v0] Gallery layouts saved successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to save layouts - error:", error)
    return NextResponse.json(
      { error: "Failed to save layouts", details: String(error) },
      { status: 500 }
    )
  }
}
