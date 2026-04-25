import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    include: { items: true },
  })

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const totalProducts = await prisma.product.count()
  const totalUsers = await prisma.user.count()
  const totalOrders = orders.length

  const revenueByDay: Record<string, { date: string; orders: number; revenue: number }> = {}
  orders.forEach((order) => {
    const date = order.createdAt.toISOString().split("T")[0]
    if (!revenueByDay[date]) {
      revenueByDay[date] = { date, orders: 0, revenue: 0 }
    }
    revenueByDay[date].orders++
    revenueByDay[date].revenue += order.total
  })

  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        status: "COMPLETED",
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  })

  const topProductsWithNames = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })
      return {
        name: product?.name || "Unknown",
        sold: item._sum.quantity || 0,
        revenue: (item._sum.quantity || 0) * (product?.price || 0),
      }
    })
  )

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } }, items: true },
  })

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split("T")[0]
  })

  const visitorsByDay = last7Days.map((date) => {
    const orderCount = revenueByDay[date]?.orders || 0
    // Generate simulated visitors: base visitors + multiplier of orders + random noise
    const visitors = 45 + (orderCount * 15) + Math.floor(Math.random() * 30)
    return { date, visitors }
  })

  return NextResponse.json({
    totalRevenue,
    totalProducts,
    totalUsers,
    totalOrders,
    revenueChange: 12,
    ordersByDay: Object.values(revenueByDay),
    topProducts: topProductsWithNames,
    recentOrders,
    visitorsByDay,
  })
}