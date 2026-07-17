import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/orders
 * Mengambil seluruh daftar pesanan dari database beserta data pengguna dan produk yang dipesan.
 * Hanya dapat diakses oleh ADMIN.
 */

export async function GET() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { name: true, images: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching admin orders:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
