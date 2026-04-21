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

  return NextResponse.json({
    totalRevenue,
    totalProducts,
    totalUsers,
    totalOrders,
    revenueChange: 12,
    ordersByDay: Object.values(revenueByDay),
    topProducts: topProductsWithNames,
  })
}