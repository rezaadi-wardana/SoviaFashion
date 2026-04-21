"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

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
    if (!confirm("Are you sure you want to delete this category?")) return

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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-stone-900 text-3xl font-serif mb-2">
            Category Management
          </h1>
          <p className="text-stone-700 text-sm">
            Manage product categories for the SOVIA collection.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-stone-600 text-white text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-stone-200/30 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-700" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-200/50">
              <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                IMAGE
              </th>
              <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                NAME
              </th>
              <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                DESCRIPTION
              </th>
              <th className="text-right py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-stone-500">
                  Loading...
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-stone-500">
                  No categories found
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.id} className="border-b border-stone-100">
                  <td className="py-5 px-4">
                    <div className="w-12 h-16 bg-stone-200 rounded-sm flex-shrink-0 overflow-hidden">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-4 text-stone-900 text-base font-semibold">
                    {category.name}
                  </td>
                  <td className="py-5 px-4 text-stone-700 text-sm">
                    {category.description || "-"}
                  </td>
                  <td className="py-5 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category)
                          setShowModal(true)
                        }}
                        className="p-2 hover:bg-stone-100 rounded"
                      >
                        <Edit className="w-4 h-4 text-stone-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
      </div>
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-stone-900 text-2xl font-serif mb-6">
          {category ? "Edit Category" : "New Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-stone-700 text-sm block mb-2">Category Name</label>
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
              rows={3}
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
            />
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">Category Image</label>
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
                      setFormData({ ...formData, image: data.url })
                    }
                  } catch (error) {
                    console.error("Upload failed:", error)
                  }
                }
              }}
              className="w-full py-2 px-4 bg-stone-100 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-stone-600 file:text-white file:cursor-pointer"
            />
            {formData.image && (
              <div className="mt-2 relative w-24 h-24">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-full object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: "" })}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                >
                  ×
                </button>
              </div>
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
              {saving ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
