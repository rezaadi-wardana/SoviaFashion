"use client"

import Link from "next/link"
import { useLanguage } from "@/components/LanguageProvider"

export function Footer() {
  const { t } = useLanguage()

  const links = [
    { href: "/", label: t("footer.sustainability") },
    { href: "/", label: t("footer.sizeGuide") },
    { href: "/", label: t("footer.shippingReturns") },
    { href: "/", label: t("footer.privacyPolicy") },
  ]

  return (
    <footer className="bg-sovia-100 px-8 py-16">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col items-center">
          <h2 className="text-sovia-600 text-3xl font-['Noto_Serif'] font-normal mb-8">
            SOVIA
          </h2>
          <div className="flex gap-12 mb-8">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sovia-400 text-lg hover:text-sovia-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="text-sovia-600 text-sm">
            {t("footer.copyright", { year: new Date().getFullYear().toString() })}
          </div>
        </div>
      </div>
    </footer>
  )
}