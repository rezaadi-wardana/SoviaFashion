/**
 * CRUD kategori produk individual.
 * GET — Mengambil detail kategori beserta produk di dalamnya.
 * PUT (Admin) — Memperbarui nama, deskripsi, dan gambar kategori.
 * DELETE (Admin) — Menghapus kategori dari database.
 */
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const category = await prisma.category.findUnique({
    where: { id },
    include: { products: true },
  })

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  return NextResponse.json(category)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, description, image } = body

  const category = await prisma.category.update({
    where: { id },
    data: {
      name,
      description,
      image,
    },
  })

  revalidatePath('/')
  revalidatePath('/admin/categories')

  return NextResponse.json(category)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  await prisma.category.delete({
    where: { id },
  })

  revalidatePath('/')
  revalidatePath('/admin/categories')

  return NextResponse.json({ success: true })
}
