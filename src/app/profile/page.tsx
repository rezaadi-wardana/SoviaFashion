"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { User, MapPin, Save, Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { formatPrice, formatDate, toTitleCase } from "@/lib/utils"

interface OrderItem {
  id: string
  status: string
  total: number
  subtotal: number
  shippingCost: number
  shippingMethod: string
  courierName: string | null
  courierService: string | null
  paymentMethod: string
  address: string
  trackingNumber: string | null
  createdAt: string
  updatedAt: string
  items: {
    id: string
    quantity: number
    price: number
    size: string | null
    color: string | null
    product: {
      id: string
      name: string
      images: string | null
    }
  }[]
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  PENDING_PAYMENT: { label: "Belum Bayar", icon: Clock, color: "text-yellow-600 dark:text-yellow-400" },
  PACKING: { label: "Sedang Diproses", icon: Package, color: "text-blue-600 dark:text-blue-400" },
  SHIPPED: { label: "Dalam Perjalanan", icon: Truck, color: "text-purple-600 dark:text-purple-400" },
  COMPLETED: { label: "Pesanan Selesai", icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
  CANCELLED: { label: "Dibatalkan", icon: X, color: "text-red-600 dark:text-red-400" },
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-sovia-200 rounded-xl animate-pulse flex items-center justify-center">
      <p className="text-sovia-400 text-sm">Memuat peta...</p>
    </div>
  ),
})

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    phone: "",
    address: "",
    detailAddress: "",
    lat: 0,
    lng: 0,
  })

  const [addressDetails, setAddressDetails] = useState({
    street: "",
    rt: "",
    rw: "",
    provinceId: "",
    provinceName: "",
    regencyId: "",
    regencyName: "",
    districtId: "",
    districtName: "",
    villageId: "",
    villageName: "",
    postalCode: "",
  })

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([])
  const [regencies, setRegencies] = useState<{ id: string; name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([])
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then(res => res.json())
      .then(data => setProvinces(data.map((item: any) => ({ ...item, name: toTitleCase(item.name) }))))
      .catch(err => console.error("Error fetching provinces:", err))
  }, [])

  useEffect(() => {
    if (!addressDetails.provinceId) {
      setRegencies([])
      return
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${addressDetails.provinceId}.json`)
      .then(res => res.json())
      .then(data => setRegencies(data.map((item: any) => ({ ...item, name: toTitleCase(item.name) }))))
      .catch(err => console.error("Error fetching regencies:", err))
  }, [addressDetails.provinceId])

  useEffect(() => {
    if (!addressDetails.regencyId) {
      setDistricts([])
      return
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${addressDetails.regencyId}.json`)
      .then(res => res.json())
      .then(data => setDistricts(data.map((item: any) => ({ ...item, name: toTitleCase(item.name) }))))
      .catch(err => console.error("Error fetching districts:", err))
  }, [addressDetails.regencyId])

  useEffect(() => {
    if (!addressDetails.districtId) {
      setVillages([])
      return
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${addressDetails.districtId}.json`)
      .then(res => res.json())
      .then(data => setVillages(data.map((item: any) => ({ ...item, name: toTitleCase(item.name) }))))
      .catch(err => console.error("Error fetching villages:", err))
  }, [addressDetails.districtId])

  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile")
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orderFilter, setOrderFilter] = useState<string>("ALL")
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  async function handleCompleteOrder(orderId: string) {
    if (!window.confirm("Apakah Anda yakin telah menerima pesanan ini dengan baik?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" })
      })
      if (res.ok) {
        toast.success("Terima kasih telah mengonfirmasi pesanan Anda!")
        fetchOrders()
      } else {
        toast.error("Gagal mengonfirmasi pesanan")
      }
    } catch (e) {
      toast.error("Terjadi kesalahan")
    }
  }

  useEffect(() => {
    if (activeTab === "orders" && orders.length === 0) {
      fetchOrders()
    }
  }, [activeTab])

  async function fetchOrders() {
    setLoadingOrders(true)
    try {
      const res = await fetch("/api/orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    const userId = session?.user?.id
    const userName = session?.user?.name
    if (!userId) return

    async function loadUserData() {
      try {
        const res = await fetch(`/api/users/${userId}`)
        if (res.ok) {
          const data = await res.json()
          setFormData({
            name: data.name || userName || "",
            phone: data.phone || "",
            address: data.address || "",
            detailAddress: data.detailAddress || "",
            lat: data.lat || 0,
            lng: data.lng || 0,
          })
          if (data.detailAddress) {
            setAddressDetails(prev => ({ ...prev, street: data.detailAddress }))
          } else if (data.address) {
            setAddressDetails(prev => ({ ...prev, street: data.address }))
          }
        }
      } catch {
        console.error("Error loading user data")
      }
    }

    loadUserData()
  }, [session])

  async function handleGetLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }))
          toast.success("Location detected!")
        },
        () => {
          toast.error("Could not get location. Please enable GPS.")
        }
      )
    } else {
      toast.error("Geolocation is not supported by your browser.")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    let finalAddress = ""
    if (addressDetails.provinceName) {
      const parts = [
        addressDetails.rt || addressDetails.rw ? `RT ${addressDetails.rt || "-"}/RW ${addressDetails.rw || "-"}` : "",
        addressDetails.villageName ? `Desa/Kel. ${addressDetails.villageName}` : "",
        addressDetails.districtName ? `Kec. ${addressDetails.districtName}` : "",
        addressDetails.regencyName,
        addressDetails.provinceName ? `Prov. ${addressDetails.provinceName}` : "",
        addressDetails.postalCode,
        "Indonesia"
      ].filter(Boolean)
      finalAddress = parts.join(", ")
    } else {
      finalAddress = formData.address
    }

    const updatedFormData = { ...formData, address: finalAddress, detailAddress: addressDetails.street }

    try {
      const res = await fetch(`/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFormData),
      })

      if (res.ok) {
        toast.success("Profile updated successfully!")
        await update({ name: formData.name })
      } else {
        toast.error("Failed to update profile")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-sovia-400" />
          <p className="text-sovia-600 text-lg">Please sign in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="mb-12">
          <h1 className="text-sovia-600 text-6xl font-serif">Halaman Profil</h1>
          <p className="text-sovia-700 text-lg mt-4 max-w-[672px]">
            Kelola data diri dan pengiriman Anda untuk memastikan pengalaman berbelanja yang nyaman dengan SOVIA.
          </p>
        </div>

        <div className="flex gap-8 border-b border-sovia-200 mb-12">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-4 text-lg font-medium transition-colors border-b-2 ${
              activeTab === "profile"
                ? "border-sovia-900 text-sovia-900"
                : "border-transparent text-sovia-500 hover:text-sovia-700"
            }`}
          >
            Profil Saya
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-4 text-lg font-medium transition-colors border-b-2 ${
              activeTab === "orders"
                ? "border-sovia-900 text-sovia-900"
                : "border-transparent text-sovia-500 hover:text-sovia-700"
            }`}
          >
            Pesanan Saya
          </button>
        </div>

        {activeTab === "profile" ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Details */}
              <div className="bg-sovia-50 rounded-lg p-6 lg:p-12 shadow-sm border border-sovia-100">
                <h2 className="text-sovia-600 text-2xl lg:text-3xl font-serif mb-6">
                  Data Pribadi
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-sovia-700 text-sm font-medium block mb-2">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all"
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>
                  <div>
                    <label className="text-sovia-700 text-sm font-medium block mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={session.user?.email || ""}
                      disabled
                      className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg text-sovia-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-sovia-700 text-sm font-medium block mb-2">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="+62 812 3456 7890"
                      className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Coordinates */}
              <div className="bg-sovia-50 rounded-lg p-6 lg:p-12 shadow-sm border border-sovia-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-sovia-600 text-2xl lg:text-3xl font-serif">
                    Lokasi Pengiriman
                  </h2>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="p-2.5 bg-sovia-200 hover:bg-sovia-300 rounded-lg transition-colors flex items-center gap-2 text-sovia-700 text-sm font-medium"
                    title="Dapatkan Lokasi Saat Ini"
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="hidden sm:inline">Lokasi Saya</span>
                  </button>
                </div>

                <div className="space-y-5 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sovia-700 text-sm font-medium block mb-2">Negara</label>
                      <input
                        type="text"
                        value="Indonesia"
                        disabled
                        className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg text-sovia-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-sovia-700 text-sm font-medium block mb-2">Provinsi <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={addressDetails.provinceId}
                        onChange={(e) => {
                          const selected = provinces.find(p => p.id === e.target.value);
                          setAddressDetails(prev => ({
                            ...prev,
                            provinceId: e.target.value,
                            provinceName: selected ? selected.name : "",
                            regencyId: "", regencyName: "",
                            districtId: "", districtName: "",
                            villageId: "", villageName: ""
                          }))
                        }}
                        className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all appearance-none"
                      >
                        <option value="">Pilih Provinsi</option>
                        {provinces.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sovia-700 text-sm font-medium block mb-2">Kabupaten/Kota <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={addressDetails.regencyId}
                        onChange={(e) => {
                          const selected = regencies.find(r => r.id === e.target.value);
                          setAddressDetails(prev => ({
                            ...prev,
                            regencyId: e.target.value,
                            regencyName: selected ? selected.name : "",
                            districtId: "", districtName: "",
                            villageId: "", villageName: ""
                          }))
                        }}
                        disabled={!addressDetails.provinceId}
                        className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all appearance-none disabled:bg-sovia-100 disabled:text-sovia-500 disabled:cursor-not-allowed"
                      >
                        <option value="">Pilih Kabupaten/Kota</option>
                        {regencies.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sovia-700 text-sm font-medium block mb-2">Kecamatan <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={addressDetails.districtId}
                        onChange={(e) => {
                          const selected = districts.find(d => d.id === e.target.value);
                          setAddressDetails(prev => ({
                            ...prev,
                            districtId: e.target.value,
                            districtName: selected ? selected.name : "",
                            villageId: "", villageName: ""
                          }))
                        }}
                        disabled={!addressDetails.regencyId}
                        className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all appearance-none disabled:bg-sovia-100 disabled:text-sovia-500 disabled:cursor-not-allowed"
                      >
                        <option value="">Pilih Kecamatan</option>
                        {districts.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sovia-700 text-sm font-medium block mb-2">Desa/Kelurahan <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={addressDetails.villageId}
                        onChange={(e) => {
                          const selected = villages.find(v => v.id === e.target.value);
                          setAddressDetails(prev => ({
                            ...prev,
                            villageId: e.target.value,
                            villageName: selected ? selected.name : ""
                          }))
                        }}
                        disabled={!addressDetails.districtId}
                        className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all appearance-none disabled:bg-sovia-100 disabled:text-sovia-500 disabled:cursor-not-allowed"
                      >
                        <option value="">Pilih Desa/Kelurahan</option>
                        {villages.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-4 md:col-span-2">
                      <div className="flex-1">
                        <label className="text-sovia-700 text-sm font-medium block mb-2">RT <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={addressDetails.rt}
                          onChange={(e) => setAddressDetails(prev => ({ ...prev, rt: e.target.value }))}
                          placeholder="001"
                          className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sovia-700 text-sm font-medium block mb-2">RW <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={addressDetails.rw}
                          onChange={(e) => setAddressDetails(prev => ({ ...prev, rw: e.target.value }))}
                          placeholder="002"
                          className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sovia-700 text-sm font-medium block mb-2">Kode Pos <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={addressDetails.postalCode}
                          onChange={(e) => setAddressDetails(prev => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="12345"
                          className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sovia-700 text-sm font-medium block mb-2">
                      Detail Alamat (Jalan, No Rumah, Blok, dll) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={addressDetails.street}
                      onChange={(e) =>
                        setAddressDetails((prev) => ({ ...prev, street: e.target.value }))
                      }
                      placeholder="Contoh: Jl. Sudirman Kav. 21, No. 15, Patokan: Depan minimarket"
                      rows={3}
                      className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all resize-none"
                    />
                    <p className="text-xs text-sovia-500 mt-2">Pastikan alamat terisi dengan lengkap dan jelas untuk mempermudah kurir.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sovia-700 text-sm font-medium block mb-2">
                        Latitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.lat || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            lat: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all"
                        placeholder="-6.2088"
                      />
                    </div>
                    <div>
                      <label className="text-sovia-700 text-sm font-medium block mb-2">
                        Longitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.lng || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            lng: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full py-3 px-4 bg-sovia-100 border border-sovia-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sovia-500 text-sovia-900 transition-all"
                        placeholder="106.8456"
                      />
                    </div>
                  </div>
                </div>

                {/* Interactive Map */}
                <div className="mb-4">
                  <p className="text-sovia-600 text-sm font-medium mb-3">
                    Titik Lokasi Peta (Opsional namun disarankan)
                  </p>
                  <div className="rounded-xl overflow-hidden border border-sovia-200">
                    <MapPicker
                      lat={formData.lat}
                      lng={formData.lng}
                      onLocationChange={(lat, lng) => {
                        setFormData((prev) => ({ ...prev, lat, lng }))
                        toast.success("Lokasi berhasil ditentukan dari peta!")
                      }}
                      height="h-[300px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-sovia-200 pt-6 mt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-10 py-4 bg-sovia-900 text-sovia-50 font-medium rounded-lg flex items-center justify-center gap-3 hover:bg-sovia-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Save className="w-5 h-5" />
                {loading ? "Menyimpan Data..." : "Simpan Profil & Alamat"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["ALL", "PENDING_PAYMENT", "PACKING", "SHIPPED", "COMPLETED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    orderFilter === status
                      ? "bg-sovia-800 text-sovia-50"
                      : "bg-sovia-100 text-sovia-700 hover:bg-sovia-200"
                  }`}
                >
                  {status === "ALL" ? "Semua" : statusConfig[status].label}
                </button>
              ))}
            </div>

            {loadingOrders ? (
              <div className="py-16 flex justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-sovia-600 border-t-transparent rounded-full" />
              </div>
            ) : orders.filter(o => orderFilter === "ALL" || o.status === orderFilter).length === 0 ? (
              <div className="text-center py-16 bg-sovia-50 rounded-lg">
                <Package className="w-16 h-16 mx-auto mb-4 text-sovia-400" />
                <p className="text-sovia-600 text-lg mb-4">Belum ada pesanan</p>
                <Link
                  href="/catalog"
                  className="px-6 py-3 bg-sovia-600 text-white rounded-lg inline-block"
                >
                  Mulai Belanja
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders
                  .filter(o => orderFilter === "ALL" || o.status === orderFilter)
                  .map((order) => {
                    const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT
                    const Icon = statusInfo.icon

                    return (
                      <div key={order.id} className="bg-sovia-100 rounded-lg p-6 shadow-sm border-3 border-sovia-200">
                        <div className="flex justify-between items-start pb-4 border-b border-sovia-200 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                          <div>
                            <p className="text-sovia-500 text-sm">Order #{order.id.slice(-8)}</p>
                            <p className="text-sovia-700 text-sm">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1 bg-sovia-50 rounded-full ${statusInfo.color}`}>
                              <Icon className="w-4 h-4" />
                              <span className="text-sm font-medium">{statusInfo.label}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sovia-500 hover:text-sovia-800 text-xs">
                              {expandedOrders.has(order.id) ? (
                                 <><ChevronUp className="w-3 h-3"/> Sembunyikan Detail</>
                              ) : (
                                 <><ChevronDown className="w-3 h-3"/> Lihat Detail Order</>
                              )}
                            </div>
                          </div>
                        </div>

                        {expandedOrders.has(order.id) && (
                          <div className="py-4 space-y-4">
                            {/* Timeline Status */}
                            <div className="bg-sovia-50 border border-sovia-200 p-4 rounded-lg mb-6">
                              <h4 className="text-sovia-800 text-sm font-medium mb-3">Riwayat Status Pesanan</h4>
                              <div className="flex flex-col gap-2 relative">
                                 <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-sovia-200"></div>
                                 <div className="flex gap-3 relative z-10">
                                    <div className="w-4 h-4 rounded-full bg-sovia-400 mt-0.5 ring-4 ring-sovia-50"></div>
                                    <div className="flex-1">
                                      <p className="text-sovia-800 text-sm font-medium">Pesanan Dibuat</p>
                                      <p className="text-sovia-500 text-xs">{formatDate(order.createdAt)}</p>
                                    </div>
                                 </div>
                                 {order.status !== "PENDING_PAYMENT" && (
                                   <div className="flex gap-3 relative z-10">
                                      <div className="w-4 h-4 rounded-full bg-sovia-400 mt-0.5 ring-4 ring-sovia-50"></div>
                                      <div className="flex-1">
                                        <p className="text-sovia-800 text-sm font-medium">Pesanan Diproses / Dikonfirmasi</p>
                                      </div>
                                   </div>
                                 )}
                                 {(order.status === "SHIPPED" || order.status === "COMPLETED") && (
                                   <div className="flex gap-3 relative z-10">
                                      <div className="w-4 h-4 rounded-full bg-blue-500 mt-0.5 ring-4 ring-sovia-50"></div>
                                      <div className="flex-1">
                                        <p className="text-sovia-800 text-sm font-medium">Pesanan Dalam Perjalanan</p>
                                        {order.trackingNumber && (
                                          <p className="text-sovia-600 text-xs mt-1">Resi: <span className="font-mono bg-sovia-200 px-1 rounded">{order.trackingNumber}</span></p>
                                        )}
                                      </div>
                                   </div>
                                 )}
                                 {order.status === "COMPLETED" && (
                                   <div className="flex gap-3 relative z-10">
                                      <div className="w-4 h-4 rounded-full bg-green-500 mt-0.5 ring-4 ring-sovia-50"></div>
                                      <div className="flex-1">
                                        <p className="text-green-700 text-sm font-medium">Pesanan Selesai</p>
                                        <p className="text-sovia-500 text-xs">{formatDate(order.updatedAt)}</p>
                                      </div>
                                   </div>
                                 )}
                              </div>
                            </div>

                            {order.items.map((item) => {
                              let imageUrl = "https://placehold.co/80x96/F3EFE6/3C3228?text=Item"
                              if (item.product.images) {
                                try {
                                  const parsed = JSON.parse(item.product.images)
                                  if (Array.isArray(parsed) && parsed.length > 0) {
                                    imageUrl = parsed[0]
                                  } else if (typeof parsed === "string") {
                                    imageUrl = parsed
                                  }
                                } catch (e) {
                                  imageUrl = item.product.images
                                }
                              }

                              return (
                                <div key={item.id} className="flex gap-4">
                                  <div className="w-20 h-24 bg-sovia-200 rounded-md flex-shrink-0 overflow-hidden">
                                    <Image
                                      src={imageUrl}
                                      alt={item.product.name}
                                      width={80}
                                      height={96}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 flex flex-col justify-center">
                                    <h3 className="text-sovia-900 text-lg font-serif mb-1">
                                      {item.product.name}
                                    </h3>
                                    <p className="text-sovia-500 text-sm mb-2">
                                      {item.color && `Color: ${item.color}`}
                                      {item.color && item.size && ` | `}
                                      {item.size && `Size: ${item.size}`}
                                    </p>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sovia-700 text-sm">Qty: {item.quantity}</span>
                                      <span className="text-sovia-900 font-medium">
                                        {formatPrice(item.price * item.quantity)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <div className="pt-4 mt-4 border-t border-sovia-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <p className="text-sovia-700 text-sm font-medium mb-1">
                              Pengiriman: {order.shippingMethod === "EXPEDITION" ? "Ekspedisi" : "COD"}
                              {order.courierName && ` - ${order.courierName.toUpperCase()}`}
                              {order.courierService && ` (${order.courierService})`}
                            </p>
                            {order.trackingNumber && (
                              <p className="text-sovia-600 text-sm mt-1 mb-1">No Resi: <span className="font-mono bg-sovia-100 px-1 py-0.5 rounded">{order.trackingNumber}</span></p>
                            )}
                            <p className="text-sovia-500 text-xs max-w-md line-clamp-2">{order.address}</p>
                          </div>
                          <div className="text-right w-full md:w-auto flex flex-col items-end gap-3">
                            <p className="text-sovia-500 text-sm mb-1">Total Belanja</p>
                            <p className="text-sovia-900 text-xl font-medium">
                              {formatPrice(order.total)}
                            </p>
                            {order.status === "SHIPPED" && (
                              <button
                                onClick={() => handleCompleteOrder(order.id)}
                                className="px-6 py-2 bg-sovia-900 text-sovia-50 rounded-lg text-sm font-medium hover:bg-sovia-800 transition-colors shadow-md"
                              >
                                Pesanan Diterima
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}