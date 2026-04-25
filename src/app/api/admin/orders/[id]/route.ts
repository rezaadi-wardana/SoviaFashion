import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { status, isConfirmed, trackingNumber } = body

  const data: any = {}
  if (status !== undefined) data.status = status
  if (isConfirmed !== undefined) data.isConfirmed = isConfirmed
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber

  const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!existingOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // Jika status diubah menjadi CANCELLED dan sebelumnya belum CANCELLED
  if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
    for (const item of existingOrder.items) {
      if (item.color) {
        const variant = await prisma.productVariant.findFirst({
          where: {
            productId: item.productId,
            name: item.color,
          },
        })
        if (variant) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { stock: { increment: item.quantity } },
          })
        }
      }
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data,
  })

  return NextResponse.json(order)
}