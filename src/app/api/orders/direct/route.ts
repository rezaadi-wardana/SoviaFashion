import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { productId, quantity, size, color, price, name, phone, address, lat, lng } = body

  if (!productId || !quantity || !name || !phone || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  const subtotal = price * quantity
  const shippingCost = 25000
  const total = subtotal + shippingCost

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      subtotal,
      shippingCost,
      total,
      shippingMethod: "EXPEDITION",
      paymentMethod: "QRIS",
      recipientName: name,
      phone,
      address,
      lat: lat || 0,
      lng: lng || 0,
      items: {
        create: {
          productId,
          quantity,
          price,
          size: size || null,
          color: color || null,
        },
      },
    },
    include: { items: { include: { product: true } } },
  })

  return NextResponse.json(order)
}