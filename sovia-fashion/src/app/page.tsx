import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/utils"
import { auth } from "@/lib/auth"

async function getHeroSliders() {
  return await prisma.hero.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  })
}

async function getFeaturedProducts() {
  return await prisma.product.findMany({
    where: { isFeatured: true },
    include: { category: true },
    take: 8,
  })
}

async function getLatestProducts() {
  return await prisma.product.findMany({
    include: { category: true },
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

  const hero = heros[0] || {
    title: "THE SUMMER COLLECTION",
    subtitle: "Editorial Modesty",
    description: "Discover fluid silhouettes and premium fabrics designed for the modern woman. Elegance in every drape.",
    image: "https://placehold.co/1280x819/fafaf9/1c1917?text=Summer+Collection",
  }


  const session = await auth();
  console.log(session);


  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-[819px] py-28 relative bg-stone-100 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={hero.image}
            alt="Hero"
            fill
            className="object-cover opacity-30 mix-blend-multiply"
          />
        </div>
        <div className="max-w-[1024px] px-8 flex items-center gap-24 relative z-10">
          <div className="w-96 flex flex-col gap-6">
            <p className="text-stone-600 text-sm uppercase tracking-wider">
              {hero.title}
            </p>
            <h1 className="text-stone-900 text-7xl font-serif leading-[72px]">
              {hero.subtitle}
            </h1>
            <p className="text-stone-700 text-lg leading-7 max-w-96">
              {hero.description}
            </p>
            <Link
              href="/catalog"
              className="px-8 py-4 bg-gradient-to-b from-stone-600 to-red-300 rounded-lg shadow-lg inline-flex items-center justify-center text-white text-lg font-medium"
            >
              Shop The Collection
            </Link>
          </div>
          <div className="w-96 relative hidden lg:block">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <Image
                src={hero.image}
                alt="Hero Product"
                width={448}
                height={597}
                className="w-full h-[597px] object-cover"
              />
            </div>
            <div className="px-6 py-3 absolute left-0 -bottom-4 bg-gray-400 rounded-xl shadow">
              <p className="text-neutral-700 text-sm font-medium">Premium Silk Chiffon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Curated For You */}
      <section className="max-w-[1280px] mx-auto px-8 py-24">
        <div className="mb-16">
          <h2 className="text-stone-900 text-5xl font-serif mb-4">Curated For You</h2>
          <p className="text-stone-700 text-base">
            Handpicked selections featuring our newest hijabs and softest blouses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.length > 0 ? (
            featuredProducts.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                href={`/catalog?product=${product.id}`}
                className="group"
              >
                <div className="bg-white rounded-lg overflow-hidden mb-5">
                  <div className="relative h-[466px]">
                    <Image
                      src={product.images || "https://placehold.co/373x467/fafaf9/1c1917?text=Product"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="pt-5">
                    <h3 className="text-stone-900 text-xl font-serif">{product.name}</h3>
                    <p className="text-stone-700 text-sm mt-1">{product.colors || "Various Colors"}</p>
                    <p className="text-stone-900 text-base font-medium mt-1">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden">
                  <div className="relative h-[466px] bg-stone-200">
                    <Image
                      src={`https://placehold.co/373x467/fafaf9/1c1917?text=Product+${i}`}
                      alt={`Product ${i}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="pt-5">
                    <h3 className="text-stone-900 text-xl font-serif">
                      Product {i}
                    </h3>
                    <p className="text-stone-700 text-sm mt-1">Soft Sand</p>
                    <p className="text-stone-900 text-base font-medium mt-1">
                      $45.00
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/catalog"
            className="text-stone-600 text-base font-medium border-b-2 border-red-300 inline-flex items-center gap-2 pb-1"
          >
            View All Curated
            <span className="w-2.5 h-2.5 bg-stone-600" />
          </Link>
        </div>
      </section>

      {/* Latest Arrivals */}
      <section className="py-24 bg-stone-100">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-stone-900 text-5xl font-serif mb-4">
              Latest Arrivals
            </h2>
            <p className="text-stone-700 text-base max-w-[512px] mx-auto">
              Explore the new silhouettes. Trendy gamis and sweeping long skirts
              designed for effortless grace.
            </p>
          </div>

          <div className="flex gap-8">
            {/* Main Product */}
            <div className="w-[696px] relative bg-white rounded-lg overflow-hidden">
              <div className="relative h-[708px]">
                <Image
                  src={
                    latestProducts[0]?.images ||
                    "https://placehold.co/696x708/fafaf9/1c1917?text=Latest"
                  }
                  alt="Latest Product"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-l from-white/90 to-transparent">
                  <span className="px-3 py-1 bg-stone-50/80 rounded-xl text-stone-600 text-xs">
                    New Silhouette
                  </span>
                  <h3 className="text-stone-900 text-3xl font-serif mt-2">
                    {latestProducts[0]?.name || "The Terracotta Gami"}
                  </h3>
                  <Link
                    href="/catalog"
                    className="text-stone-600 text-sm font-medium underline mt-2 block"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Side Products */}
            <div className="flex-1 flex flex-col gap-8">
              <div className="flex-1 relative bg-white rounded-lg overflow-hidden">
                <Image
                  src={
                    latestProducts[1]?.images ||
                    "https://placehold.co/488x306/fafaf9/1c1917?text=Pleated"
                  }
                  alt="Pleated Maxi"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-l from-white/80 to-transparent">
                  <h3 className="text-stone-900 text-xl font-serif">
                    {latestProducts[1]?.name || "Pleated Maxi Skirts"}
                  </h3>
                </div>
              </div>

              <div className="flex-1 bg-white rounded-lg p-8 flex flex-col items-center justify-center">
                <h3 className="text-stone-900 text-2xl font-serif text-center">
                  Summer Essentials
                </h3>
                <p className="text-stone-700 text-sm text-center mt-3">
                  Lightweight layers for warmer days.
                </p>
                <Link
                  href="/catalog"
                  className="px-6 py-2 bg-rose-200 rounded-xl text-stone-600 text-sm font-medium mt-4"
                >
                  Explore
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-[1280px] mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-stone-900 text-5xl font-serif mb-4">
            Shop by Category
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.length > 0 ? (
            categories.map((category) => (
              <Link
                key={category.id}
                href={`/catalog?category=${category.id}`}
                className="bg-white rounded-lg p-8 text-center hover:shadow-lg transition-shadow"
              >
                <h3 className="text-stone-900 text-xl font-serif">
                  {category.name}
                </h3>
                <p className="text-stone-700 text-sm mt-2">
                  {category.description || "Shop now"}
                </p>
              </Link>
            ))
          ) : (
            ["Hijab", "Gamis", "Atasan", "Bawahan"].map((cat) => (
              <Link
                key={cat}
                href={`/catalog?category=${cat}`}
                className="bg-white rounded-lg p-8 text-center hover:shadow-lg transition-shadow"
              >
                <h3 className="text-stone-900 text-xl font-serif">{cat}</h3>
                <p className="text-stone-700 text-sm mt-2">Shop now</p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}