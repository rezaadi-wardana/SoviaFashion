/**
 * POST /api/upload (Admin)
 * Mengunggah dan memproses gambar produk.
 * Gambar dikompresi ke WebP (resize 1920px, quality 80%) menggunakan Sharp,
 * lalu disimpan ke Vercel Blob (production) atau folder public/uploads/ (local).
 */
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { auth } from "@/lib/auth"
import sharp from "sharp"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Process image with sharp (resize + convert to webp)
    let finalBuffer: Buffer = buffer;
    let fileName = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
      try {
        finalBuffer = await sharp(buffer)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        fileName = `${uniqueSuffix}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}.webp`;
      } catch (e) {
        console.error("Sharp processing failed, saving original file", e);
      }
    }

    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

    if (useBlob) {
      // Production (Vercel): Upload to Vercel Blob Storage
      const blob = await put(`uploads/${fileName}`, finalBuffer, {
        access: "public",
        contentType: fileName.endsWith(".webp") ? "image/webp" : file.type,
        addRandomSuffix: false,
        allowOverwrite: true,
      })

      console.log("✅ Uploaded to Vercel Blob:", blob.url)
      return NextResponse.json({ url: blob.url })
    } else {
      // Local development: Save to public/uploads/
      const uploadDir = join(process.cwd(), "public", "uploads")
      await mkdir(uploadDir, { recursive: true })
      const filePath = join(uploadDir, fileName)
      await writeFile(filePath, finalBuffer)

      const url = `/uploads/${fileName}`
      return NextResponse.json({ url })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
