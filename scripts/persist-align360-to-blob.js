#!/usr/bin/env node

/**
 * Script to persist Align360 case study to Vercel Blob storage
 * Run this after deploying to ensure the case study is stored persistently
 */

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

async function persistAlign360() {
  try {
    // Use the deployed URL or localhost for testing
    const apiUrl = process.env.API_URL || "http://localhost:3000"
    const response = await fetch(`${apiUrl}/api/upload`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ metadata: align360Metadata }),
    })

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const result = await response.json()
    console.log("✓ Align360 case study persisted to Blob storage successfully!")
    console.log("Result:", result)
  } catch (error) {
    console.error("✗ Failed to persist Align360 to blob storage:")
    console.error(error)
    process.exit(1)
  }
}

persistAlign360()
