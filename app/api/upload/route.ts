import { put, list, del } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
  url: string
}

const METADATA_KEY = "projects-metadata.json"

async function getMetadata(): Promise<MediaItem[]> {
  try {
    const { blobs } = await list()
    const metadataBlob = blobs.find((blob) => blob.pathname === METADATA_KEY)
    
    if (metadataBlob) {
      const response = await fetch(metadataBlob.url)
      const data = await response.json()
      return data
    }
  } catch (error) {
    console.error("[v0] Error getting metadata:", error)
  }
  return []
}

async function saveMetadata(metadata: MediaItem[]) {
  try {
    const blob = await put(METADATA_KEY, JSON.stringify(metadata, null, 2), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    })
    console.log("[v0] Metadata saved to:", blob.url)
  } catch (error) {
    console.error("[v0] Error saving metadata:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", file.name, "Size:", file.size)

    // Generate unique filename
    const id = Date.now().toString()
    const extension = file.name.split(".").pop()
    const filename = `${id}.${extension}`

    // Upload file to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    console.log("[v0] File uploaded to:", blob.url)

    // Update metadata
    const metadata = await getMetadata()
    metadata.push({
      id,
      filename,
      title: title || "Untitled",
      description: description || "",
      uploadedAt: new Date().toISOString(),
      url: blob.url,
    })
    await saveMetadata(metadata)

    return NextResponse.json({ success: true, id, filename, url: blob.url })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      { error: "Upload failed", details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const metadata = await getMetadata()
    console.log("[v0] Returning metadata with", metadata.length, "items")
    return NextResponse.json(metadata)
  } catch (error) {
    console.error("[v0] Get media error:", error)
    return NextResponse.json(
      { error: "Failed to get media", details: String(error) },
      { status: 500 }
    )
  }
}
