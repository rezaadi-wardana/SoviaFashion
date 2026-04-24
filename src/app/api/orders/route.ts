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
  const {
    items,
    subtotal,
    shippingCost,
    shippingMethod,
    paymentMethod,
    recipientName,
    phone,
    address,
    lat,
    lng,
    courierName,
    courierCode,
    courierService,
    isDirect,
  } = body

  // Untuk direct order, gunakan items dari request body
  // Untuk cart order, ambil dari database
  let orderItems: { productId: string; quantity: number; price: number; size: string | null; color: string | null }[]

  if (isDirect && items?.length > 0) {
    orderItems = items.map((item: { productId: string; quantity: number; price: number; size?: string; color?: string }) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      size: item.size || null,
      color: item.color || null,
    }))
  } else {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: true },
    })

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    orderItems = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.price,
      size: item.size,
      color: item.color,
    }))
  }

  const total = subtotal + shippingCost

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
      courierName: courierName || null,
      courierCode: courierCode || null,
      courierService: courierService || null,
      items: {
        create: orderItems,
      },
    },
    include: { items: { include: { product: true } } },
  })

  // Hapus cart items jika bukan direct order
  if (!isDirect) {
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    })
  }

  return NextResponse.json(order)
}