"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Edit, Trash2, Search, ChevronDown, PackageX, Loader2, ImagePlus, X, GripVertical, AlertCircle, Copy, Filter, Eye } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import LoadingOverlay from "@/components/ui/LoadingOverlay"
import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

const MAX_UPLOAD_SIZE = 3 * 1024 * 1024; // 3MB max after compression

const compressImage = async (file: File, maxWidth = 1080): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Gagal membuat canvas untuk kompresi gambar"));

        ctx.drawImage(img, 0, 0, width, height);

        // Always use WebP - supports transparency AND great compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              if (blob.size > MAX_UPLOAD_SIZE) {
                // Try again with lower quality
                canvas.toBlob(
                  (blob2) => {
                    if (blob2 && blob2.size <= MAX_UPLOAD_SIZE) {
                      resolve(new File([blob2], file.name.replace(/\.[^/.]+$/, ".webp"), { type: "image/webp", lastModified: Date.now() }));
                    } else {
                      // Use whatever we got, even if still large
                      resolve(new File([blob2 || blob], file.name.replace(/\.[^/.]+$/, ".webp"), { type: "image/webp", lastModified: Date.now() }));
                    }
                  },
                  "image/webp",
                  0.5
                );
              } else {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), { type: "image/webp", lastModified: Date.now() }));
              }
            } else {
              reject(new Error("Gagal mengompresi gambar. Coba gambar lain."));
            }
          },
          "image/webp",
          0.8
        );
      };
      img.onerror = () => reject(new Error("Gagal membaca file gambar. Pastikan file adalah gambar yang valid."));
    };
    reader.onerror = () => reject(new Error("Gagal membaca file. Pastikan file tidak rusak."));
  });
};

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
  video?: string | null
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
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; productId: string | null }>({ isOpen: false, productId: null })
  const [uploadingMainImages, setUploadingMainImages] = useState(false)
  const [uploadingVariantId, setUploadingVariantId] = useState<number | null>(null)
  const [uploadingTryOnId, setUploadingTryOnId] = useState<number | null>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategory])

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

      let productsData = []
      let categoriesData = []

      if (productsRes.ok) {
        const text = await productsRes.text()
        if (text) {
          try {
            productsData = JSON.parse(text)
          } catch (e) {
            console.error("Failed to parse products JSON:", e)
          }
        }
      } else {
        console.error("Products API error:", productsRes.status, await productsRes.text().catch(() => ""))
      }

      if (categoriesRes.ok) {
        const text = await categoriesRes.text()
        if (text) {
          try {
            categoriesData = JSON.parse(text)
          } catch (e) {
            console.error("Failed to parse categories JSON:", e)
          }
        }
      } else {
        console.error("Categories API error:", categoriesRes.status, await categoriesRes.text().catch(() => ""))
      }

      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(productId: string) {
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

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.category?.id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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

  if (loading) return <LoadingOverlay />

  return (
    <div>
      {/* Sticky Header Wrapper */}
      <div className="sticky top-0 z-20 bg-sovia-50 backdrop-blur-sm pt-4 pb-4 -mt-4 -mx-4 px-4 mb-6 border-b border-sovia-200/50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-sovia-900 text-3xl font-serif mb-2">
              Manajemen Produk
            </h1>
            <p className="text-sovia-700 text-sm">
              Kelola koleksi product dari Sovia Fashion
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 text-sm font-medium rounded-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Product
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            {/* <input
              type="text"
              placeholder="Search by name, SKU, or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-sovia-50 border border-sovia-200/50 rounded-lg text-sm focus:outline-none focus:border-sovia-400 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sovia-700" /> */}
             <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-sovia-200/30 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sovia-700" />
          </div>
          <CategorySelect
            categories={categories}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-sovia-50 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-sovia-200/50">
                <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase whitespace-nowrap">
                  PRODUCT
                </th>
                <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase whitespace-nowrap">
                  SKU
                </th>
                <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase whitespace-nowrap">
                  CATEGORY
                </th>
                <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase whitespace-nowrap">
                  PRICE
                </th>
                <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase whitespace-nowrap">
                  STOCK
                </th>
                <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase whitespace-nowrap">
                  STATUS
                </th>
                <th className="text-right py-4 px-4 text-sovia-700 text-xs font-semibold uppercase whitespace-nowrap">
                  ACTIONS
                </th>
              </tr>
            </thead>
          <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sovia-500">
                    No products found
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-sovia-100 cursor-pointer hover:bg-sovia-50"
                    onClick={() => setViewingProduct(product)}
                  >
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/catalog?product=${product.id}`}
                          className="w-12 h-16 bg-sovia-200 rounded-sm flex-shrink-0 overflow-hidden hover:opacity-80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img
                            src={
                              getProductImages(product.images)[0] ||
                              "https://placehold.co/48x64/F3EFE6/3C3228?text=Product"
                            }
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        <div>
                          <Link
                            href={`/catalog?product=${product.id}`}
                            className="text-sovia-900 text-base font-semibold hover:text-sovia-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {product.name}
                          </Link>
                          <p className="text-sovia-700 text-xs">
                            {product.variants?.length || 0} variants
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-sovia-700 text-sm">
                      {product.sku || "-"}
                    </td>
                    <td className="py-5 px-4">
                      <span className="px-3 py-1 bg-sovia-400/20 rounded-xl text-xs">
                        {product.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-sovia-900 text-sm font-semibold">
                      {formatPrice(product.price)}
                    </td>
                    <td className="py-5 px-4 text-sovia-700 text-sm">
                      {product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0}
                    </td>
                    <td className="py-5 px-4">
                      <span
                        className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs ${(product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0) > 10
                          ? "bg-sovia-600 text-sovia-50"
                          : (product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0) > 0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-sovia-400 text-sovia-50"
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
                          className="p-2 hover:bg-yellow-900 hover:text-sovia-50 rounded transition-all active:scale-95"
                        >
                          <Edit className="w-4 h-4 dark:text-sovia-700" />
                        </button>
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, productId: product.id })}
                          className="p-2 hover:bg-rose-900 hover:text-sovia-50 rounded transition-all active:scale-95"
                        >
                          <Trash2 className="w-4 h-4 dark:text-sovia-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-4 border-t border-sovia-200/30 flex justify-between items-center">
          <p className="text-sovia-700 text-xs">
            Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} items
          </p>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl text-xs transition-all active:scale-95 ${page === currentPage
                  ? "bg-sovia-700 text-sovia-50 hover:bg-sovia-600"
                  : "bg-sovia-200 text-sovia-800 hover:bg-sovia-500"
                  }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-sovia-50 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-rose-600">
                Hapus Produk
              </h2>
              <p className="text-sm text-sovia-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus produk ini? Semua data varian dan gambar yang terkait juga akan dihapus. Aksi ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="px-6 py-4 bg-sovia-50 border-t border-sovia-100 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, productId: null })}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-sovia-200 shadow-sm active:transform-[scale(0.95)] ${"text-sovia-700 hover:bg-sovia-100 bg-sovia-50"}`}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (confirmModal.productId) {
                    handleDelete(confirmModal.productId);
                  }
                  setConfirmModal({ isOpen: false, productId: null });
                }}
                className="px-4 py-2 text-sm font-medium text-sovia-50 bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors active:transform-[scale(0.95)]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
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
    video: product?.video || "",
  })
  const [variants, setVariants] = useState<{ id?: string, name: string, stock: number, price: number | "", buyPrice: number | "", image: string, sizesList: { name: string, stock: number, price: number | "", buyPrice: number | "" }[], tryOnImage?: string }[]>(
    product?.variants?.map((v: any) => {
      let sizesList: { name: string, stock: number, price: number | "", buyPrice: number | "" }[] = []
      if (v.sizes) {
        sizesList = v.sizes.split(",").filter(Boolean).map((s: string) => {
          const [name, stockStr, priceStr, buyPriceStr] = s.split(":")
          return { name: name.trim(), stock: stockStr !== undefined ? parseInt(stockStr) : 0, price: priceStr !== undefined && priceStr !== "" ? parseFloat(priceStr) : "", buyPrice: buyPriceStr !== undefined && buyPriceStr !== "" ? parseFloat(buyPriceStr) : "" }
        })
      }
      if (sizesList.length === 0) {
        sizesList = [{ name: "All Size", stock: v.stock || 0, price: v.price || "", buyPrice: v.buyPrice || "" }]
      }
      return { id: v.id, name: v.name, stock: v.stock, price: v.price || "", buyPrice: v.buyPrice || "", image: v.image || "", sizesList, tryOnImage: v.tryOnImage || "" }
    }) || [{ name: "", stock: 0, price: "", buyPrice: "", image: "", sizesList: [{ name: "", stock: 0, price: "", buyPrice: "" }], tryOnImage: "" }]
  )
  const [saving, setSaving] = useState(false)
  const [uploadingMainImages, setUploadingMainImages] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingVariantId, setUploadingVariantId] = useState<number | null>(null)
  const [uploadingTryOnId, setUploadingTryOnId] = useState<number | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

      const productData = {
        ...formData,
        images: JSON.stringify(formData.images),
        variants: variants.filter(v => v.name.trim() !== "").map(v => {
          const validSizes = v.sizesList ? v.sizesList.filter(sz => sz.name.trim() !== "") : [];
          const hasSizes = validSizes.length > 0;
          const totalStock = hasSizes ? validSizes.reduce((sum, sz) => sum + sz.stock, 0) : v.stock;
          const sizesStr = hasSizes ? validSizes.map(sz => `${sz.name.trim()}:${sz.stock}:${sz.price !== "" ? sz.price : ""}:${sz.buyPrice !== "" ? sz.buyPrice : ""}`).join(",") : "";
          return { ...v, stock: totalStock, sizes: sizesStr, price: v.price !== "" ? (v.price as number) : null, buyPrice: v.buyPrice !== "" ? (v.buyPrice as number) : null };
        }),
      }

      // Auto-calculate minimum selling price
      let minSellingPrice = Infinity;
      productData.variants.forEach((v: any) => {
        if (v.price !== null) minSellingPrice = Math.min(minSellingPrice, v.price);
        if (v.sizes) {
          v.sizes.split(",").forEach((s: string) => {
            const parts = s.split(":");
            if (parts.length >= 3 && parts[2] !== "") {
              minSellingPrice = Math.min(minSellingPrice, parseFloat(parts[2]));
            }
          });
        }
      });
      if (minSellingPrice === Infinity) minSellingPrice = 0;
      productData.price = minSellingPrice;

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
          }).catch(() => { })

          for (const v of productData.variants) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-2xl w-full">
        {/* Tombol Close overlap */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-10 h-10 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-full flex items-center justify-center shadow-lg z-50 transition-all text-2xl font-light active:transform-[scale(0.95)]"
        >
          ×
        </button>

        <div className="bg-sovia-50 rounded-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
          <div className="px-6 md:px-8 py-5 border-b border-sovia-200 bg-sovia-50 shrink-0 z-10 shadow-sm relative">
            <h2 className="text-sovia-900 text-2xl font-serif">
              {product ? "Edit Product" : "New Product"}
            </h2>
          </div>
          <div className="p-6 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sovia-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-sovia-400">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full py-2 px-4 bg-sovia-100 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Description</label>
              <div className="bg-sovia-100 rounded-lg overflow-hidden border border-sovia-200 quill-custom-theme">
                <ReactQuill
                  theme="snow"
                  value={formData.description || ""}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  className="[&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[150px]"
                />
              </div>
            </div>
            {/* Removed Global Price Input */}
            <div>
              <label className="text-sovia-700 text-sm block mb-2">
                Product Images (max 5)
              </label>
              <div className="grid grid-cols-5 gap-2 mb-2">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-sovia-200">
                    <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = formData.images.filter((_, i) => i !== idx)
                        setFormData({ ...formData, images: newImages })
                      }}
                      className="absolute top-0 right-0 w-5 h-5 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-bl"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-0 left-0 bg-sovia-900/70 text-sovia-50 text-xs px-1">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
              {formData.images.length < 5 && (
                uploadingMainImages ? (
                  <div className="w-full py-2 px-4 bg-sovia-100 rounded-lg flex items-center justify-center gap-2 text-sovia-600 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin" /> Mengunggah...
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      let file = e.target.files?.[0]
                      if (file && formData.images.length < 5) {
                        setUploadingMainImages(true);
                        const loadingToast = toast.loading("Mengunggah gambar...");
                        try {
                          file = await compressImage(file, 1080);
                          const formDataUpload = new FormData()
                          formDataUpload.append("file", file)
                          const res = await fetch("/api/upload", {
                            method: "POST",
                            body: formDataUpload,
                          })
                          const data = await res.json()
                          if (data.url) {
                            setFormData({ ...formData, images: [...formData.images, data.url] })
                            toast.success("Gambar berhasil diunggah", { id: loadingToast });
                          } else {
                            throw new Error(data.error || "Upload failed");
                          }
                        } catch (error) {
                          console.error("Upload failed:", error)
                          toast.error("Gagal mengunggah gambar", { id: loadingToast });
                        } finally {
                          setUploadingMainImages(false);
                        }
                      }
                    }}
                    className="w-full py-2 px-4 bg-sovia-100 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-sovia-600 file:text-sovia-50 file:cursor-pointer"
                  />
                )
              )}
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">
                Product Video (Optional)
              </label>
              {formData.video ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-sovia-200 mb-2">
                  <video src={formData.video} controls className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, video: "" })}
                    className="absolute top-2 right-2 w-6 h-6 hover:bg-rose-600 text-rose-50 bg-rose-500 rounded flex items-center justify-center z-10 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : uploadingVideo ? (
                <div className="w-full py-2 px-4 bg-sovia-100 rounded-lg flex items-center justify-center gap-2 text-sovia-600 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" /> Mengunggah video...
                </div>
              ) : (
                <input
                  type="file"
                  accept="video/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 15 * 1024 * 1024) {
                      toast.error("Ukuran video maksimal 15MB")
                      return
                    }
                    setUploadingVideo(true)
                    const loadingToast = toast.loading("Mengunggah video...")
                    try {
                      const formDataUpload = new FormData()
                      formDataUpload.append("file", file)
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formDataUpload,
                      })
                      const data = await res.json()
                      if (data.url) {
                        setFormData({ ...formData, video: data.url })
                        toast.success("Video berhasil diunggah", { id: loadingToast })
                      } else {
                        throw new Error(data.error || "Upload failed")
                      }
                    } catch (error) {
                      console.error("Video upload failed:", error)
                      toast.error("Gagal mengunggah video", { id: loadingToast })
                    } finally {
                      setUploadingVideo(false)
                    }
                  }}
                  className="w-full py-2 px-4 bg-sovia-100 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-sovia-600 file:text-sovia-50 file:cursor-pointer"
                />
              )}
              <p className="text-xs text-sovia-500 mt-1">Maks. 15MB. Gunakan resolusi 480p atau 720p (terkompres) untuk loading lebih cepat.</p>
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">SKU (optional)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className="w-full py-2 px-4 bg-sovia-100 rounded-lg"
                placeholder="SKU-001"
              />
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full py-2 px-4 bg-sovia-100 rounded-lg"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>


            <div>
              <label className="text-sovia-700 text-sm block mb-2 font-semibold">
                Product Variants (min 1, max 10) *
              </label>
              <p className="text-sovia-500 text-xs mb-4">
                Each variant has its own stock, sizes, and optional image. At least 1 variant is required.
              </p>
              <div className="space-y-4 mb-4">
                {variants.map((v, idx) => (
                  <div key={idx} className="p-4 bg-sovia-100 rounded-lg border border-sovia-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-sovia-700">Variant #{idx + 1}</span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                          className="px-2 py-0.5 bg-rose-500 font-medium text-rose-50 rounded-md hover:bg-rose-600 text-sm transition duration-300 active:transform-[scale(0.95)]"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sovia-600 text-xs block mb-1">Variant Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., Size S, Size M, Color Red, Color Blue"
                          value={v.name}
                          onChange={(e) => {
                            const newVars = [...variants]
                            newVars[idx] = { ...newVars[idx], name: e.target.value }
                            setVariants(newVars)
                          }}
                          className="w-full py-2 px-3 rounded-lg text-sm border bg-sovia-50"
                          required
                        />
                      </div>
                      
                      {/* Variant Prices Removed - Enforced at Size Level */}

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div className="space-y-3">
                              {/* Desktop Headers */}
                              <div className="hidden md:flex gap-2 px-1">
                                <div className="flex-1 text-sovia-600 text-xs">Size Name</div>
                                <div className="w-24 text-sovia-600 text-xs">Stock</div>
                                <div className="w-32 text-sovia-600 text-xs">Harga Jual</div>
                                <div className="w-32 text-sovia-600 text-xs">Harga Beli</div>
                                {v.sizesList.length > 1 && <div className="w-6"></div>}
                              </div>
                              
                              {v.sizesList.map((sizeObj, sizeIdx) => (
                                <div key={sizeIdx} className="flex flex-col md:flex-row gap-2 md:items-center bg-sovia-50 p-3 md:p-0 md:bg-transparent rounded-lg">
                                  <div className="flex-1">
                                    <span className="md:hidden text-sovia-600 text-xs block mb-1">Size Name</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. S, 42"
                                      value={sizeObj.name}
                                      onChange={(e) => {
                                        const newVars = [...variants];
                                        newVars[idx].sizesList[sizeIdx].name = e.target.value;
                                        setVariants(newVars);
                                      }}
                                      className="w-full py-1.5 px-3 bg-sovia-50 md:bg-sovia-50 rounded-lg text-sm border md:border-0"
                                    />
                                  </div>
                                  <div className="flex flex-wrap md:flex-nowrap gap-2 items-end">
                                    <div className="w-20 md:w-24 flex-1 md:flex-none">
                                      <span className="md:hidden text-sovia-600 text-xs block mb-1">Stock</span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={sizeObj.stock === 0 ? "" : sizeObj.stock}
                                        onChange={(e) => {
                                          const newVars = [...variants];
                                          newVars[idx].sizesList[sizeIdx].stock = parseInt(e.target.value) || 0;
                                          setVariants(newVars);
                                        }}
                                        className="w-full py-1.5 px-3 bg-sovia-50 md:bg-sovia-50 rounded-lg text-sm border md:border-0"
                                        min="0"
                                      />
                                    </div>
                                    <div className="w-28 md:w-32 flex-1 md:flex-none">
                                      <span className="md:hidden text-sovia-600 text-xs block mb-1">Harga Jual</span>
                                      <input
                                        type="number"
                                        placeholder="Rp"
                                        value={sizeObj.price}
                                        onChange={(e) => {
                                          const newVars = [...variants];
                                          newVars[idx].sizesList[sizeIdx].price = e.target.value === "" ? "" : parseFloat(e.target.value);
                                          setVariants(newVars);
                                        }}
                                        className="w-full py-1.5 px-3 bg-sovia-100 md:bg-sovia-50 rounded-lg text-sm border md:border-0"
                                      />
                                    </div>
                                    <div className="w-28 md:w-32 flex-1 md:flex-none">
                                      <span className="md:hidden text-sovia-600 text-xs block mb-1">Harga Beli</span>
                                      <input
                                        type="number"
                                        placeholder="Rp"
                                        value={sizeObj.buyPrice}
                                        onChange={(e) => {
                                          const newVars = [...variants];
                                          newVars[idx].sizesList[sizeIdx].buyPrice = e.target.value === "" ? "" : parseFloat(e.target.value);
                                          setVariants(newVars);
                                        }}
                                        className="w-full py-1.5 px-3 bg-sovia-100 md:bg-sovia-50 rounded-lg text-sm border md:border-0"
                                      />
                                    </div>
                                    {v.sizesList.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newVars = [...variants];
                                          newVars[idx].sizesList = newVars[idx].sizesList.filter((_, i) => i !== sizeIdx);
                                          setVariants(newVars);
                                        }}
                                        className="text-red-500 hover:text-red-700 font-bold px-2 py-1.5 md:py-0 shrink-0"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-between items-center mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVars = [...variants];
                                    newVars[idx].sizesList = [...newVars[idx].sizesList, { name: "", stock: 0, price: "", buyPrice: "" }];
                                    setVariants(newVars);
                                  }}
                                  className="text-xs px-2 py-1 bg-sovia-200 font-medium text-sovia-800 rounded-md hover:bg-sovia-300 transition duration-300 active:transform-[scale(0.95)]"
                                >
                                  + Add Size
                                </button>
                                <span className="text-[10px] text-sovia-500 text-right">
                                  Total Stock: {v.sizesList.reduce((sum, sz) => sum + sz.stock, 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sovia-600 text-xs block mb-1">Variant Image (optional)</label>
                          <div className="flex items-center gap-3">
                            {uploadingVariantId === idx ? (
                              <div className="flex-1 py-2 px-3 bg-sovia-50 rounded-lg text-sm flex items-center justify-center gap-2 text-sovia-600 max-w-[200px]">
                                <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
                              </div>
                            ) : (
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  let file = e.target.files?.[0]
                                  if (file) {
                                    setUploadingVariantId(idx);
                                    const loadingToast = toast.loading("Mengunggah gambar varian...");
                                    try {
                                      file = await compressImage(file, 1080);
                                      const formDataUpload = new FormData()
                                      formDataUpload.append("file", file)
                                      const res = await fetch("/api/upload", {
                                        method: "POST",
                                        body: formDataUpload,
                                      })
                                      const data = await res.json()
                                      if (data.url) {
                                        const newVars = [...variants]
                                        newVars[idx] = { ...newVars[idx], image: data.url }
                                        setVariants(newVars)
                                        toast.success("Gambar varian berhasil diunggah", { id: loadingToast });
                                      } else {
                                        throw new Error(data.error || "Upload failed");
                                      }
                                    } catch (error) {
                                      console.error("Upload failed:", error)
                                      toast.error("Gagal mengunggah gambar varian", { id: loadingToast });
                                    } finally {
                                      setUploadingVariantId(null);
                                    }
                                  }
                                }}
                                className="flex-1 py-2 px-3 bg-sovia-50 rounded-lg text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-sovia-600 file:text-sovia-50 max-w-[200px] overflow-hidden text-ellipsis"
                              />
                            )}
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
                                  className="absolute -top-2 -right-2 w-5 h-5 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-full text-xs flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-sovia-600 text-xs block mb-1">Try-On Image (optional)</label>
                          <p className="text-[10px] text-sovia-500 mb-1 leading-tight">Gambar tanpa background untuk Virtual Try-On. Format: PNG/WebP.</p>
                          <div className="flex items-center gap-3">
                            {uploadingTryOnId === idx ? (
                              <div className="flex-1 py-2 px-3 bg-sovia-50 rounded-lg text-sm flex items-center justify-center gap-2 text-sovia-600 max-w-[200px]">
                                <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
                              </div>
                            ) : (
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  let file = e.target.files?.[0]
                                  if (file) {
                                    setUploadingTryOnId(idx);
                                    const loadingToast = toast.loading("Mengunggah gambar try-on...");
                                    try {
                                      file = await compressImage(file, 720);
                                      const formDataUpload = new FormData()
                                      formDataUpload.append("file", file)
                                      const res = await fetch("/api/upload", {
                                        method: "POST",
                                        body: formDataUpload,
                                      })
                                      const data = await res.json()
                                      if (data.url) {
                                        const newVars = [...variants]
                                        newVars[idx] = { ...newVars[idx], tryOnImage: data.url }
                                        setVariants(newVars)
                                        toast.success("Gambar try-on berhasil diunggah", { id: loadingToast });
                                      } else {
                                        throw new Error(data.error || "Upload failed");
                                      }
                                    } catch (error) {
                                      console.error("Upload failed:", error)
                                      toast.error("Gagal mengunggah gambar try-on", { id: loadingToast });
                                    } finally {
                                      setUploadingTryOnId(null);
                                    }
                                  }
                                }}
                                className="flex-1 py-2 px-3 bg-sovia-50 rounded-lg text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-sovia-600 file:text-sovia-50 max-w-[200px] overflow-hidden text-ellipsis"
                              />
                            )}
                            {v.tryOnImage && (
                              <div className="relative w-12 h-12 bg-sovia-100 rounded shrink-0">
                                <img src={v.tryOnImage} alt="Try On" className="w-full h-full object-contain rounded" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVars = [...variants]
                                    newVars[idx] = { ...newVars[idx], tryOnImage: "" }
                                    setVariants(newVars)
                                  }}
                                  className="absolute -top-2 -right-2 w-5 h-5  hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-full text-xs flex items-center justify-center"
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
                  onClick={() => setVariants([...variants, { name: "", stock: 0, price: "", buyPrice: "", image: "", sizesList: [{ name: "", stock: 0, price: "", buyPrice: "" }], tryOnImage: "" }])}
                  className="text-sm font-semibold px-2 py-1 hover:bg-sovia-3 00 text-sovia-800 bg-sovia-200 transition-all active:transform-[scale(0.95)]5 font-medium flex items-center gap-1 cursor-pointer px-1 py-2 rounded-lg "
                >
                  + Add Variant
                </button>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-sovia-300 rounded-lg text-sovia-600 hover:bg-sovia-100 transition-all active:transform-[scale(0.95)]5 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-lg disabled:opacity-60 font-bold transition-all active:transform-[scale(0.95)]font-medium"
              >
                {saving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </form>
          </div>
        </div>
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
  const [mainImageIdx, setMainImageIdx] = useState(0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-3xl w-full">
        {/* Tombol Close mencolok di pojok kanan atas yang overlap sedikit */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-10 h-10 bg-sovia-50 rounded-full flex items-center justify-center hover:bg-sovia-600 text-sovia-50 bg-sovia-700 shadow-lg z-50 transition-all text-2xl font-light active:transform-[scale(0.95)]"
        >
          ×
        </button>

        <div className="bg-sovia-50 rounded-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
          <div className="px-6 md:px-8 py-5 border-b border-sovia-200 bg-sovia-50 shrink-0 z-10 shadow-sm relative">
            <h2 className="text-sovia-900 text-2xl font-serif">Product Details</h2>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sovia-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-sovia-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="md:sticky md:top-0 md:-mt-2">
              <div className="flex flex-col gap-3">
                {productImages.length > 0 && (
                  <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-sovia-100 shadow-sm">
                    <img src={productImages[mainImageIdx]} alt={`${product.name} utama`} className="w-full h-full object-cover" />
                  </div>
                )}

                {productImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {productImages.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative aspect-square rounded-lg overflow-hidden bg-sovia-100 cursor-pointer transition-all ${idx === mainImageIdx ? 'ring-0.5 ring-sovia-600 ring-offset-1' : 'hover:opacity-80'}`}
                        onClick={() => setMainImageIdx(idx)}
                      >
                        <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sovia-500 text-sm">Product Name</p>
                <p className="text-sovia-900 text-lg font-semibold">{product.name}</p>
              </div>
              <div>
                <p className="text-sovia-500 text-sm">Category</p>
                <p className="text-sovia-900">{product.category?.name || "Uncategorized"}</p>
              </div>
              <div>
                <p className="text-sovia-500 text-sm">Price</p>
                <p className="text-sovia-900 text-xl font-serif">{formatPrice(product.price)}</p>
              </div>
              <div>
                <p className="text-sovia-500 text-sm">SKU</p>
                <p className="text-sovia-900">{product.sku || "-"}</p>
              </div>
              <div>
                <p className="text-sovia-500 text-sm mb-1">Description</p>
                {product.description ? (
                  <div
                    className="prose prose-sm max-w-none text-sovia-700 overflow-hidden break-words [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&_strong]:text-sovia-900 [&_a]:text-sovia-600 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-sovia-700">-</p>
                )}
              </div>
              <div>
                <p className="text-sovia-500 text-sm">Total Stock</p>
                <p className="text-sovia-900">{product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0} units</p>
              </div>
              <div>
                <p className="text-sovia-500 text-sm mb-2">Variants ({product.variants?.length || 0})</p>
                <div className="border border-sovia-200 rounded-xl overflow-hidden bg-sovia-100 shadow-sm">
                  {product.variants?.map((v, index) => (
                    <div key={v.id} className={`p-3 flex items-start gap-3 ${index !== 0 ? 'border-t border-sovia-100' : ''}`}>
                      {v.image ? (
                        <img src={v.image} alt={v.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-sovia-100" />
                      ) : (
                        <div className="w-12 h-12 bg-sovia-50 rounded-lg flex-shrink-0 border border-sovia-100 flex items-center justify-center">
                          <span className="text-sovia-300 text-xs">-</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sovia-900 font-semibold text-sm truncate">{v.name}</span>
                          <span className={`text-xs bg-sovia-200 font-medium whitespace-nowrap bg-sovia-50 px-2 py-0.5 rounded-full border ${v.stock > 0 ? "text-sovia-700 border-sovia-200" : "text-accent-500 border-red-100 bg-red-50"}`}>
                            {v.stock} stok
                          </span>
                        </div>
                        {v.sizes && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {v.sizes.split(",").map((s, i) => {
                              const [szName, szStock] = s.split(":");
                              const stockNum = parseInt(szStock?.trim() || "0");
                              return (
                                <span key={i} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${stockNum === 0 ? "bg-sovia-100 text-sovia-400 border-sovia-200" : "bg-sovia-200 text-sovia-700 border-sovia-200"}`}>
                                  <span className="font-bold mr-1">{szName.trim()}</span>
                                  <span>{stockNum}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-sovia-200">
            <button onClick={onClose} className="flex-1 py-3 border border-sovia-300 rounded-lg text-sovia-600 hover:bg-sovia-100 transition-all active:transform-[scale(0.95)] font-medium">Close</button>
            <button onClick={onEdit} className="flex-1 py-3 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-lg transition-all active:transform-[scale(0.95)] font-medium">Edit Product</button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: any[]
  value: string
  onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedName = value === "all" ? "Semua Kategori" : categories.find((c: any) => c.id === value)?.name || "Semua Kategori"

  useEffect(() => {
    if (!isOpen) return
    const close = () => setIsOpen(false)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [isOpen])

  return (
    <div className="relative min-w-[200px]">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="flex items-center justify-between w-full pl-10 pr-4 py-3 bg-sovia-200/30 border border-sovia-200/50 rounded-lg text-sm text-sovia-700 focus:outline-none focus:border-sovia-400 transition-shadow cursor-pointer"
      >
        <span>{selectedName}</span>
        <ChevronDown className="w-4 h-4 text-sovia-400" />
      </button>
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sovia-600 pointer-events-none" />

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 top-full mt-2 left-0 w-full bg-sovia-50 border border-sovia-200 rounded-lg shadow-lg overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            onClick={() => {
              onChange("all")
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-sovia-900 hover:bg-sovia-800 hover:text-sovia-50 transition-colors"
          >
            Semua Kategori
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => {
                onChange(cat.id)
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-sovia-900 hover:bg-sovia-800 hover:text-sovia-50 transition-colors"
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}