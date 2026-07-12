import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { 
      category: true,
      variants: true,
    },
  })

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json(product)
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

  // Support partial update (e.g. toggle isFeatured only from table)
  const isPartialUpdate = Object.keys(body).length === 1 && "isFeatured" in body

  let updateData: any

  if (isPartialUpdate) {
    updateData = { isFeatured: body.isFeatured }
  } else {
    const { name, description, price, images, sku, categoryId, isFeatured, video } = body
    updateData = {
      name,
      description,
      price: parseFloat(price) || 0,
      images,
      video: video !== undefined ? video : undefined,
      sku: sku || null,
      categoryId: categoryId || null,
      isFeatured: isFeatured || false,
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/admin/products')
  revalidatePath(`/products/${id}`)

  return NextResponse.json(product)
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

  await prisma.product.delete({
    where: { id },
  })

  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/admin/products')

  return NextResponse.json({ success: true })
}