import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { items, subtotal, shippingCost, total, shippingMethod, paymentMethod, recipientName, phone, address, lat, lng } = body

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: true },
  })

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
  }

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      subtotal,
      shippingCost,
      total,
      shippingMethod,
      paymentMethod,
      recipientName,
      phone,
      address,
      lat,
      lng,
      items: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          size: item.size,
          color: item.color,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  })

  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id },
  })

  return NextResponse.json(order)
}