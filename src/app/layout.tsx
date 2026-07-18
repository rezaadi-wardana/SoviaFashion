import type { Metadata } from "next"
import Script from "next/script"
import { Inter, Noto_Serif, Geist } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Sovia Fashion | Toko Fashion Wanita",
  description: "Toko online fashion wanita dengan koleksi hijab, gamis, atasan, dan bawahan.",
  icons: {
    icon: '/sovia-logo.png',
  },
}

/**
 * Komponen Layout Utama (Root Layout) aplikasi.
 * Menangani pengaturan font Google, metadata SEO, injeksi skrip pencegahan flash tema/bahasa,
 * pembungkus Providers, penyediaan Navbar, elemen Main, dan Footer global.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={cn(inter.variable, notoSerif.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        {/* Inline script to apply saved dark mode & language before paint — prevents FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('sovia-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                  var lang = localStorage.getItem('sovia-lang');
                  if (lang === 'en' || lang === 'id') {
                    document.documentElement.setAttribute('lang', lang);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <meta name="dicoding:email" content="Wardhana15.aw@gmail.com"></meta>
      </head>
      <body className="min-h-screen flex flex-col bg-sovia-50 font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </Providers>
        <Toaster position="bottom-right" richColors />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="beforeInteractive" />
      </body>
    </html>
  )
}