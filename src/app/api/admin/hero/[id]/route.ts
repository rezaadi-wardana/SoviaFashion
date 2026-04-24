import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT - update a hero slide
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { title, subtitle, image, link, order, isActive } = body

    const slide = await prisma.hero.update({
      where: { id },
      data: {
        title,
        subtitle: subtitle || null,
        image,
        link: link || null,
        order: order || 0,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(slide)
  } catch (error) {
    console.error("Error updating hero slide:", error)
    return NextResponse.json({ error: "Failed to update slide" }, { status: 500 })
  }
}

// DELETE - delete a hero slide
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.hero.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting hero slide:", error)
    return NextResponse.json({ error: "Failed to delete slide" }, { status: 500 })
  }
}
