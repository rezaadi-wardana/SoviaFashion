import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/hero
 * Mengambil seluruh daftar slide hero berurutan berdasarkan order dari database.
 */
export async function GET() {
  try {
    const slides = await prisma.hero.findMany({
      orderBy: { order: "asc" },
    })
    return NextResponse.json(slides)
  } catch (error) {
    console.error("Error fetching hero slides:", error)
    return NextResponse.json([], { status: 500 })
  }
}

/**
 * POST /api/admin/hero
 * Membuat slide hero baru dan menyimpannya ke database. Hanya dapat diakses oleh ADMIN.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, subtitle, image, link, order, isActive } = body

    const slide = await prisma.hero.create({
      data: {
        title,
        subtitle: subtitle || null,
        image,
        link: link || null,
        order: order || 0,
        isActive: isActive ?? true,
      },
    })

    revalidatePath('/')
    revalidatePath('/admin/hero')

    return NextResponse.json(slide)
  } catch (error) {
    console.error("Error creating hero slide:", error)
    return NextResponse.json({ error: "Failed to create slide" }, { status: 500 })
  }
}
