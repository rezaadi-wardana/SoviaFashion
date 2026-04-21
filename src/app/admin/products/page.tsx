"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  images: string | null
  sizes: string | null
  colors: string | null
  stock: number
  sku: string
  category: { id: string; name: string } | null
  isFeatured: boolean
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

  useEffect(() => {
    fetchData()
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
                <tr key={product.id} className="border-b border-stone-100">
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-stone-200 rounded-sm flex-shrink-0 overflow-hidden">
                        <Image
                          src={
                            product.images ||
                            "https://placehold.co/48x64/fafaf9/1c1917?text=Product"
                          }
                          alt={product.name}
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-stone-900 text-base font-semibold">
                          {product.name}
                        </p>
                        <p className="text-stone-700 text-xs">
                          {product.colors || "No color"}
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
                        product.stock > 10
                          ? "bg-stone-600 text-white"
                          : product.stock > 0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-stone-400 text-white"
                      }`}
                    >
                      {product.stock > 10
                        ? "In Stock"
                        : product.stock > 0
                        ? "Low Stock"
                        : "Out of Stock"}
                    </span>
                  </td>
                  <td className="py-5 px-4 text-right">
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
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    images: product?.images || "",
    sizes: product?.sizes || "S,M,L,XL",
    colors: product?.colors || "",
    stock: product?.stock || 0,
    sku: product?.sku || "",
    categoryId: product?.category?.id || "",
    isFeatured: product?.isFeatured || false,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
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
          <div className="grid grid-cols-2 gap-4">
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
              <label className="text-stone-700 text-sm block mb-2">Stock</label>
              <input
                type="number"
                value={formData.stock || ""}
                onChange={(e) =>
                  setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                }
                className="w-full py-2 px-4 bg-stone-100 rounded-lg"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">Product Image</label>
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
                      setFormData({ ...formData, images: data.url })
                    }
                  } catch (error) {
                    console.error("Upload failed:", error)
                  }
                }
              }}
              className="w-full py-2 px-4 bg-stone-100 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-stone-600 file:text-white file:cursor-pointer"
            />
            {formData.images && (
              <div className="mt-2 relative w-24 h-24">
                <img
                  src={formData.images}
                  alt="Preview"
                  className="w-full h-full object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, images: "" })}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-stone-700 text-sm block mb-2">SKU</label>
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
              <label className="text-stone-700 text-sm block mb-2">Sizes</label>
              <input
                type="text"
                value={formData.sizes}
                onChange={(e) =>
                  setFormData({ ...formData, sizes: e.target.value })
                }
                className="w-full py-2 px-4 bg-stone-100 rounded-lg"
                placeholder="S,M,L,XL"
              />
            </div>
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">Colors</label>
            <input
              type="text"
              value={formData.colors}
              onChange={(e) =>
                setFormData({ ...formData, colors: e.target.value })
              }
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
              placeholder="Red,Blue,Green"
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