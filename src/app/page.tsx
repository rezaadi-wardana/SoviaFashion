import { prisma } from "@/lib/prisma"
import { HomeContent } from "@/components/HomeContent"

async function getHeroSliders() {
  return await prisma.hero.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  })
}

async function getFeaturedProducts() {
  return await prisma.product.findMany({
    where: { isFeatured: true },
    include: { 
      category: true,
      variants: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  })
}

async function getLatestProducts() {
  return await prisma.product.findMany({
    include: { 
      category: true,
      variants: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  })
}

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
  })
}

export default async function HomePage() {
  const [heros, featuredProducts, latestProducts, categories] = await Promise.all([
    getHeroSliders(),
    getFeaturedProducts(),
    getLatestProducts(),
    getCategories(),
  ])

  return (
    <HomeContent
      heros={JSON.parse(JSON.stringify(heros))}
      featuredProducts={JSON.parse(JSON.stringify(featuredProducts))}
      latestProducts={JSON.parse(JSON.stringify(latestProducts))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  )
}