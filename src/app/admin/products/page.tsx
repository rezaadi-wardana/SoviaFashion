"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

function getProductImages(images: string | null): string[] {
  if (!images) return []
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : [images]
  } catch {
    return [images]
  }
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  images: string | null
  sku: string
  category: { id: string; name: string } | null
  isFeatured: boolean
  variants: { id: string; name: string; stock: number; image: string | null; sizes: string | null; tryOnImage?: string | null }[]
}

interface Category {
  id: string
  name: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchData()
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("new") === "true") {
        setShowModal(true)
        // Clean up URL so it doesn't re-open on refresh
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  async function fetchData() {
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

  async function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Product deleted")
        fetchData()
      } else {
        toast.error("Failed to delete product")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  if (viewingProduct) {
    return (
      <ProductDetailModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onEdit={() => {
          setViewingProduct(null)
          setEditingProduct(viewingProduct)
          setShowModal(true)
        }}
      />
    )
  }

  if (showModal) {
    return (
      <ProductFormModal
        product={editingProduct || undefined}
        categories={categories}
        onClose={() => {
          setShowModal(false)
          setEditingProduct(null)
        }}
        onSave={() => {
          fetchData()
          setShowModal(false)
          setEditingProduct(null)
        }}
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-stone-900 text-3xl font-serif mb-2">
            Inventory Management
          </h1>
          <p className="text-stone-700 text-sm">
            Curate and manage the SOVIA collection.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-stone-600 text-white text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, SKU, or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-stone-200/30 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-700" />
        </div>
        <button className="px-4 py-3 border-b border-stone-300/40 flex items-center gap-2 text-stone-600 text-sm font-medium">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-200/50">
              <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                PRODUCT
              </th>
              <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                SKU
              </th>
              <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                CATEGORY
              </th>
              <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                PRICE
              </th>
              <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                STATUS
              </th>
              <th className="text-right py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-stone-500">
                  Loading...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-stone-500">
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr 
                  key={product.id} 
                  className="border-b border-stone-100 cursor-pointer hover:bg-stone-50"
                  onClick={() => setViewingProduct(product)}
                >
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-4">
                      <Link 
                        href={`/catalog?product=${product.id}`}
                        className="w-12 h-16 bg-stone-200 rounded-sm flex-shrink-0 overflow-hidden hover:opacity-80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={
                            getProductImages(product.images)[0] ||
                            "https://placehold.co/48x64/fafaf9/1c1917?text=Product"
                          }
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div>
                        <Link 
                          href={`/catalog?product=${product.id}`}
                          className="text-stone-900 text-base font-semibold hover:text-stone-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {product.name}
                        </Link>
                        <p className="text-stone-700 text-xs">
                          {product.variants?.length || 0} variants
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-stone-700 text-sm">
                    {product.sku || "-"}
                  </td>
                  <td className="py-5 px-4">
                    <span className="px-3 py-1 bg-gray-400/20 rounded-xl text-xs">
                      {product.category?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="py-5 px-4 text-stone-900 text-sm font-semibold">
                    {formatPrice(product.price)}
                  </td>
                  <td className="py-5 px-4">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs ${
                        (product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0) > 10
                          ? "bg-stone-600 text-white"
                          : (product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0) > 0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-stone-400 text-white"
                      }`}
                    >
                      {(product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0) > 10
                        ? "In Stock"
                        : (product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0) > 0
                        ? "Low Stock"
                        : "Out of Stock"}
                    </span>
                  </td>
                  <td className="py-5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product)
                          setShowModal(true)
                        }}
                        className="p-2 hover:bg-stone-100 rounded"
                      >
                        <Edit className="w-4 h-4 text-stone-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="px-4 py-4 border-t border-stone-200/30 flex justify-between items-center">
          <p className="text-stone-700 text-xs">
            Showing 1 to {filteredProducts.length} of {products.length} items
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                className={`w-8 h-8 rounded-xl text-xs ${
                  page === 1
                    ? "bg-red-300/30 text-stone-600"
                    : "bg-stone-200 text-stone-700"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductFormModal({
  product,
  categories,
  onClose,
  onSave,
}: {
  product?: Product
  categories: Category[]
  onClose: () => void
  onSave: () => void
}) {
  const existingImages = product?.images ? JSON.parse(product.images) : []
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    images: Array.isArray(existingImages) ? existingImages : product?.images ? [product.images] : [],
    sku: product?.sku || "",
    categoryId: product?.category?.id || "",
    isFeatured: product?.isFeatured || false,
  })
  const [variants, setVariants] = useState<{id?: string, name: string, stock: number, image: string, sizes: string, tryOnImage?: string}[]>(
    product?.variants?.map(v => ({ id: v.id, name: v.name, stock: v.stock, image: v.image || "", sizes: v.sizes || "", tryOnImage: v.tryOnImage || "" })) || [{ name: "", stock: 0, image: "", sizes: "", tryOnImage: "" }]
  )
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

      const productData = {
        ...formData,
        images: JSON.stringify(formData.images),
        variants: variants.filter(v => v.name.trim() !== ""),
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (res.ok) {
        const savedProduct = await res.json()
        
        if (product) {
          await fetch(`/api/products/${product.id}/variants`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId: "all" }),
          }).catch(() => {})
          
          for (const v of variants.filter(v => v.name.trim() !== "")) {
            await fetch(`/api/products/${product.id}/variants`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(v),
            })
          }
        }
        
        toast.success(product ? "Product updated" : "Product created")
        onSave()
      } else {
        toast.error("Failed to save product")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-stone-900 text-2xl font-serif mb-6">
          {product ? "Edit Product" : "New Product"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-stone-700 text-sm block mb-2">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
            />
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">Price (Rp)</label>
            <input
              type="number"
              value={formData.price || ""}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
              }
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
              required
              min="0"
              step="1000"
            />
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">
              Product Images (max 5)
            </label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-stone-200">
                  <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = formData.images.filter((_, i) => i !== idx)
                      setFormData({ ...formData, images: newImages })
                    }}
                    className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-bl"
                  >
                    ×
                  </button>
                  <span className="absolute bottom-0 left-0 bg-stone-900/70 text-white text-xs px-1">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
            {formData.images.length < 5 && (
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file && formData.images.length < 5) {
                    const formDataUpload = new FormData()
                    formDataUpload.append("file", file)
                    try {
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formDataUpload,
                      })
                      const data = await res.json()
                      if (data.url) {
                        setFormData({ ...formData, images: [...formData.images, data.url] })
                      }
                    } catch (error) {
                      console.error("Upload failed:", error)
                    }
                  }
                }}
                className="w-full py-2 px-4 bg-stone-100 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-stone-600 file:text-white file:cursor-pointer"
              />
            )}
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">SKU (optional)</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
              placeholder="SKU-001"
            />
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) =>
                setFormData({ ...formData, isFeatured: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label htmlFor="isFeatured" className="text-stone-700 text-sm">
              Featured Product
            </label>
          </div>
          
          <div>
            <label className="text-stone-700 text-sm block mb-2 font-semibold">
              Product Variants (min 1, max 10) *
            </label>
            <p className="text-stone-500 text-xs mb-4">
              Each variant has its own stock, sizes, and optional image. At least 1 variant is required.
            </p>
            <div className="space-y-4 mb-4">
              {variants.map((v, idx) => (
                <div key={idx} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-stone-700">Variant #{idx + 1}</span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                        className="p-1 bg-red-100 text-red-500 rounded hover:bg-red-200 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-stone-600 text-xs block mb-1">Variant Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., Size S, Size M, Color Red, Color Blue"
                        value={v.name}
                        onChange={(e) => {
                          const newVars = [...variants]
                          newVars[idx] = { ...newVars[idx], name: e.target.value }
                          setVariants(newVars)
                        }}
                        className="w-full py-2 px-3 bg-white rounded-lg text-sm"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-stone-600 text-xs block mb-1">Stock *</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={v.stock || ""}
                          onChange={(e) => {
                            const newVars = [...variants]
                            newVars[idx] = { ...newVars[idx], stock: parseInt(e.target.value) || 0 }
                            setVariants(newVars)
                          }}
                          className="w-full py-2 px-3 bg-white rounded-lg text-sm"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-stone-600 text-xs block mb-1">Sizes (optional)</label>
                        <div className="flex gap-2 flex-wrap">
                          {["S", "M", "L", "XL", "XXL"].map((size) => {
                            const selectedSizes = v.sizes ? v.sizes.split(",").filter(Boolean) : []
                            const isChecked = selectedSizes.includes(size)
                            return (
                              <label key={size} className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const newVars = [...variants]
                                    let currentSizes = newVars[idx].sizes ? newVars[idx].sizes.split(",").filter(Boolean) : []
                                    if (e.target.checked) {
                                      currentSizes = [...currentSizes, size]
                                    } else {
                                      currentSizes = currentSizes.filter((s) => s !== size)
                                    }
                                    newVars[idx] = { ...newVars[idx], sizes: currentSizes.join(",") }
                                    setVariants(newVars)
                                  }}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm text-stone-700">{size}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-stone-600 text-xs block mb-1">Variant Image (optional)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const formDataUpload = new FormData()
                                formDataUpload.append("file", file)
                                try {
                                  const res = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formDataUpload,
                                  })
                                  const data = await res.json()
                                  if (data.url) {
                                    const newVars = [...variants]
                                    newVars[idx] = { ...newVars[idx], image: data.url }
                                    setVariants(newVars)
                                  }
                                } catch (error) {
                                  console.error("Upload failed:", error)
                                }
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-white rounded-lg text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-stone-600 file:text-white max-w-[200px] overflow-hidden text-ellipsis"
                          />
                          {v.image && (
                            <div className="relative w-12 h-12 shrink-0">
                              <img src={v.image} alt="Variant" className="w-full h-full object-cover rounded" />
                              <button
                                type="button"
                                onClick={() => {
                                  const newVars = [...variants]
                                  newVars[idx] = { ...newVars[idx], image: "" }
                                  setVariants(newVars)
                                }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-stone-600 text-xs block mb-1">Try-On Image (optional)</label>
                        <p className="text-[10px] text-stone-500 mb-1 leading-tight">Format PNG, tanpa background, untuk Virtual Try-On.</p>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/png"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const formDataUpload = new FormData()
                                formDataUpload.append("file", file)
                                try {
                                  const res = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formDataUpload,
                                  })
                                  const data = await res.json()
                                  if (data.url) {
                                    const newVars = [...variants]
                                    newVars[idx] = { ...newVars[idx], tryOnImage: data.url }
                                    setVariants(newVars)
                                  }
                                } catch (error) {
                                  console.error("Upload failed:", error)
                                }
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-white rounded-lg text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-pink-600 file:text-white max-w-[200px] overflow-hidden text-ellipsis"
                          />
                          {v.tryOnImage && (
                            <div className="relative w-12 h-12 bg-gray-100 rounded shrink-0">
                              <img src={v.tryOnImage} alt="Try On" className="w-full h-full object-contain rounded" />
                              <button
                                type="button"
                                onClick={() => {
                                  const newVars = [...variants]
                                  newVars[idx] = { ...newVars[idx], tryOnImage: "" }
                                  setVariants(newVars)
                                }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {variants.length < 10 && (
              <button
                type="button"
                onClick={() => setVariants([...variants, { name: "", stock: 0, image: "", sizes: "", tryOnImage: "" }])}
                className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                + Add Variant
              </button>
            )}
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-stone-300 rounded-lg text-stone-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-stone-600 text-white rounded-lg disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProductDetailModal({
  product,
  onClose,
  onEdit,
}: {
  product: Product
  onClose: () => void
  onEdit: () => void
}) {
  const productImages = getProductImages(product.images)
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-stone-900 text-2xl font-serif">Product Details</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-2xl">×</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {productImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-stone-100">
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-stone-500 text-sm">Product Name</p>
              <p className="text-stone-900 text-lg font-semibold">{product.name}</p>
            </div>
            <div>
              <p className="text-stone-500 text-sm">Category</p>
              <p className="text-stone-900">{product.category?.name || "Uncategorized"}</p>
            </div>
            <div>
              <p className="text-stone-500 text-sm">Price</p>
              <p className="text-stone-900 text-xl font-serif">{formatPrice(product.price)}</p>
            </div>
            <div>
              <p className="text-stone-500 text-sm">SKU</p>
              <p className="text-stone-900">{product.sku || "-"}</p>
            </div>
            <div>
              <p className="text-stone-500 text-sm">Description</p>
              <p className="text-stone-700">{product.description || "-"}</p>
            </div>
            <div>
              <p className="text-stone-500 text-sm">Total Stock</p>
              <p className="text-stone-900">{product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0} units</p>
            </div>
            <div>
              <p className="text-stone-500 text-sm mb-2">Variants ({product.variants?.length || 0})</p>
              <div className="space-y-2">
                {product.variants?.map((v) => (
                  <div key={v.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {v.image && <img src={v.image} alt={v.name} className="w-10 h-10 object-cover rounded" />}
                      <span className="text-stone-900 font-medium">{v.name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm ${v.stock > 0 ? "text-stone-700" : "text-red-500"}`}>{v.stock} stock</span>
                      {v.sizes && <p className="text-xs text-stone-500">Sizes: {v.sizes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mt-8 pt-6 border-t">
          <button onClick={onClose} className="flex-1 py-3 border border-stone-300 rounded-lg text-stone-600">Close</button>
          <button onClick={onEdit} className="flex-1 py-3 bg-stone-600 text-white rounded-lg">Edit Product</button>
        </div>
      </div>
    </div>
  )
}