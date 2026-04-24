"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Search, Filter, ShoppingCart, ArrowRight, Plus, Check, Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  images: string | null
  category: { id: string; name: string } | null
  variants: { id: string; name: string; stock: number; image: string | null; sizes: string | null }[]
}

interface Category {
  id: string
  name: string
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedVariant, setSelectedVariant] = useState<{id: string, name: string, stock: number, image: string | null, sizes: string | null} | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [storeWhatsApp, setStoreWhatsApp] = useState<string>("")
  const productImages = getProductImages(product.images)
  const variantSizes = selectedVariant?.sizes ? selectedVariant.sizes.split(",").map(s => s.trim()) : []

  useEffect(() => {
    async function fetchStoreProfile() {
      try {
        const res = await fetch("/api/admin/store-profile")
        if (res.ok) {
          const data = await res.json()
          setStoreWhatsApp(data.whatsapp || "")
        }
      } catch {
        // silently fail
      }
    }
    fetchStoreProfile()
  }, [])

  function redirectToSignIn() {
    router.push("/auth/signin?callbackUrl=/catalog")
  }

  async function handleAddToCart() {
    if (!selectedVariant) return

    if (!session?.user?.id) {
      redirectToSignIn()
      return
    }

    setLoading(true)
    setAddedToCart(false)
    try {
      const cartRes = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          size: selectedSize || selectedVariant.sizes || null,
          color: selectedVariant.name,
        }),
      })

      if (cartRes.ok) {
        // Keep loading spinner for 1.5 seconds
        await new Promise(resolve => setTimeout(resolve, 1500))
        setLoading(false)
        setAddedToCart(true)
        toast.success("Produk berhasil ditambahkan ke keranjang!")
        // Reset success state after 1.5 seconds
        setTimeout(() => setAddedToCart(false), 1500)
      } else {
        const data = await cartRes.json()
        toast.error(data.error || "Failed to add to cart")
        setLoading(false)
      }
    } catch {
      toast.error("An error occurred")
      setLoading(false)
    }
  }

  async function handleBuyNow() {
    if (!selectedVariant) return

    if (!session?.user?.id) {
      redirectToSignIn()
      return
    }

    const directOrderData = {
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: selectedVariant?.image || productImages[0] || null,
      quantity,
      size: selectedSize || selectedVariant.sizes || null,
      color: selectedVariant.name,
      price: product.price,
    }

    sessionStorage.setItem("directOrder", JSON.stringify(directOrderData))
    window.location.href = "/checkout"
  }

  function handleWhatsAppChat() {
    if (!storeWhatsApp) {
      toast.error("Nomor WhatsApp toko belum tersedia")
      return
    }

    const message = `Halo, saya tertarik dengan produk *${product.name}*${
      selectedVariant ? ` (Varian: ${selectedVariant.name})` : ""
    } dengan harga ${formatPrice(product.price)}. Apakah masih tersedia?`

    const url = `https://wa.me/${storeWhatsApp}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }
  
  return (
    <div
      className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-[3/4]">
            <Image
              src={
                selectedVariant?.image || 
                productImages[0] || 
                "/placeholder.jpg"
              }
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-8 flex flex-col">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
            >
              ✕
            </button>
            <p className="text-stone-500 text-sm mb-2">
              {product.category?.name}
            </p>
            <h2 className="text-stone-900 text-2xl font-serif mb-2">
              {product.name}
            </h2>
            <p className="text-stone-900 text-xl font-serif mb-4">
              {formatPrice(product.price)}
            </p>
            <p className="text-stone-600 mb-6">
              {product.description}
            </p>

            <div className="mb-6">
              <label className="text-stone-600 text-sm mb-2 block">
                Select Variant *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants?.map((variant) => (
                  <button
                    key={variant.id}
                    disabled={variant.stock === 0}
                    onClick={() => {
                      setSelectedVariant(variant)
                      setSelectedSize("")
                    }}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedVariant?.id === variant.id
                        ? "border-stone-900 bg-stone-900 text-white"
                        : variant.stock === 0
                        ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                        : "border-stone-300 hover:border-stone-900"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{variant.name}</span>
                      <span className={`text-xs ${variant.stock === 0 ? "text-red-400" : "text-stone-500"}`}>
                        {variant.stock > 0 ? `${variant.stock} avail` : "OOS"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {selectedVariant && variantSizes.length > 0 && (
              <div className="mb-6">
                <label className="text-stone-600 text-sm mb-2 block">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {variantSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-10 h-10 border rounded-lg transition-colors ${
                        selectedSize === size
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-300 hover:border-stone-900"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedVariant && (
              <div className="mb-6">
                <label className="text-stone-600 text-sm mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                    disabled={quantity >= selectedVariant.stock}
                    className="w-10 h-10 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                <p className="text-stone-500 text-sm mt-1">
                  Stock: {selectedVariant.stock}
                </p>
              </div>
            )}

            <div className="mt-auto space-y-3">
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0 || !selectedSize || loading || addedToCart}
                  className={`flex-1 py-3 rounded-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    addedToCart
                      ? "bg-green-600 border border-green-600 text-white"
                      : "bg-white border border-stone-900 text-stone-900 hover:bg-stone-100 disabled:opacity-50"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : addedToCart ? (
                    <>
                      <Check className="w-5 h-5" />
                      Added!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Add Cart
                    </>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!selectedVariant || selectedVariant.stock === 0 || !selectedSize || loading}
                  className="flex-1 bg-stone-900 text-white py-3 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  Buy Now
                </button>
              </div>
              {/* WhatsApp Chat Button */}
              <button
                onClick={handleWhatsAppChat}
                className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <WhatsAppIcon className="w-5 h-5" />
                Chat Penjual
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CatalogContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || ""
  )
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000])
  const [search, setSearch] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ])
        const productsData = await productsRes.json()
        const categoriesData = await categoriesRes.json()
        setProducts(productsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredProducts = products.filter((product) => {
    if (selectedCategory && product.category?.id !== selectedCategory) return false
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false
    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-[1280px] mx-auto px-8 flex gap-12">
        {/* Sidebar Filters */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-lg shadow-lg sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-stone-600" />
              <h2 className="text-stone-900 text-lg font-serif">Filters</h2>
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="text-stone-600 text-sm mb-2 block">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <Search className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="text-stone-600 text-sm mb-2 block">
                Category
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === ""
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-stone-600 text-sm mb-2 block">
                Price Range
              </label>
              <div className="space-y-4">
                <input
                  type="range"
                  min={0}
                  max={1000000}
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-stone-600 text-sm">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="aspect-[3/4] bg-stone-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                    <div className="h-4 bg-stone-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={getProductImages(product.images)[0] || "/placeholder.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-stone-500 text-sm mb-1">
                      {product.category?.name}
                    </p>
                    <h3 className="text-stone-900 font-medium mb-2">
                      {product.name}
                    </h3>
                    <p className="text-stone-900 font-serif">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-stone-600 text-lg">No products found</p>
              <Link
                href="/catalog"
                className="text-stone-600 text-sm underline mt-2 block"
              >
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  )
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse"
              >
                <div className="aspect-[3/4] bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  )
}