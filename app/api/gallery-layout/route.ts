import { NextRequest, NextResponse } from "next/server"
import { put, get } from "@vercel/blob"

const PASSKEY = process.env.EDIT_PASSKEY || "default-passkey"
const LAYOUT_FILE = "gallery-layout.json"

export async function GET() {
  try {
    let blob
    try {
      blob = await get(LAYOUT_FILE)
    } catch (err) {
      // File doesn't exist yet - return empty layout
      console.log("[v0] No layout file found, returning empty layout")
      return NextResponse.json({})
    }

    if (!blob) {
      return NextResponse.json({})
    }

    const text = await blob.text()
    const layout = JSON.parse(text)
    console.log("[v0] Layout loaded successfully")
    return NextResponse.json(layout)
  } catch (error) {
    console.error("[v0] Failed to fetch layout:", error)
    // Return empty object instead of error to prevent JSON parsing issues
    return NextResponse.json({})
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { passkey, layout } = body

    // Verify passkey
    if (passkey !== PASSKEY) {
      return NextResponse.json(
        { error: "Invalid passkey" },
        { status: 401 }
      )
    }

    if (!layout || typeof layout !== "object") {
      return NextResponse.json(
        { error: "Invalid layout format" },
        { status: 400 }
      )
    }

    // Save layout to blob
    await put(LAYOUT_FILE, JSON.stringify(layout, null, 2), {
      access: "private",
    })

    console.log("[v0] Gallery layout saved successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to save layout:", error)
    return NextResponse.json(
      { error: "Failed to save layout", details: String(error) },
      { status: 500 }
    )
  }
}
