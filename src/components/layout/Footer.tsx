"use client"

import Link from "next/link"
import { MapPin, MessageCircle } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"


/**
 * Komponen Footer halaman utama yang menampilkan kontak, tautan sosial media,
 * alamat toko, serta navigasi tautan tambahan seperti kebijakan privasi dan panduan ukuran.
 */
export function Footer() {
  const { t } = useLanguage()
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    fetch("/api/admin/store-profile")
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(console.error)
  }, [])

  const links = [
    { href: "/sustainability", label: t("footer.sustainability") },
    { href: "/size-guide", label: t("footer.sizeGuide") },
    { href: "/shipping-returns", label: t("footer.shippingReturns") },
    { href: "/privacy-policy", label: t("footer.privacyPolicy") },
  ]

  return (
    <footer className={cn("bg-sovia-100 px-4 md:px-8 py-12 md:py-16 transition-all duration-300")}>
      <div className={cn("max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3", pathname.startsWith("/admin") ? "gap-5 lg:mx-8 lg:ps-[13em]" : " gap-12")}>
        
        {/* Brand & Socials */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-sovia-600 text-3xl font-serif font-normal mb-6">
            {profile?.name || 'Sovia Fashion'}
          </h2>
          <div className="text-sovia-500 text-sm space-y-4">
            {profile?.instagram && (
              <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center md:justify-start gap-2 hover:text-sovia-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                <span>{profile.instagram.startsWith('@') ? profile.instagram : `@${profile.instagram}`}</span>
              </a>
            )}
            {profile?.tiktok && (
              <a href={`https://tiktok.com/@${profile.tiktok.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center md:justify-start gap-2 hover:text-sovia-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                </svg>
                <span>{profile.tiktok.startsWith('@') ? profile.tiktok : `@${profile.tiktok}`}</span>
              </a>
            )}
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center justify-center md:justify-start gap-2 hover:text-sovia-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <span>{profile.email}</span>
              </a>
            )}
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
            <a href={`https://wa.me/${profile?.whatsapp || '62895351139282'}`} target="_blank" rel="noreferrer" className="flex items-center justify-center md:justify-start gap-2 hover:text-sovia-600 transition-colors">
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span>{profile?.phone || '+62895-3511-39282'}</span>
            </a>
            <div className="flex items-start justify-center md:justify-start gap-2 text-left">
              <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{profile?.address || 'Jl. Kampung Remitan, Rt. 5 Rw. 3, Bendowangen, Pelemkerep, Mayong, Jepara, Jawa Tengah 59465'}</span>
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