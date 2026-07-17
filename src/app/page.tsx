import { prisma } from "@/lib/prisma"
import { HomeContent } from "@/components/HomeContent"

/**
 * Mengambil daftar slider hero aktif dari database Prisma, diurutkan berdasarkan kolom order.
 */
async function getHeroSliders() {
  return await prisma.hero.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  })
}

/**
 * Mengambil maksimal 8 produk berlabel unggulan (featured) dari database Prisma,
 * lengkap dengan relasi kategori dan variannya.
 */
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

/**
 * Mengambil maksimal 6 produk terbaru berdasarkan tanggal dibuat (createdAt) dari database Prisma.
 */
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

/**
 * Mengambil seluruh kategori dari database Prisma secara terurut berdasarkan nama.
 */
async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
  })
}

/**
 * Komponen utama halaman Beranda (Server Component) yang mengambil data secara paralel
 * dan merendernya menggunakan komponen HomeContent di client.
 */
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