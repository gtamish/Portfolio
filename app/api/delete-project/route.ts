import { del, list, put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

const PASSKEY = process.env.NEXT_PUBLIC_PASSKEY || "admin123"
const METADATA_KEY = "projects-metadata.json"

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
  url: string
}

async function getMetadata(): Promise<MediaItem[]> {
  try {
    const { blobs } = await list()
    const metadataBlob = blobs.find((blob) => blob.pathname === METADATA_KEY)

    if (metadataBlob) {
      const response = await fetch(metadataBlob.url)
      if (!response.ok) return []
      const text = await response.text()
      if (!text) return []
      const data = JSON.parse(text)
      return Array.isArray(data) ? data : []
    }
  } catch (error) {
    console.error("[v0] Error getting metadata:", error)
  }
  return []
}

async function saveMetadata(metadata: MediaItem[]): Promise<void> {
  const blob = new Blob([JSON.stringify(metadata, null, 2)], {
    type: "application/json",
  })
  await put(METADATA_KEY, blob, {
    access: "public",
    contentType: "application/json",
  })
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const passkey = authHeader?.replace("Bearer ", "")

    if (passkey !== PASSKEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 })
    }

    // Get current metadata
    const metadata = await getMetadata()

    // Find and remove the project
    const projectIndex = metadata.findIndex((item) => item.id === projectId)
    if (projectIndex === -1) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = metadata[projectIndex]
    metadata.splice(projectIndex, 1)

    // Delete the image blob
    try {
      await del(project.filename)
    } catch (error) {
      console.error("[v0] Error deleting blob:", error)
    }

    // Update metadata
    await saveMetadata(metadata)

    console.log("[v0] Project deleted:", projectId)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Delete project error:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
