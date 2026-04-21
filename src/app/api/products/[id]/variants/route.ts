import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(variants)
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

  const variant = await prisma.productVariant.create({
    data: {
      name,
      stock: parseInt(stock) || 0,
      sizes: sizes || null,
      image: image || null,
      productId: id,
    },
  })

  return NextResponse.json(variant)
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
  const body = await request.json()
  const { variantId, name, stock, sizes, image } = body

  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      name,
      stock: parseInt(stock) || 0,
      sizes: sizes || null,
      image: image || null,
    },
  })

  return NextResponse.json(variant)
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
  const { variantId } = body

  if (variantId === "all") {
    await prisma.productVariant.deleteMany({
      where: { productId: id },
    })
  } else {
    const variantCount = await prisma.productVariant.count({
      where: { productId: id },
    })
    
    if (variantCount <= 1) {
      return NextResponse.json({ error: "At least 1 variant required" }, { status: 400 })
    }
    
    await prisma.productVariant.delete({
      where: { id: variantId },
    })
  }

  return NextResponse.json({ success: true })
}