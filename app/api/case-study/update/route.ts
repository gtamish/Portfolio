import { NextRequest, NextResponse } from "next/server"
import { put, list, del } from "@vercel/blob"

interface UpdatePayload {
  title: string
  description: string
  images: Array<{ id: string; filename: string; url?: string }>
  blocks: Array<{
    id: string
    type: string
    content: { text?: string; url?: string; images?: string[] }
  }>
  projectId: string
}

export async function POST(req: NextRequest) {
  try {
    const body: UpdatePayload = await req.json()
    const { title, description, images, blocks, projectId } = body

    console.log("[v0] Updating case study:", title)

    // Save the case study structure to blob
    const caseStudyKey = `case-studies/${projectId}.json`
    const caseStudyData = {
      title,
      description,
      images,
      blocks,
      updatedAt: new Date().toISOString(),
    }

    await put(caseStudyKey, JSON.stringify(caseStudyData), {
      access: "public",
    })

    console.log("[v0] Case study saved:", caseStudyKey)
    return NextResponse.json({ success: true, message: "Case study updated" })
  } catch (error) {
    console.error("[v0] Failed to update case study:", error)
    return NextResponse.json(
      { error: "Failed to update case study", details: String(error) },
      { status: 500 }
    )
  }
}
