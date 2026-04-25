import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  })

  // Auto-complete orders that have been SHIPPED for more than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const toUpdate = orders.filter(o => o.status === "SHIPPED" && new Date(o.updatedAt) < sevenDaysAgo)
  
  if (toUpdate.length > 0) {
    await Promise.all(
      toUpdate.map(o => 
        prisma.order.update({
          where: { id: o.id },
          data: { status: "COMPLETED" }
        })
      )
    )
    
    // Refresh orders after update
    orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    })
  }

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
      status: paymentMethod === "COD" ? "PACKING" : "PENDING_PAYMENT",
      items: {
        create: orderItems,
      },
    },
    include: { items: { include: { product: true } } },
  })

  // Kurangi stok untuk setiap varian produk yang dipesan
  for (const item of orderItems) {
    if (item.color) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          productId: item.productId,
          name: item.color,
        },
      })
      if (variant && variant.stock >= item.quantity) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        })
      } else if (variant) {
        // Jika stok kurang dari yang dipesan (mungkin karena race condition), set ke 0
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: 0 },
        })
      }
    }
  }

  // Hapus cart items jika bukan direct order
  if (!isDirect) {
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    })
  }

  return NextResponse.json(order)
}