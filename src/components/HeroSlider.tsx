"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image: string
  link: string | null
  order: number
  isActive: boolean
}

const defaultSlide: HeroSlide = {
  id: "default",
  title: "THE SUMMER COLLECTION",
  subtitle: "Editorial Modesty",
  description: "Discover fluid silhouettes and premium fabrics designed for the modern woman. Elegance in every drape.",
  image: "https://placehold.co/1280x819/fafaf9/1c1917?text=Summer+Collection",
  link: "/catalog",
  order: 0,
  isActive: true,
}

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
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
    <section className="relative min-h-[819px] py-28 bg-stone-100 flex items-center justify-center overflow-hidden">
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
      <div className="max-w-[1024px] px-8 flex items-center gap-24 relative z-10">
        <div className="w-96 flex flex-col gap-6">
          <p
            className="text-stone-600 text-sm uppercase tracking-wider transition-all duration-500"
            key={`title-${currentIndex}`}
            style={{ animation: "fadeInUp 0.6s ease-out" }}
          >
            {currentSlide.title}
          </p>
          <h1
            className="text-stone-900 text-7xl font-serif leading-[72px] transition-all duration-500"
            key={`subtitle-${currentIndex}`}
            style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}
          >
            {currentSlide.subtitle || currentSlide.title}
          </h1>
          {currentSlide.description && (
            <p
              className="text-stone-700 text-lg leading-7 max-w-96 transition-all duration-500"
              key={`desc-${currentIndex}`}
              style={{ animation: "fadeInUp 0.6s ease-out 0.2s both" }}
            >
              {currentSlide.description}
            </p>
          )}
          <Link
            href={currentSlide.link || "/catalog"}
            className="px-8 py-4 bg-gradient-to-b from-stone-600 to-red-300 rounded-lg shadow-lg inline-flex items-center justify-center text-white text-lg font-medium w-fit hover:shadow-xl transition-shadow"
          >
            Shop The Collection
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
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
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
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
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
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-stone-700" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-stone-700" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? "w-8 h-3 bg-stone-700"
                    : "w-3 h-3 bg-stone-400/50 hover:bg-stone-400"
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
