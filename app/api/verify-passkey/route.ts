import { NextRequest, NextResponse } from "next/server"

const PASSKEY = process.env.NEXT_PUBLIC_PASSKEY || "admin123"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { passkey } = body

    if (!passkey) {
      return NextResponse.json({ error: "Passkey required" }, { status: 400 })
    }

    if (passkey === PASSKEY) {
      return NextResponse.json({ success: true }, { status: 200 })
    } else {
      return NextResponse.json({ error: "Invalid passkey" }, { status: 401 })
    }
  } catch (error) {
    console.error("[v0] Passkey verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
