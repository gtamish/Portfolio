import { put, list, del } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

// Set longer timeout and larger body size for large file uploads
export const config = {
  maxDuration: 60,
  bodyParser: {
    sizeLimit: "50mb",
  },
}

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
  url: string
  tag?: string
  featured?: boolean
}

const METADATA_KEY = "projects-metadata.json"

async function getMetadata(): Promise<MediaItem[]> {
  try {
    const { blobs } = await list()
    const metadataBlob = blobs.find((blob) => blob.pathname === METADATA_KEY)
    
    if (metadataBlob) {
      const response = await fetch(metadataBlob.url)
      if (!response.ok) {
        console.error("[v0] Failed to fetch metadata blob:", response.status, response.statusText)
        return []
      }
      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        console.error("[v0] Metadata blob is not JSON, content-type:", contentType)
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
    const tag = formData.get("tag") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", file.name, "Size:", file.size)

    // Generate unique filename
    const id = Date.now().toString()
    const extension = file.name.split(".").pop()
    const filename = `${id}.${extension}`

    // Upload file to Vercel Blob
    let blob
    try {
      blob = await put(filename, file, {
        access: "public",
      })
      console.log("[v0] File uploaded to:", blob.url)
    } catch (blobError) {
      console.error("[v0] Blob upload error:", blobError)
      throw new Error(`Failed to upload file to blob storage: ${String(blobError)}`)
    }

    // Update metadata
    let metadata
    try {
      metadata = await getMetadata()
    } catch (metaError) {
      console.error("[v0] Failed to get metadata:", metaError)
      metadata = []
    }

    metadata.push({
      id,
      filename,
      title: title || "Untitled",
      description: description || "",
      uploadedAt: new Date().toISOString(),
      url: blob.url,
      tag: tag || "Visuals",
      featured: false,
    })

    try {
      await saveMetadata(metadata)
      console.log("[v0] Metadata updated successfully")
    } catch (saveError) {
      console.error("[v0] Failed to save metadata:", saveError)
      throw new Error(`Failed to save metadata: ${String(saveError)}`)
    }

    return NextResponse.json({ success: true, id, filename, url: blob.url })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: "Upload failed", details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const metadata = await getMetadata()
    console.log("[v0] Returning metadata with", metadata.length, "items")
    return NextResponse.json(metadata, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error) {
    console.error("[v0] Get media error:", error)
    return NextResponse.json(
      { error: "Failed to get media", details: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { metadata } = body

    if (!Array.isArray(metadata)) {
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 })
    }

    await saveMetadata(metadata)
    console.log("[v0] Metadata updated successfully via PATCH")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] PATCH error:", error)
    return NextResponse.json(
      { error: "Failed to update metadata", details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 })
    }

    // Get metadata and remove the item with this id
    const metadata = await getMetadata()
    const filteredMetadata = metadata.filter(item => item.id !== id)

    // Save updated metadata
    await saveMetadata(filteredMetadata)
    console.log("[v0] Item deleted:", id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete item", details: String(error) },
      { status: 500 }
    )
  }
}
