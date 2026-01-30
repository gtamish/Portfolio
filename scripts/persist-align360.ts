import { put } from "@vercel/blob"

async function persistAlign360ToBlog() {
  const align360Metadata = [
    {
      id: "align360-hero-1",
      filename: "align360-hero.jpg",
      title: "Align360",
      description:
        "Align360 is a comprehensive platform designed to help managers capture and structure monthly one-on-one conversations, enabling better alignment, feedback delivery, and employee growth. The case study demonstrates a complete product design lifecycle including user research with 6 distinct personas, comprehensive objectives & goals definition, current state assessment, innovative solution architecture, detailed UI/UX design mockups across multiple screens, implementation strategy, and quantifiable business outcomes.",
      uploadedAt: "2026-01-30",
      url: "/media/align360-hero.jpg",
      tag: "Case Studies",
      featured: true,
    },
  ]

  try {
    const blob = await put(
      "projects-metadata.json",
      JSON.stringify(align360Metadata, null, 2),
      {
        access: "public",
        contentType: "application/json",
        allowOverwrite: true,
      }
    )
    console.log("[v0] Align360 metadata persisted to blob:", blob.url)
    return { success: true, url: blob.url }
  } catch (error) {
    console.error("[v0] Error persisting to blob:", error)
    throw error
  }
}

persistAlign360ToBlog()
