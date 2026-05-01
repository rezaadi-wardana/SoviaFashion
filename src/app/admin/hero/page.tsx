"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Plus, Edit, Trash2, GripVertical, Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  image: string
  link: string | null
  order: number
  isActive: boolean
}

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchSlides()
  }, [])

  async function fetchSlides() {
    try {
      const res = await fetch("/api/admin/hero")
      if (res.ok) {
        const data = await res.json()
        setSlides(data)
      }
    } catch (error) {
      console.error("Error fetching slides:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(slideId: string) {
    if (!confirm("Are you sure you want to delete this slide?")) return

    try {
      const res = await fetch(`/api/admin/hero/${slideId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Slide deleted")
        fetchSlides()
      } else {
        toast.error("Failed to delete slide")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  async function handleSave(slideData: Partial<HeroSlide>) {
    try {
      const url = editingSlide ? `/api/admin/hero/${editingSlide.id}` : "/api/admin/hero"
      const method = editingSlide ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slideData),
      })

      if (res.ok) {
        toast.success(editingSlide ? "Slide updated" : "Slide created")
        fetchSlides()
        setShowModal(false)
        setEditingSlide(null)
      } else {
        toast.error("Failed to save slide")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-sovia-900 text-3xl font-serif mb-2">Hero Slider Management</h1>
          <p className="text-sovia-700 text-sm">
            Manage the hero section sliders for the homepage.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSlide(null)
            setShowModal(true)
          }}
          className="px-6 py-3 bg-sovia-600 text-white text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Slide
        </button>
      </div>

      {/* Slides List */}
      {loading ? (
        <div className="text-center py-16 text-sovia-500">Loading...</div>
      ) : slides.length === 0 ? (
        <div className="text-center py-16 text-sovia-500">
          No hero slides yet. Create your first slide.
        </div>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <div key={slide.id} className="bg-[#F3EFE6] rounded-lg p-4 flex items-center gap-4">
              <div className="w-8 flex items-center justify-center text-sovia-400">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="w-32 h-20 bg-sovia-200 rounded overflow-hidden relative">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sovia-900 font-medium">{slide.title}</p>
                <p className="text-sovia-500 text-sm">{slide.subtitle || "No subtitle"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    slide.isActive ? "bg-green-100 text-green-700" : "bg-sovia-100 text-sovia-500"
                  }`}
                >
                  {slide.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-sovia-500 text-sm">Order: {slide.order}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingSlide(slide)
                    setShowModal(true)
                  }}
                  className="p-2 hover:bg-sovia-100 rounded"
                >
                  <Edit className="w-4 h-4 text-sovia-600" />
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="p-2 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4 text-accent-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <HeroSlideModal
          slide={editingSlide}
          onClose={() => {
            setShowModal(false)
            setEditingSlide(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function HeroSlideModal({
  slide,
  onClose,
  onSave,
}: {
  slide?: HeroSlide | null
  onClose: () => void
  onSave: (data: Partial<HeroSlide>) => void
}) {
  const [formData, setFormData] = useState({
    title: slide?.title || "",
    subtitle: slide?.subtitle || "",
    image: slide?.image || "",
    link: slide?.link || "",
    order: slide?.order ?? 0,
    isActive: slide?.isActive ?? true,
  })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, image: data.url })
        toast.success("Image uploaded successfully")
      } else {
        toast.error("Failed to upload image")
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={onClose}>
      <div className="bg-[#F3EFE6] rounded-lg p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sovia-900 text-2xl font-serif mb-6">
          {slide ? "Edit Slide" : "New Slide"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sovia-700 text-sm block mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full py-2 px-4 bg-sovia-100 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="text-sovia-700 text-sm block mb-2">Subtitle</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full py-2 px-4 bg-sovia-100 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sovia-700 text-sm block mb-2">Slide Image</label>
            <div className="space-y-3">
              {formData.image && (
                <div className="relative w-full h-40 bg-sovia-200 rounded-lg overflow-hidden">
                  <Image
                    src={formData.image}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 px-4 border-2 border-dashed border-sovia-300 rounded-lg text-sovia-600 hover:border-sovia-500 hover:bg-sovia-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    {formData.image ? "Change Image" : "Upload Image"}
                  </>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sovia-700 text-sm block mb-2">Link URL (optional)</label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full py-2 px-4 bg-sovia-100 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Order</label>
              <input
                type="number"
                value={String(formData.order ?? 0)}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData({ ...formData, order: val === "" ? 0 : parseInt(val) || 0 })
                }}
                className="w-full py-2 px-4 bg-sovia-100 rounded-lg"
              />
            </div>
            <div className="flex items-center pt-8">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="isActive" className="text-sovia-700 text-sm">
                Active
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-sovia-300 rounded-lg text-sovia-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!formData.title.trim()) {
                toast.error("Judul slide wajib diisi")
                return
              }
              if (!formData.image) {
                toast.error("Gambar slide wajib diupload")
                return
              }
              onSave(formData)
            }}
            className="flex-1 py-3 bg-sovia-600 text-white rounded-lg hover:bg-sovia-700 transition-colors"
          >
            {slide ? "Update" : "Create"} Slide
          </button>
        </div>
      </div>
    </div>
  )
}