"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/LanguageProvider"
import { formatPrice } from "@/lib/utils"
import { ProductCard } from "@/components/ProductCard"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  images: string | null
  isFeatured: boolean
  category: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
}

interface Hero {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image: string
  link: string | null
  order: number
  isActive: boolean
}

function getProductImages(images: string | null): string[] {
  if (!images) return []
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : [images]
  } catch {
    return [images]
  }
}

export function HomeContent({
  heros,
  featuredProducts,
  latestProducts,
  categories,
}: {
  heros: Hero[]
  featuredProducts: Product[]
  latestProducts: Product[]
  categories: Category[]
}) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen">
      {/* Hero Slider Section */}
      <HeroSliderTranslated slides={heros} />

      {/* Curated For You */}
      <section className="max-w-[1280px] mx-auto px-8 py-24">
        <div className="mb-16">
          <h2 className="text-sovia-900 text-5xl font-serif mb-4">{t("home.curatedForYou")}</h2>
          <p className="text-sovia-700 text-base">
            {t("home.curatedDescription")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {featuredProducts.length > 0 ? (
            featuredProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/catalog?product=${product.id}`}
              />
            ))
          ) : (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#F3EFE6] rounded-lg overflow-hidden">
                  <div className="relative h-[466px] bg-sovia-200">
                    <Image
                      src={`https://placehold.co/373x467/F3EFE6/3C3228?text=Product+${i}`}
                      alt={`Product ${i}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="pt-5">
                    <h3 className="text-sovia-900 text-xl font-serif">
                      Product {i}
                    </h3>
                    <p className="text-sovia-700 text-sm mt-1">Soft Sand</p>
                    <p className="text-sovia-900 text-base font-medium mt-1">
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
            className="text-sovia-600 text-base font-medium border-b-2 border-accent-300 inline-flex items-center gap-2 pb-1"
          >
            {t("home.viewAllCurated")}
            <span className="w-2.5 h-2.5 bg-sovia-600" />
          </Link>
        </div>
      </section>

      {/* Latest Arrivals */}
      <section className="py-24 bg-sovia-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-sovia-900 text-5xl font-serif mb-4">
              {t("home.latestArrivals")}
            </h2>
            <p className="text-sovia-700 text-base max-w-[512px] mx-auto">
              {t("home.latestDescription")}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Product */}
            <div className="w-full lg:w-[696px] relative bg-sovia-50 dark:bg-sovia-800 rounded-lg overflow-hidden">
              <div className="relative h-[400px] sm:h-[500px] lg:h-[708px]">
                <Image
                  src={
                    getProductImages(latestProducts[0]?.images)[0] ||
                    "https://placehold.co/696x708/F3EFE6/3C3228?text=Latest"
                  }
                  alt="Latest Product"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-sovia-50 via-sovia-50/80 to-transparent dark:from-sovia-900 dark:via-sovia-900/80 dark:to-transparent lg:bg-gradient-to-r lg:from-sovia-50/95 lg:via-sovia-50/60 lg:to-transparent lg:dark:from-sovia-900/95 lg:dark:via-sovia-900/60 lg:dark:to-transparent">
                  <span className="px-3 py-1 bg-sovia-50/80 dark:bg-sovia-800/80 rounded-xl text-sovia-600 dark:text-sovia-300 text-xs">
                    {t("home.newSilhouette")}
                  </span>
                  <h3 className="text-sovia-900 dark:text-sovia-50 text-3xl font-serif mt-2">
                    {latestProducts[0]?.name || "The Terracotta Gami"}
                  </h3>
                  <Link
                    href="/catalog"
                    className="text-sovia-600 dark:text-sovia-300 text-sm font-medium underline mt-2 block"
                  >
                    {t("home.shopNow")}
                  </Link>
                </div>
              </div>
            </div>

            {/* Side Products */}
            <div className="flex-1 flex flex-col gap-8">
              <div className="flex-1 relative bg-sovia-50 dark:bg-sovia-800 rounded-lg overflow-hidden min-h-[300px]">
                <Image
                  src={
                    getProductImages(latestProducts[1]?.images)[0] ||
                    "https://placehold.co/488x306/F3EFE6/3C3228?text=Pleated"
                  }
                  alt="Pleated Maxi"
                  fill
                  className="object-cover object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-sovia-50 via-sovia-50/70 to-transparent dark:from-sovia-900 dark:via-sovia-900/70 dark:to-transparent lg:bg-gradient-to-r lg:from-sovia-50/90 lg:via-sovia-50/50 lg:to-transparent lg:dark:from-sovia-900/90 lg:dark:via-sovia-900/50 lg:dark:to-transparent">
                  <h3 className="text-sovia-900 dark:text-sovia-50 text-xl font-serif">
                    {latestProducts[1]?.name || "Pleated Maxi Skirts"}
                  </h3>
                </div>
              </div>

              <div className="flex-1 bg-sovia-50 dark:bg-sovia-800 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
                <h3 className="text-sovia-900 dark:text-sovia-50 text-2xl font-serif text-center">
                  {t("home.summerEssentials")}
                </h3>
                <p className="text-sovia-700 dark:text-sovia-300 text-sm text-center mt-3">
                  {t("home.summerDescription")}
                </p>
                <Link
                  href="/catalog"
                  className="px-6 py-2 bg-accent-500 rounded-xl text-white text-sm font-medium mt-4 hover:bg-accent-600 transition-colors"
                >
                  {t("home.explore")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-[1280px] mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-sovia-900 text-5xl font-serif mb-4">
            {t("home.shopByCategory")}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.length > 0 ? (
            categories.map((category) => (
              <Link
                key={category.id}
                href={`/catalog?category=${category.id}`}
                className="group bg-[#F3EFE6] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-48 bg-sovia-100 overflow-hidden">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sovia-100 to-accent-100">
                      <span className="text-sovia-300 text-5xl font-serif">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 text-center">
                  <h3 className="text-sovia-900 text-lg font-serif">
                    {category.name}
                  </h3>
                  <p className="text-sovia-500 text-sm mt-1">
                    {category.description || t("home.viewCollection")}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            ["Hijab", "Gamis", "Atasan", "Bawahan"].map((cat) => (
              <Link
                key={cat}
                href={`/catalog?category=${cat}`}
                className="bg-[#F3EFE6] rounded-2xl p-8 text-center hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-sovia-100 to-accent-100 rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-sovia-300 text-5xl font-serif">{cat.charAt(0)}</span>
                </div>
                <h3 className="text-sovia-900 text-xl font-serif">{cat}</h3>
                <p className="text-sovia-700 text-sm mt-2">{t("home.shopNow")}</p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

// ─── Translated Hero Slider ───────────────────────────────
import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

function HeroSliderTranslated({ slides }: { slides: Hero[] }) {
  const { t } = useLanguage()

  const defaultSlide: Hero = {
    id: "default",
    title: t("hero.defaultTitle"),
    subtitle: t("hero.defaultSubtitle"),
    description: t("hero.defaultDescription"),
    image: "https://placehold.co/1280x819/F3EFE6/3C3228?text=Summer+Collection",
    link: "/catalog",
    order: 0,
    isActive: true,
  }

  const heroSlides = slides.length > 0 ? slides : [defaultSlide]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 700)
  }, [isTransitioning])

  const goNext = useCallback(() => {
    goToSlide((currentIndex + 1) % heroSlides.length)
  }, [currentIndex, heroSlides.length, goToSlide])

  const goPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + heroSlides.length) % heroSlides.length)
  }, [currentIndex, heroSlides.length, goToSlide])

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (heroSlides.length <= 1) return
    const interval = setInterval(goNext, 5000)
    return () => clearInterval(interval)
  }, [goNext, heroSlides.length])

  const currentSlide = heroSlides[currentIndex]

  return (
    <section className="relative min-h-[500px] sm:min-h-[650px] lg:min-h-[819px] py-20 sm:py-28 bg-accent-100 flex items-center justify-center overflow-hidden">
      {/* Background images with crossfade */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: index === currentIndex ? 1 : 0 }}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover opacity-30 mix-blend-multiply"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Content */}
      <div className="max-w-[1024px] px-4 sm:px-8 flex items-center gap-12 lg:gap-24 relative z-10">
        <div className="w-full lg:w-96 flex flex-col gap-4 sm:gap-6">
          <p
            className="text-sovia-600 text-sm uppercase tracking-wider transition-all duration-500"
            key={`title-${currentIndex}`}
            style={{ animation: "fadeInUp 0.6s ease-out" }}
          >
            {currentSlide.title}
          </p>
          <h1
            className="text-sovia-900 text-4xl sm:text-5xl lg:text-7xl font-serif leading-tight lg:leading-[72px] transition-all duration-500"
            key={`subtitle-${currentIndex}`}
            style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}
          >
            {currentSlide.subtitle || currentSlide.title}
          </h1>
          {currentSlide.description && (
            <p
              className="text-sovia-700 text-base sm:text-lg leading-7 max-w-96 transition-all duration-500"
              key={`desc-${currentIndex}`}
              style={{ animation: "fadeInUp 0.6s ease-out 0.2s both" }}
            >
              {currentSlide.description}
            </p>
          )}
          <Link
            href={currentSlide.link || "/catalog"}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-sovia-500 rounded-lg shadow-lg inline-flex items-center justify-center text-white text-base sm:text-lg font-medium w-fit hover:shadow-xl transition-shadow"
          >
            {t("home.shopTheCollection")}
          </Link>
        </div>
        <div className="w-96 relative hidden lg:block">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className="transition-all duration-700 ease-in-out absolute inset-0"
              style={{
                opacity: index === currentIndex ? 1 : 0,
                transform: index === currentIndex ? "scale(1)" : "scale(0.95)",
              }}
            >
              <div className="bg-[#F3EFE6] rounded-lg shadow-xl overflow-hidden">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  width={448}
                  height={597}
                  className="w-full h-[597px] object-cover"
                  priority={index === 0}
                />
              </div>
            </div>
          ))}
          {/* Keep static element for layout sizing */}
          <div className="invisible">
            <div className="bg-[#F3EFE6] rounded-lg shadow-xl overflow-hidden">
              <div className="w-full h-[597px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {heroSlides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 sm:left-6 bottom-20 sm:top-1/2 sm:-translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/80 hover:bg-white dark:bg-sovia-900/80 dark:hover:bg-sovia-900 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-sovia-900 dark:text-sovia-50" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 sm:right-6 bottom-20 sm:top-1/2 sm:-translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/80 hover:bg-white dark:bg-sovia-900/80 dark:hover:bg-sovia-900 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-sovia-900 dark:text-sovia-50" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? "w-8 h-3 bg-sovia-700"
                    : "w-3 h-3 bg-sovia-400/50 hover:bg-sovia-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* CSS animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}
