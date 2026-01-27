import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const MEDIA_DIR = path.join(process.cwd(), "public", "media")
const METADATA_FILE = path.join(MEDIA_DIR, "metadata.json")

interface MediaItem {
  id: string
  filename: string
  title: string
  description: string
  uploadedAt: string
}

async function ensureMediaDir() {
  if (!existsSync(MEDIA_DIR)) {
    await mkdir(MEDIA_DIR, { recursive: true })
  }
}

async function getMetadata(): Promise<MediaItem[]> {
  try {
    if (existsSync(METADATA_FILE)) {
      const data = await readFile(METADATA_FILE, "utf-8")
      return JSON.parse(data)
    }
  } catch {
    // Return empty array if file doesn't exist or is invalid
  }
  return []
}

async function saveMetadata(metadata: MediaItem[]) {
  await writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    await ensureMediaDir()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const id = Date.now().toString()
    const extension = file.name.split(".").pop()
    const filename = `${id}.${extension}`
    const filepath = path.join(MEDIA_DIR, filename)

    await writeFile(filepath, buffer)

    // Update metadata
    const metadata = await getMetadata()
    metadata.push({
      id,
      filename,
      title,
      description,
      uploadedAt: new Date().toISOString(),
    })
    await saveMetadata(metadata)

    return NextResponse.json({ success: true, id, filename })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function GET() {
  try {
    await ensureMediaDir()
    const metadata = await getMetadata()
    return NextResponse.json(metadata)
  } catch (error) {
    console.error("Get media error:", error)
    return NextResponse.json({ error: "Failed to get media" }, { status: 500 })
  }
}
