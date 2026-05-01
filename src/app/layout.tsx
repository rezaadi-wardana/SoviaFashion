import type { Metadata } from "next"
import Script from "next/script"
import { Inter, Noto_Serif } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SOVIA Fashion | Toko Fashion Wanita",
  description: "Toko online fashion wanita dengan koleksi hijab, gamis, atasan, dan bawahan.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${notoSerif.variable}`}>
      <body className="min-h-screen flex flex-col bg-sovia-50 font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </Providers>
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="beforeInteractive" />
      </body>
    </html>
  )
}