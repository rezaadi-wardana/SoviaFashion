"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Search, Filter, ShoppingCart } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  images: string | null
  sizes: string | null
  colors: string | null
  stock: number
  category: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
}

function CatalogContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || ""
  )
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000])
  const [search, setSearch] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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

  const sizes = ["S", "M", "L", "XL", "XXL"]

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

            {/* Size */}
            <div className="mb-6">
              <label className="text-stone-600 text-sm mb-2 block">Size</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      setSelectedSize(selectedSize === size ? "" : size)
                    }
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      selectedSize === size
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {size}
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
                      src={product.images || "/placeholder.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center">
                        <span className="text-white text-lg font-medium">
                          Out of Stock
                        </span>
                      </div>
                    )}
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
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-[3/4]">
                <Image
                  src={selectedProduct.images || "/placeholder.jpg"}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8 flex flex-col">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
                <p className="text-stone-500 text-sm mb-2">
                  {selectedProduct.category?.name}
                </p>
                <h2 className="text-stone-900 text-2xl font-serif mb-4">
                  {selectedProduct.name}
                </h2>
                <p className="text-stone-600 mb-6">
                  {selectedProduct.description}
                </p>
                <p className="text-stone-900 text-xl font-serif mb-6">
                  {formatPrice(selectedProduct.price)}
                </p>

                {/* Sizes */}
                {selectedProduct.sizes && (
                  <div className="mb-6">
                    <label className="text-stone-600 text-sm mb-2 block">
                      Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.sizes.split(",").map((size) => (
                        <button
                          key={size}
                          className="w-12 h-12 border border-stone-300 rounded-lg flex items-center justify-center text-stone-700 hover:border-stone-900 transition-colors"
                        >
                          {size.trim()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {selectedProduct.colors && (
                  <div className="mb-6">
                    <label className="text-stone-600 text-sm mb-2 block">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.colors.split(",").map((color) => (
                        <button
                          key={color}
                          className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:border-stone-900 transition-colors"
                        >
                          {color.trim()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex gap-4">
                  <button
                    disabled={selectedProduct.stock === 0}
                    className="flex-1 bg-stone-900 text-white py-3 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {selectedProduct.stock === 0
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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