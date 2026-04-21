import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, price, images, sizes, colors, stock, sku, categoryId, isFeatured } = body

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: parseFloat(price) || 0,
      images,
      sizes,
      colors,
      stock: parseInt(stock) || 0,
      sku: sku || null,
      categoryId: categoryId || null,
      isFeatured: isFeatured || false,
    },
  })

  return NextResponse.json(product)
}