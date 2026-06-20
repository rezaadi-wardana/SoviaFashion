"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Plus, Edit, Trash2, GripVertical, Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import LoadingOverlay from "@/components/ui/LoadingOverlay"

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
  const [viewingSlide, setViewingSlide] = useState<HeroSlide | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    slideId: "",
  })

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
  if (loading) return <LoadingOverlay />

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="sticky top-0 z-20 bg-sovia-50/90 backdrop-blur-sm pt-4 pb-4 -mt-4 -mx-4 px-4 mb-6 border-b border-sovia-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
          className="px-6 py-3 bg-sovia-700 hover:bg-sovia-600 text-sovia-50 transition duration-300 text-sm font-medium rounded-lg flex items-center gap-2 active:transform-[scale(0.95)] shadow-sm"
        >
          <Plus className="w-4 h-4 shrink-0" />
          New Slide
        </button>
      </div>

      {/* Slides List */}
      {slides.length === 0 ? (
        <div className="text-center py-16 text-sovia-500">
          No hero slides yet. Create your first slide.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              onClick={() => setViewingSlide(slide)}
              className="bg-sovia-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm border border-sovia-200/50 cursor-pointer hover:shadow-md hover:border-sovia-300 transition-all"
            >
              <div className="flex justify-between items-center border-b border-sovia-200 pb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-sovia-400" />
                  <span className="text-sovia-500 text-xs font-medium uppercase tracking-wider">Order: {slide.order}</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${slide.isActive ? "bg-emerald-500 text-emerald-50" : "bg-sovia-200 text-sovia-500"
                    }`}
                >
                  {slide.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="w-full aspect-video bg-sovia-200 rounded-lg overflow-hidden relative">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <p className="text-sovia-900 font-serif text-lg leading-tight line-clamp-2 mb-1">{slide.title}</p>
                <p className="text-sovia-500 text-sm line-clamp-2">{slide.subtitle || "No subtitle"}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-sovia-200/50 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingSlide(slide)
                    setShowModal(true)
                  }}
                  className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-lg transition-all active:transform-[scale(0.95)]"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmModal({ isOpen: true, slideId: slide.id })
                  }}
                  className="flex-1 py-2 flex items-center justify-center gap-2 bg-rose-700 text-rose-50 hover:bg-rose-800 rounded-lg transition-colors text-sm font-medium active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-sovia-50 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-sovia-900">
                Hapus Slide
              </h2>
              <p className="text-sm text-sovia-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus slide ini? Aksi ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="px-6 py-4 bg-sovia-50/80 border-t border-sovia-100 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, slideId: "" })}
                className="px-4 py-2 text-sm font-medium text-sovia-700 hover:bg-sovia-100 bg-sovia-50 rounded-lg transition-colors border border-sovia-200 shadow-sm active:transform-[scale(0.95)]"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handleDelete(confirmModal.slideId)
                  setConfirmModal({ isOpen: false, slideId: "" })
                }}
                className="px-4 py-2 text-sm font-medium text-rose-50 bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors active:transform-[scale(0.95)]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal View */}
      {viewingSlide && (
        <ViewSlideModal
          slide={viewingSlide}
          onClose={() => setViewingSlide(null)}
          onEdit={() => {
            setViewingSlide(null)
            setEditingSlide(viewingSlide)
            setShowModal(true)
          }}
        />
      )}

      {/* Modal Edit/Create */}
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

function ViewSlideModal({
  slide,
  onClose,
  onEdit,
}: {
  slide: HeroSlide
  onClose: () => void
  onEdit: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-10 h-10 bg-sovia-700 rounded-full flex items-center justify-center hover:bg-sovia-600 text-sovia-50 shadow-lg z-50 transition-all text-2xl font-light active:transform-[scale(0.95)]"
        >
          ×
        </button>

        <div className="bg-sovia-50 rounded-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
          <div className="px-6 md:px-8 py-5 border-b border-sovia-200 bg-sovia-50 shrink-0 z-10 shadow-sm relative">
            <h2 className="text-sovia-900 text-2xl font-serif">Slide Details</h2>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sovia-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-sovia-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="md:sticky md:top-0 md:-mt-2">
                <div className="relative aspect-video md:aspect-[4/5] w-full rounded-xl overflow-hidden bg-sovia-100 shadow-sm">
                  <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sovia-500 text-sm">Title</p>
                  <p className="text-sovia-900 text-lg font-semibold">{slide.title}</p>
                </div>
                <div>
                  <p className="text-sovia-500 text-sm">Subtitle</p>
                  <p className="text-sovia-900">{slide.subtitle || "-"}</p>
                </div>
                <div>
                  <p className="text-sovia-500 text-sm">Link</p>
                  <p className="text-sovia-900 break-all">{slide.link || "-"}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sovia-500 text-sm">Order</p>
                    <p className="text-sovia-900">{slide.order}</p>
                  </div>
                  <div>
                    <p className="text-sovia-500 text-sm">Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${slide.isActive ? "bg-emerald-500 text-emerald-50" : "bg-sovia-200 text-sovia-500"}`}>
                      {slide.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-sovia-200">
              <button onClick={onClose} className="flex-1 py-3 border border-sovia-300 rounded-lg text-sovia-600 hover:bg-sovia-100 transition-all active:transform-[scale(0.95)] font-medium">Close</button>
              <button onClick={onEdit} className="flex-1 py-3 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-lg transition-all active:transform-[scale(0.95)] font-medium">Edit Slide</button>
            </div>
          </div>
        </div>
      </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-10 h-10 bg-sovia-700 rounded-full flex items-center justify-center hover:bg-sovia-600 text-sovia-50 shadow-lg z-50 transition-all text-2xl font-light active:transform-[scale(0.95)]"
        >
          ×
        </button>

        <div className="bg-sovia-50 rounded-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
          {/* Sticky Header */}
          <div className="px-6 md:px-8 py-5 border-b border-sovia-200 bg-sovia-50 shrink-0 z-10 shadow-sm relative">
            <h2 className="text-sovia-900 text-2xl font-serif">
              {slide ? "Edit Slide" : "New Slide"}
            </h2>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sovia-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-sovia-300">
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full py-2 px-4 bg-sovia-50 border border-sovia-200 focus:border-sovia-400 focus:outline-none focus:ring-0 rounded-lg transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full py-2 px-4 bg-sovia-50 border border-sovia-200 focus:border-sovia-400 focus:outline-none focus:ring-0 rounded-lg transition-colors"
              />
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Slide Image</label>
              <div className="space-y-3">
                {formData.image && (
                  <div className="relative w-full h-40 bg-sovia-200 rounded-lg overflow-hidden border border-sovia-200/50">
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
                className="w-full py-2 px-4 bg-sovia-50 border border-sovia-200 focus:border-sovia-400 focus:outline-none focus:ring-0 rounded-lg transition-colors"
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
                  className="w-full py-2 px-4 bg-sovia-50 border border-sovia-200 focus:border-sovia-400 focus:outline-none focus:ring-0 rounded-lg transition-colors"
                />
              </div>
              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 mr-2 rounded border-sovia-300 text-sovia-600 focus:ring-sovia-600"
                />
                <label htmlFor="isActive" className="text-sovia-700 text-sm font-medium">
                  Active
                </label>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-sovia-200 px-6 md:px-8 pb-6 md:pb-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-sovia-300 rounded-lg text-sovia-600 hover:bg-sovia-100 transition-all active:transform-[scale(0.95)] font-medium"
            >
              Batal
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
              className="flex-1 py-3 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-lg transition-all active:transform-[scale(0.95)] font-medium"
            >
              {slide ? "Simpan Perubahan" : "Buat Slide"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}