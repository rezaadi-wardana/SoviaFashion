"use client"

import Link from "next/link"
import { MapPin, MessageCircle } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

export function Footer() {
  const { t } = useLanguage()

  const links = [
    { href: "/sustainability", label: t("footer.sustainability") },
    { href: "/size-guide", label: t("footer.sizeGuide") },
    { href: "/shipping-returns", label: t("footer.shippingReturns") },
    { href: "/privacy-policy", label: t("footer.privacyPolicy") },
  ]

  return (
    <footer className="bg-sovia-100 px-4 md:px-8 py-12 md:py-16">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Brand & Socials */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-sovia-600 text-3xl font-serif font-normal mb-6">
            Sovia Fashion
          </h2>
          <div className="text-sovia-500 text-sm space-y-4">
            <a href="https://instagram.com/hijab_bysovia" target="_blank" rel="noreferrer" className="flex items-center justify-center md:justify-start gap-2 hover:text-sovia-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
              <span>@soviaafashion_</span>
            </a>
            <a href="https://tiktok.com/@hijabbysovia" target="_blank" rel="noreferrer" className="flex items-center justify-center md:justify-start gap-2 hover:text-sovia-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
              </svg>
              <span>@soviaafashion_</span>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h3 className="text-sovia-600 font-serif text-xl mb-4">Akses Cepat</h3>
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sovia-500 text-sm hover:text-sovia-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact & Address */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h3 className="text-sovia-600 font-serif text-xl mb-4">Hubungi Kami</h3>
          <div className="text-sovia-500 text-sm space-y-4 max-w-xs">
            <a href="https://wa.me/62895351139282" target="_blank" rel="noreferrer" className="flex items-center justify-center md:justify-start gap-2 hover:text-sovia-600 transition-colors">
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span>+62895-3511-39282</span>
            </a>
            <div className="flex items-start justify-center md:justify-start gap-2 text-left">
              <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
              <span>Jl. Kampung Remitan, Rt. 5 Rw. 3, Bendowangen, Pelemkerep, Mayong, Jepara, Jawa Tengah 59465</span>
            </div>
          </div>
        </div>

      </div>
      
      <div className="max-w-[1280px] mx-auto mt-12 pt-8 border-t border-sovia-200 text-center">
        <div className="text-sovia-500 text-xs">
          {t("footer.copyright", { year: new Date().getFullYear().toString() })}
        </div>
      </div>
    </footer>
  )
}