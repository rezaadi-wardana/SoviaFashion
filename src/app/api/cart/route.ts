import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: { category: true, variants: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(cartItems)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { productId, quantity = 1, size, color } = body

  const existing = await prisma.cartItem.findFirst({
    where: {
      userId: session.user.id,
      productId,
      size,
      color,
    },
  })

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        userId: session.user.id,
        productId,
        quantity,
        size,
        color,
      },
    })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { productId, quantity } = body

  const existing = await prisma.cartItem.findFirst({
    where: {
      userId: session.user.id,
      productId,
    },
  })

  if (existing) {
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: existing.id } })
    } else {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity },
      })
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get("itemId")

  if (itemId) {
    await prisma.cartItem.delete({
      where: { id: itemId, userId: session.user.id },
    })
  } else {
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    })
  }

  return NextResponse.json({ success: true })
}