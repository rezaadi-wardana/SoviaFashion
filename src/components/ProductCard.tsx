import Image from "next/image"
import Link from "next/link"
import { formatPrice, getProductPriceRange } from "@/lib/utils"

/**
 * Mengurai string JSON daftar gambar produk menjadi array string URL.
 * Jika parsing gagal, mengembalikan array berisi string mentah.
 * 
 * @param images - String JSON atau URL tunggal
 * @returns Array dari string URL gambar
 */
export function getProductImages(images: string | null): string[] {
  if (!images) return []
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : [images]
  } catch {
    return [images]
  }
}

interface ProductCardProps {
  product: any
  onClick?: () => void
  href?: string
}

// Main Code Product Card
/**
 * Komponen kartu produk individual (ProductCard) untuk menampilkan gambar utama, kategori,
 * nama produk, serta rentang harga jual. Dapat berfungsi sebagai Link navigasi atau tombol klik biasa.
 * 
 * @param product - Objek detail produk
 * @param onClick - Handler klik manual jika tidak menggunakan href (opsional)
 * @param href - URL tautan katalog untuk detail produk (opsional)
 */
export function ProductCard({ product, onClick, href }: ProductCardProps) {
  const imageUrl = getProductImages(product.images)[0] || `https://placehold.co/400x500/F3EFE6/3C3228?text=${encodeURIComponent(product.name || 'Product')}`
  
  const inner = (
    <>
      <div className="relative aspect-[3/4]">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <p className="text-sovia-500 text-sm mb-1">
          {product.category?.name || "Product"}
        </p>
        <h3 className="text-sovia-900 font-medium mb-2">
          {product.name}
        </h3>
        <p className="text-sovia-900 font-serif">
          {(() => {
            const range = getProductPriceRange(product)
            if (range.hasRange) {
              return `${formatPrice(range.min)} - ${formatPrice(range.max)}`
            }
            return formatPrice(range.min)
          })()}
        </p>
      </div>
    </>
  )

  if (href) {
    return (
      <Link 
        href={href} 
        className="bg-sovia-50 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow block h-full"
      >
        {inner}
      </Link>
    )
  }

  return (
    <div 
      onClick={onClick} 
      className="bg-sovia-50 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow h-full"
    >
      {inner}
    </div>
  )
}
