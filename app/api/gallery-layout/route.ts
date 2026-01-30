import { NextRequest, NextResponse } from "next/server"
import { put, get } from "@vercel/blob"

const PASSKEY = process.env.EDIT_PASSKEY || "default-passkey"
const LAYOUT_FILE = "gallery-layout.json"

export async function GET() {
  try {
    const blob = await get(LAYOUT_FILE).catch(() => null)
    if (!blob) {
      return NextResponse.json({})
    }
    const layout = JSON.parse(await blob.text())
    return NextResponse.json(layout)
  } catch (error) {
    console.error("[v0] Failed to fetch layout:", error)
    return NextResponse.json({})
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { passkey, layout } = await req.json()

    // Verify passkey
    if (passkey !== PASSKEY) {
      return NextResponse.json(
        { error: "Invalid passkey" },
        { status: 401 }
      )
    }

    // Save layout to blob
    await put(LAYOUT_FILE, JSON.stringify(layout, null, 2), {
      access: "private",
    })

    console.log("[v0] Gallery layout saved")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to save layout:", error)
    return NextResponse.json(
      { error: "Failed to save layout" },
      { status: 500 }
    )
  }
}
