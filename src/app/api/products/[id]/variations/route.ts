import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const variations = await prisma.productVariation.findMany({
    where: { productId: id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(variations)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, value, imageIndex } = body

  const existingCount = await prisma.productVariation.count({
    where: { productId: id },
  })

  if (existingCount >= 8) {
    return NextResponse.json({ error: "Maximum 8 variations allowed" }, { status: 400 })
  }

  const variation = await prisma.productVariation.create({
    data: {
      name,
      value,
      imageIndex: imageIndex || 0,
      productId: id,
    },
  })

  return NextResponse.json(variation)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { variationId, name, value, imageIndex } = await request.json()

  const variation = await prisma.productVariation.update({
    where: { id: variationId },
    data: {
      name,
      value,
      imageIndex: imageIndex || 0,
    },
  })

  return NextResponse.json(variation)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { variationId } = body

  if (variationId === "all") {
    await prisma.productVariation.deleteMany({
      where: { productId: id },
    })
  } else {
    await prisma.productVariation.delete({
      where: { id: variationId },
    })
  }

  return NextResponse.json({ success: true })
}
