import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const fileName = `public-${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const uploadDir = join(process.cwd(), "public", "uploads")
    
    await mkdir(uploadDir, { recursive: true })
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // The returned URL must be an absolute URL for Replicate
    // Using the host from the request headers
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    
    // For ngrok, we should use the ngrok host if available in env, or trust the request host.
    const baseUrl = process.env.NGROK_HOST || process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    
    const url = `${baseUrl.replace(/\/$/, '')}/uploads/${fileName}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Public upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
