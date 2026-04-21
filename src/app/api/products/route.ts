import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const products = await prisma.product.findMany({
    include: { 
      category: true,
      variants: true,
    },
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
  const { name, description, price, images, sku, categoryId, isFeatured, variants } = body

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: parseFloat(price) || 0,
      images,
      sku: sku || null,
      categoryId: categoryId || null,
      isFeatured: isFeatured || false,
    },
  })

  if (variants && variants.length > 0) {
    await prisma.productVariant.createMany({
      data: variants.map((v: { name: string; stock: number; sizes?: string; image?: string }) => ({
        name: v.name,
        stock: parseInt(v.stock) || 0,
        sizes: v.sizes || null,
        image: v.image || null,
        productId: product.id,
      })),
    })
  }

  return NextResponse.json(product)
}