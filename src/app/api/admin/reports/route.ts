import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const totalOrders = orders.length;
    let totalRevenue = 0;
    let totalProductsSold = 0;
    const ordersByMonthMap: Record<string, { orders: number; revenue: number }> = {};
    const topProductsMap: Record<string, { name: string; sold: number; revenue: number }> = {};
    const ordersByStatusMap: Record<string, number> = {};

    orders.forEach(order => {
      // Sum revenue for all orders (or maybe just those not cancelled, but we'll sum all that have a total)
      if (order.status !== "CANCELLED") {
        totalRevenue += order.total;
        
        // Month grouping (Format: "Jan 2024")
        const date = new Date(order.createdAt);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!ordersByMonthMap[monthYear]) {
          ordersByMonthMap[monthYear] = { orders: 0, revenue: 0 };
        }
        ordersByMonthMap[monthYear].orders += 1;
        ordersByMonthMap[monthYear].revenue += order.total;
      }

      // Status count
      ordersByStatusMap[order.status] = (ordersByStatusMap[order.status] || 0) + 1;

      // Products sold
      if (order.status !== "CANCELLED") {
        order.items.forEach(item => {
          totalProductsSold += item.quantity;
          if (!topProductsMap[item.productId]) {
            topProductsMap[item.productId] = { name: item.product.name, sold: 0, revenue: 0 };
          }
          topProductsMap[item.productId].sold += item.quantity;
          topProductsMap[item.productId].revenue += (item.price * item.quantity);
        });
      }
    });

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByMonth = Object.entries(ordersByMonthMap).map(([month, data]) => ({
      month,
      orders: data.orders,
      revenue: data.revenue
    })).reverse(); // Reverse if you want chronological if keys are somehow sorted? Actually let's just let it be.

    const topProducts = Object.values(topProductsMap)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const ordersByStatus = Object.entries(ordersByStatusMap).map(([status, count]) => ({
      status,
      count
    }));

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalProductsSold,
      averageOrderValue,
      ordersByMonth,
      topProducts,
      ordersByStatus
    });
  } catch (error) {
    console.error("Error fetching admin reports:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
