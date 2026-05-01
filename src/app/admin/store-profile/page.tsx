"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Store, Save, MapPin, Phone, Mail, MessageCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-72 bg-sovia-100 rounded-xl animate-pulse flex items-center justify-center">
      <p className="text-sovia-400 text-sm">Memuat peta...</p>
    </div>
  ),
})

interface StoreProfileData {
  id: string
  name: string
  description: string | null
  ownerName: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  lat: number | null
  lng: number | null
  instagram: string | null
  facebook: string | null
}

export default function StoreProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ownerName: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    lat: 0,
    lng: 0,
    instagram: "",
    facebook: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch("/api/admin/store-profile")
      if (res.ok) {
        const data: StoreProfileData = await res.json()
        setFormData({
          name: data.name || "",
          description: data.description || "",
          ownerName: data.ownerName || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          address: data.address || "",
          lat: data.lat || 0,
          lng: data.lng || 0,
          instagram: data.instagram || "",
          facebook: data.facebook || "",
        })
      }
    } catch {
      toast.error("Failed to load store profile")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/admin/store-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success("Profil toko berhasil disimpan!")
      } else {
        toast.error("Gagal menyimpan profil toko")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  function handleGetLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }))
          toast.success("Lokasi berhasil terdeteksi!")
        },
        () => {
          toast.error("Tidak dapat mengakses lokasi. Aktifkan GPS.")
        }
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-sovia-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-sovia-900 text-3xl font-serif mb-2">Profil Toko</h1>
        <p className="text-sovia-700 text-sm">
          Kelola informasi toko Anda. Alamat toko digunakan sebagai titik awal pengiriman.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Store Identity */}
        <div className="bg-[#F3EFE6] rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-sovia-100 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-sovia-600" />
            </div>
            <h2 className="text-sovia-900 text-xl font-serif">Identitas Toko</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Nama Toko</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400"
                placeholder="SOVIA Fashion"
              />
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Nama Pengelola</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400"
                placeholder="Nama pemilik toko"
              />
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Deskripsi Toko</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400 resize-none"
                placeholder="Deskripsi singkat tentang toko Anda..."
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-[#F3EFE6] rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-sovia-100 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-sovia-600" />
            </div>
            <h2 className="text-sovia-900 text-xl font-serif">Kontak</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-sovia-700 text-sm block mb-2">
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  Nomor WhatsApp
                </span>
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400"
                placeholder="628123456789 (tanpa + atau spasi)"
              />
              <p className="text-sovia-400 text-xs mt-1">
                Format: 628xxxxxxxxxx — Digunakan untuk tombol &quot;Chat Penjual&quot; di halaman produk
              </p>
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Nomor Telepon</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400"
                placeholder="+62 812 3456 7890"
              />
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400"
                placeholder="toko@sovia.com"
              />
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Instagram</label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400"
                placeholder="@soviafashion"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-[#F3EFE6] rounded-xl p-8 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sovia-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-sovia-600" />
              </div>
              <div>
                <h2 className="text-sovia-900 text-xl font-serif">Alamat Toko</h2>
                <p className="text-sovia-500 text-xs">Titik awal pengiriman & perhitungan jarak</p>
              </div>
            </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <label className="text-sovia-700 text-sm block mb-2">Alamat Lengkap</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400 resize-none"
                placeholder="Jl. Contoh No. 123, Kecamatan, Kota, Provinsi"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="text-sovia-700 text-sm block mb-2">Titik Lokasi Toko</label>
              <p className="text-sovia-400 text-xs mb-3">
                Klik pada peta atau geser pin untuk menentukan lokasi toko
              </p>
              <MapPicker
                lat={formData.lat}
                lng={formData.lng}
                onLocationChange={(lat, lng) => {
                  setFormData((prev) => ({ ...prev, lat, lng }))
                  toast.success("Lokasi toko berhasil ditentukan!")
                }}
                height="h-72"
              />
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.lat || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })
                }
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400"
                placeholder="-6.2088"
              />
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.lng || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })
                }
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400"
                placeholder="106.8456"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="lg:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-sovia-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-sovia-700 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? "Menyimpan..." : "Simpan Profil Toko"}
          </button>
        </div>
      </form>
    </div>
  )
}
