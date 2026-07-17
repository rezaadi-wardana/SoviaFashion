/**
 * PATCH /api/admin/users/[id] — Mengubah peran/role pengguna (USER / ADMIN).
 * DELETE /api/admin/users/[id] — Menghapus akun pengguna (tidak bisa menghapus diri sendiri).
 * Keduanya hanya dapat diakses oleh ADMIN.
 */
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { role } = body

    const user = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: { role },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Prevent deleting oneself
    if (session.user.id === resolvedParams.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    // Hapus semua relasi secara berurutan dalam satu transaction
    // karena Order tidak memiliki onDelete: Cascade ke User di schema
    await prisma.$transaction(async (tx) => {
      // 1. Ambil semua order ID milik user ini
      const userOrders = await tx.order.findMany({
        where: { userId: resolvedParams.id },
        select: { id: true },
      })
      const orderIds = userOrders.map((o) => o.id)

      // 2. Hapus semua OrderItem dari orders milik user
      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: { orderId: { in: orderIds } },
        })
      }

      // 3. Hapus semua Order milik user
      await tx.order.deleteMany({
        where: { userId: resolvedParams.id },
      })

      // 4. Hapus user (CartItem, Account, Session sudah Cascade di schema)
      await tx.user.delete({
        where: { id: resolvedParams.id },
      })
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
