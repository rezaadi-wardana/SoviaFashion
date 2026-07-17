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

    await prisma.user.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
