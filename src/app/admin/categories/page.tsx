"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import LoadingOverlay from "@/components/ui/LoadingOverlay"

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; categoryId: string | null }>({ isOpen: false, categoryId: null })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(categoryId: string) {
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Category deleted")
        fetchData()
      } else {
        toast.error("Failed to delete category")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (showModal) {
    return (
      <CategoryFormModal
        category={editingCategory || undefined}
        onClose={() => {
          setShowModal(false)
          setEditingCategory(null)
        }}
        onSave={() => {
          fetchData()
          setShowModal(false)
          setEditingCategory(null)
        }}
      />
    )
  }
  if (loading) return <LoadingOverlay />

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="sticky top-0 z-20 bg-sovia-50/90 backdrop-blur-sm pt-4 pb-4 -mt-4 -mx-4 px-4 mb-6 border-b border-sovia-200/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-sovia-900 text-3xl font-serif mb-2">
              Category Management
            </h1>
            <p className="text-sovia-700 text-sm">
              Manage product categories for the Sovia collection.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-sovia-700 hover:bg-sovia-600 text-sovia-50 transition duration-300 text-sm font-medium rounded-lg flex items-center gap-2 active:transform-[scale(0.95)]"
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
        </div>

        <div className="flex gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-sovia-200/30 rounded-lg text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sovia-700" />
          </div>
        </div>
      </div>

      <div className="bg-[#F3EFE6] rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-sovia-200/50">
              <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase">
                IMAGE
              </th>
              <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase">
                NAME
              </th>
              <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase">
                DESCRIPTION
              </th>
              <th className="text-right py-4 px-4 text-sovia-700 text-xs font-semibold uppercase">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sovia-500">
                  No categories found
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.id} className="border-b border-sovia-100">
                  <td className="py-5 px-4">
                    <div className="w-12 h-16 bg-sovia-200 rounded-sm flex-shrink-0 overflow-hidden">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sovia-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-4 text-sovia-900 text-base font-semibold">
                    {category.name}
                  </td>
                  <td className="py-5 px-4 text-sovia-700 text-sm">
                    {category.description || "-"}
                  </td>
                  <td className="py-5 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category)
                          setShowModal(true)
                        }}
                        className="p-2 hover:bg-yellow-800 hover:text-yellow-50 text-sovia-700 rounded transition-all active:scale-95"
                      >
                        <Edit className="w-4 h-4 " />
                      </button>
                      <button
                        onClick={() => setConfirmModal({ isOpen: true, categoryId: category.id })}
                        className="p-2 hover:bg-rose-900 hover:text-rose-50 text-sovia-700 rounded transition-all active:scale-95"
                      >
                        <Trash2 className="w-4 h-4 " />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-sovia-50 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-rose-600">
                Hapus Kategori
              </h2>
              <p className="text-sm text-sovia-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus kategori ini? Aksi ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="px-6 py-4 bg-sovia-180 border-t border-sovia-200 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, categoryId: null })}
                className="px-4 py-2 text-sm font-medium text-sovia-700 hover:bg-sovia-100 bg-sovia-50 rounded-lg transition-colors border border-sovia-200 shadow-sm active:transform-[scale(0.95)]"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (confirmModal.categoryId) {
                    handleDelete(confirmModal.categoryId);
                  }
                  setConfirmModal({ isOpen: false, categoryId: null });
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

function CategoryFormModal({
  category,
  onClose,
  onSave,
}: {
  category?: Category
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    image: category?.image || "",
  })
  const [saving, setSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isUploading) return;
    setSaving(true)

    try {
      const url = category ? `/api/categories/${category.id}` : "/api/categories"
      const method = category ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(category ? "Category updated" : "Category created")
        onSave()
      } else {
        toast.error("Failed to save category")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-md w-full">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-10 h-10 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-full flex items-center justify-center shadow-lg z-50 transition-all text-2xl font-light active:transform-[scale(0.95)]"
        >
          ×
        </button>

        <div className="bg-[#F3EFE6] rounded-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
          <div className="px-6 md:px-8 py-5 border-b border-sovia-200 bg-[#F3EFE6] shrink-0 z-10 shadow-sm relative">
            <h2 className="text-sovia-900 text-2xl font-serif">
              {category ? "Edit Category" : "New Category"}
            </h2>
          </div>
          <div className="p-6 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sovia-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-sovia-400">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sovia-700 text-sm block mb-2">Category Name</label>
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
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full py-2 px-4 bg-sovia-100 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sovia-700 text-sm block mb-2">Category Image</label>
            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setIsUploading(true)
                  const formDataUpload = new FormData()
                  formDataUpload.append("file", file)
                  try {
                    const res = await fetch("/api/upload", {
                      method: "POST",
                      body: formDataUpload,
                    })
                    const data = await res.json()
                    if (data.url) {
                      setFormData((prev) => ({ ...prev, image: data.url }))
                      toast.success("Image uploaded successfully")
                    }
                  } catch (error) {
                    console.error("Upload failed:", error)
                    toast.error("Image upload failed")
                  } finally {
                    setIsUploading(false)
                  }
                }
              }}
              className="w-full py-2 px-4 bg-sovia-100 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-sovia-600 file:text-sovia-50 file:cursor-pointer disabled:opacity-50"
            />
            {isUploading && (
              <p className="text-sovia-600 text-sm mt-2 animate-pulse">Uploading image, please wait...</p>
            )}
            {formData.image && !isUploading && (
              <div className="mt-2 relative w-24 h-24">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-full object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: "" })}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-accent-500 text-sovia-50  rounded-full text-xs"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-4 pt-4 mt-8 border-t border-sovia-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading || saving}
              className="flex-1 py-3 border border-sovia-300 rounded-lg text-sovia-600 disabled:opacity-50 hover:bg-sovia-100 transition-all active:transform-[scale(0.95)] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isUploading}
              className="flex-1 py-3 bg-sovia-700 hover:bg-sovia-600 text-sovia-50 rounded-lg disabled:opacity-60 transition-all active:transform-[scale(0.95)] font-medium"
            >
              {saving ? "Saving..." : isUploading ? "Uploading..." : "Save Category"}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  )
}
