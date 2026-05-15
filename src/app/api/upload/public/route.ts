import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

// Helper: convert File to base64 data URI for Replicate
async function fileToDataUri(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString("base64")
  const mimeType = file.type || "image/png"
  return `data:${mimeType};base64,${base64}`
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Always convert to data URI for Replicate compatibility.
    // This avoids issues with:
    // - Vercel's read-only filesystem
    // - Ngrok free tier interstitial pages blocking Replicate from downloading images
    // - Any URL accessibility issues
    const dataUri = await fileToDataUri(file)

    // Also save to filesystem for local development (so images show in <img> tags)
    const isVercel = !!process.env.VERCEL
    if (!isVercel) {
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`
        const fileName = `public-${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const uploadDir = join(process.cwd(), "public", "uploads")
        await mkdir(uploadDir, { recursive: true })
        const filePath = join(uploadDir, fileName)
        await writeFile(filePath, buffer)
      } catch (fsErr) {
        console.warn("Could not save file to disk (non-critical):", fsErr)
      }
    }

    // Return data URI - Replicate API accepts data URIs directly as input
    return NextResponse.json({ url: dataUri })
  } catch (error) {
    console.error("Public upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
