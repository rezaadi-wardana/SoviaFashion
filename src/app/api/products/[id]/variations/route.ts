import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const variations = await prisma.productVariant.findMany({
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
  const { name, stock, sizes, image } = body

  const existingCount = await prisma.productVariant.count({
    where: { productId: id },
  })

  if (existingCount >= 10) {
    return NextResponse.json({ error: "Maximum 10 variants allowed" }, { status: 400 })
  }

  const variation = await prisma.productVariant.create({
    data: {
      name,
      stock: parseInt(stock) || 0,
      sizes: sizes || null,
      image: image || null,
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
  const { variationId, name, stock, sizes, image } = await request.json()

  const variation = await prisma.productVariant.update({
    where: { id: variationId },
    data: {
      name,
      stock: parseInt(stock) || 0,
      sizes: sizes || null,
      image: image || null,
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
    await prisma.productVariant.deleteMany({
      where: { productId: id },
    })
  } else {
    await prisma.productVariant.delete({
      where: { id: variationId },
    })
  }

  return NextResponse.json({ success: true })
}
