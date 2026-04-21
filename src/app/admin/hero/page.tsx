"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Edit, Trash2, GripVertical } from "lucide-react"
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
          <h1 className="text-stone-900 text-3xl font-serif mb-2">Hero Slider Management</h1>
          <p className="text-stone-700 text-sm">
            Manage the hero section sliders for the homepage.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSlide(null)
            setShowModal(true)
          }}
          className="px-6 py-3 bg-stone-600 text-white text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Slide
        </button>
      </div>

      {/* Slides List */}
      {loading ? (
        <div className="text-center py-16 text-stone-500">Loading...</div>
      ) : slides.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          No hero slides yet. Create your first slide.
        </div>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <div key={slide.id} className="bg-white rounded-lg p-4 flex items-center gap-4">
              <div className="w-8 flex items-center justify-center text-stone-400">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="w-32 h-20 bg-stone-200 rounded overflow-hidden relative">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-stone-900 font-medium">{slide.title}</p>
                <p className="text-stone-500 text-sm">{slide.subtitle || "No subtitle"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    slide.isActive ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {slide.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-stone-500 text-sm">Order: {slide.order}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingSlide(slide)
                    setShowModal(true)
                  }}
                  className="p-2 hover:bg-stone-100 rounded"
                >
                  <Edit className="w-4 h-4 text-stone-600" />
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="p-2 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
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
    order: slide?.order || 0,
    isActive: slide?.isActive ?? true,
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full">
        <h2 className="text-stone-900 text-2xl font-serif mb-6">
          {slide ? "Edit Slide" : "New Slide"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-stone-700 text-sm block mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">Subtitle</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
            />
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">Image URL</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
              required
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-stone-700 text-sm block mb-2">Link URL (optional)</label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full py-2 px-4 bg-stone-100 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-stone-700 text-sm block mb-2">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full py-2 px-4 bg-stone-100 rounded-lg"
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
              <label htmlFor="isActive" className="text-stone-700 text-sm">
                Active
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-stone-300 rounded-lg text-stone-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(formData)}
            className="flex-1 py-3 bg-stone-600 text-white rounded-lg"
          >
            {slide ? "Update" : "Create"} Slide
          </button>
        </div>
      </div>
    </div>
  )
}