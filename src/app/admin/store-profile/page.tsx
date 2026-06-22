"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Store, Save, MapPin, Phone, Mail, MessageCircle, Loader2, Upload, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import LoadingOverlay from "@/components/ui/LoadingOverlay"
import Image from "next/image"

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
  tiktok: string | null
  bankAccount: string | null
  bankImage: string | null
  eWallet: string | null
  eWalletImage: string | null
}

export default function StoreProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingBank, setUploadingBank] = useState(false)
  const [uploadingEWallet, setUploadingEWallet] = useState(false)
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
    tiktok: "",
    bankAccount: "",
    bankImage: "",
    eWallet: "",
    eWalletImage: "",
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
          tiktok: data.tiktok || "",
          bankAccount: data.bankAccount || "",
          bankImage: data.bankImage || "",
          eWallet: data.eWallet || "",
          eWalletImage: data.eWalletImage || "",
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
        toast.success("Store profile updated successfully")
      } else {
        toast.error("Failed to update store profile")
      }
    } catch {
      toast.error("Failed to update store profile")
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: "bankImage" | "eWalletImage") {
    const file = e.target.files?.[0]
    if (!file) return

    if (field === "bankImage") setUploadingBank(true)
    else setUploadingEWallet(true)

    const uploadData = new FormData()
    uploadData.append("file", file)

    const toastId = toast.loading("Mengunggah gambar...")

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      })

      if (res.ok) {
        const { url } = await res.json()
        setFormData(prev => ({ ...prev, [field]: url }))
        toast.success("Gambar berhasil diunggah", { id: toastId })
      } else {
        toast.error("Gagal mengunggah gambar", { id: toastId })
      }
    } catch {
      toast.error("Gagal mengunggah gambar", { id: toastId })
    } finally {
      if (field === "bankImage") setUploadingBank(false)
      else setUploadingEWallet(false)
    }
  }

  if (loading) return <LoadingOverlay />

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="sticky top-0 z-20 bg-sovia-50/90 backdrop-blur-sm pt-4 pb-4 -mt-4 -mx-4 px-4 mb-6 border-b border-sovia-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-sovia-900 text-3xl font-serif mb-2">Profil Toko</h1>
          <p className="text-sovia-700 text-sm">
            Kelola informasi toko Anda. Alamat toko digunakan sebagai titik awal pengiriman.
          </p>
        </div>
        <button
          type="submit"
          form="profile-form"
          disabled={saving}
          className="px-8 py-3 bg-sovia-700 hover:bg-sovia-600 text-sovia-50 rounded-lg font-medium flex items-center gap-2 transition-all active:transform-[scale(0.95)]  shadow-sm disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Menyimpan..." : "Simpan Profil Toko"}
        </button>
      </div>

      <form id="profile-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Store Identity */}
        <div className="bg-sovia-100/50 rounded-2xl p-8 shadow-sm border border-sovia-200/50 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-sovia-200 rounded-xl flex items-center justify-center">
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
                placeholder="Sovia Fashion"
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
        <div className="bg-sovia-100/50 rounded-2xl p-8 shadow-sm border border-sovia-200/50 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-sovia-200 rounded-xl flex items-center justify-center">
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
            <div>
              <label className="text-sovia-700 text-sm block mb-2">TikTok</label>
              <input
                type="text"
                value={formData.tiktok}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400"
                placeholder="@soviafashion"
              />
            </div>
          </div>
        </div>

        {/* Payment Configuration */}
        <div className="bg-sovia-100/50 rounded-2xl p-8 shadow-sm border border-sovia-200/50 relative overflow-hidden group lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-sovia-200 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-sovia-600" />
            </div>
            <h2 className="text-sovia-900 text-xl font-serif">Pembayaran (Transfer Manual)</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="text-sovia-700 text-sm block mb-2">Rekening Bank</label>
              <textarea
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                rows={3}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400 resize-none mb-3"
                placeholder="BCA 1234567890 a.n. Sovia"
              />
              <label className="text-sovia-700 text-sm block mb-2">QR Code / Logo Bank</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-sovia-300 border-dashed rounded-lg cursor-pointer bg-sovia-50 hover:bg-sovia-100 transition-colors relative overflow-hidden group">
                {uploadingBank ? (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Loader2 className="w-6 h-6 animate-spin text-sovia-400 mb-2" />
                    <p className="text-sm text-sovia-600 font-medium">Mengunggah...</p>
                  </div>
                ) : formData.bankImage ? (
                  <div className="flex flex-col items-center justify-center p-2 w-full h-full relative">
                    <Image 
                      src={formData.bankImage} 
                      alt="Bank QR/Logo" 
                      fill
                      className="absolute inset-0 object-contain opacity-60 group-hover:opacity-30 transition-opacity" 
                    />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="bg-sovia-900 text-sovia-50 p-2 rounded-full mb-1 shadow-md">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-sovia-700 font-medium bg-sovia-100/90 border border-sovia-200 px-3 py-1 rounded-full shadow-sm group-hover:bg-sovia-100 transition-colors">Ubah Gambar</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 text-sovia-400 mb-2 group-hover:-translate-y-1 transition-transform" />
                    <p className="text-sm text-sovia-600 font-medium">Pilih Gambar</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={(e) => handleImageUpload(e, "bankImage")}
                />
              </label>
            </div>
            <div>
              <label className="text-sovia-700 text-sm block mb-2">E-Wallet (Dana / OVO / GoPay)</label>
              <textarea
                value={formData.eWallet}
                onChange={(e) => setFormData({ ...formData, eWallet: e.target.value })}
                rows={3}
                className="w-full py-3 px-4 bg-sovia-50 border border-sovia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-400 resize-none mb-3"
                placeholder="Gopay 081234567890 a.n. Sovia"
              />
              <label className="text-sovia-700 text-sm block mb-2">QR Code / Logo E-Wallet</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-sovia-300 border-dashed rounded-lg cursor-pointer bg-sovia-50 hover:bg-sovia-100 transition-colors relative overflow-hidden group">
                {uploadingEWallet ? (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Loader2 className="w-6 h-6 animate-spin text-sovia-400 mb-2" />
                    <p className="text-sm text-sovia-600 font-medium">Mengunggah...</p>
                  </div>
                ) : formData.eWalletImage ? (
                  <div className="flex flex-col items-center justify-center p-2 w-full h-full relative">
                    <Image 
                      src={formData.eWalletImage} 
                      alt="E-Wallet QR/Logo" 
                      fill
                      className="absolute inset-0 object-contain opacity-60 group-hover:opacity-30 transition-opacity" 
                    />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="bg-sovia-900 text-sovia-50 p-2 rounded-full mb-1 shadow-md">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-sovia-700 font-medium bg-sovia-50/90 border border-sovia-200 px-3 py-1 rounded-full shadow-sm group-hover:bg-sovia-100 transition-colors">Ubah Gambar</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 text-sovia-400 mb-2 group-hover:-translate-y-1 transition-transform" />
                    <p className="text-sm text-sovia-600 font-medium">Pilih Gambar</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={(e) => handleImageUpload(e, "eWalletImage")}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-sovia-100/50 rounded-2xl p-8 shadow-sm border border-sovia-200/50 relative overflow-hidden group lg:col-span-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sovia-200 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-sovia-600" />
              </div>
              <div>
                <h2 className="text-sovia-900 text-xl font-serif">Alamat Toko</h2>
                <p className="text-sovia-500 text-xs">Titik awal pengiriman & perhitungan jarak</p>
              </div>
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

      </form>
    </div>
  )
}
