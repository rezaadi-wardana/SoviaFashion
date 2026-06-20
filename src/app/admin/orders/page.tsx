"use client"

import { useState, useEffect } from "react"
import { Package, Truck, CheckCircle, Clock, ChevronDown, XCircle, MapPin, Search, ArrowUpDown } from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { CustomSelect, SelectOption } from "@/components/ui/CustomSelect"
import LoadingOverlay from "@/components/ui/LoadingOverlay"

interface Order {
  id: string
  status: string
  total: number
  shippingMethod: string
  courierName: string | null
  courierService: string | null
  address: string
  detailAddress: string | null
  recipientName: string
  phone: string
  createdAt: string
  updatedAt: string
  user: { name: string; email: string }
  isConfirmed: boolean
  trackingNumber: string | null
  lat: number | null
  lng: number | null
  items: {
    id: string
    quantity: number
    size: string | null
    product: { name: string; images: string | null }
  }[]
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", icon: Clock, color: "bg-amber-500 text-amber-50" },
  PACKING: { label: "Dalam Pengemasan", icon: Package, color: "bg-sky-500 text-sky-50" },
  SHIPPED: { label: "Dikirim", icon: Truck, color: "bg-indigo-500 text-indigo-50" },
  COMPLETED: { label: "Selesai", icon: CheckCircle, color: "bg-emerald-500 text-emerald-50" },
  CANCELLED: { label: "Dibatalkan", icon: XCircle, color: "bg-rose-500 text-rose-50" },
}

const statusOrder = ["PENDING_PAYMENT", "PACKING", "SHIPPED", "COMPLETED"]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("ALL")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingModalOpen, setTrackingModalOpen] = useState(false)
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const [trackingInput, setTrackingInput] = useState("")
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'UPDATE_STATUS' | 'REJECT' | null;
    orderId: string | null;
    targetStatus: string | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    action: null,
    orderId: null,
    targetStatus: null,
    title: "",
    message: ""
  });

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/admin/orders")
      if (res.ok) {
        const data = await res.json()
        const sortedData = data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(sortedData)

        // If an order is currently selected, update its data to reflect new status
        if (selectedOrder) {
          const updatedOrder = sortedData.find((o: Order) => o.id === selectedOrder.id)
          setSelectedOrder(updatedOrder || null)
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string, trackingNumber?: string) {
    let payload: any = { status: newStatus }

    if (newStatus === "SHIPPED") {
      if (!trackingNumber) {
        toast.error("Nomor resi wajib diisi untuk mengubah status menjadi Dikirim!")
        return
      }
      payload.trackingNumber = trackingNumber
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("Status pesanan berhasil diperbarui")
        fetchOrders()
      } else {
        toast.error("Gagal memperbarui status pesanan")
      }
    } catch (error) {
      toast.error("Terjadi kesalahan pada sistem")
    }
  }

  async function confirmOrder(orderId: string, confirmed: boolean, bypassModal: boolean = false) {
    if (!confirmed && !bypassModal) {
      if (!window.confirm("Apakah Anda yakin ingin menolak pesanan ini?")) return
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isConfirmed: confirmed, status: confirmed ? undefined : "CANCELLED" }),
      })

      if (res.ok) {
        toast.success(confirmed ? "Pesanan disetujui" : "Pesanan dibatalkan")
        fetchOrders()
      } else {
        toast.error("Gagal memproses pesanan")
      }
    } catch (error) {
      toast.error("Terjadi kesalahan pada sistem")
    }
  }

  const tabs = [
    { id: "ALL", label: "Semua Pesanan" },
    ...Object.entries(statusConfig).map(([id, config]) => ({ id, label: config.label }))
  ]

  const filteredOrders = orders
    .filter((order) => activeTab === "ALL" || order.status === activeTab)
    .filter((order) => {
      const q = searchQuery.toLowerCase()
      return order.user.name.toLowerCase().includes(q) || order.id.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })

  const renderOrderDetails = (order: Order, isMobile: boolean) => (
    <div className={`space-y-6 animate-in fade-in duration-500 ${isMobile ? 'pt-4 border-t border-sovia-100' : ''}`}>
      {/* Items List */}
      <div>
        <h3 className="text-sovia-700 font-semibold mb-3 flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-sovia-500" /> Produk yang Dipesan
        </h3>
        <div className="space-y-3">
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
              <div key={item.id} className={`flex items-center gap-4 border border-sovia-100 p-3 rounded-xl shadow-sm ${isMobile ? 'bg-sovia-100' : 'bg-sovia-50'}`}>
                <div className={`w-14 h-16 rounded-lg overflow-hidden flex-shrink-0 ${isMobile ? 'bg-sovia-50' : 'bg-sovia-200'}`}>
                  <img
                    src={imageUrl}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sovia-900 text-sm font-semibold truncate leading-tight">{item.product.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-sovia-700 text-xs px-2 py-1 rounded font-medium border border-sovia-100 ${isMobile ? 'bg-sovia-50' : 'bg-sovia-200'}`}>Qty: {item.quantity}</span>
                    {item.size && <span className={`text-sovia-700 text-xs px-2 py-1 rounded font-medium border border-sovia-100 ${isMobile ? 'bg-sovia-50' : 'bg-sovia-200'}`}>Size: {item.size}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Shipping Info */}
      <div>
        <h3 className="text-sovia-700 font-semibold mb-3 flex items-center gap-2 text-sm ">
          <Truck className="w-4 h-4 text-sovia-500" /> Detail Pengiriman
        </h3>
        <div className={`border border-sovia-100 p-4 rounded-xl text-sm space-y-2.5 shadow-sm ${isMobile ? 'bg-sovia-100' : 'bg-sovia-50'}`}>
          <div className="flex justify-between">
            <span className="text-sovia-500">Penerima</span>
            <span className="text-sovia-900 font-semibold text-right">{order.recipientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sovia-500">No. HP</span>
            <span className="text-sovia-900 font-medium text-right">{order.phone}</span>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-sovia-500 whitespace-nowrap">Alamat</span>
            <span className="text-sovia-900 text-right">
              {order.address}
              {order.detailAddress && <><br /><span className="text-sovia-600 text-xs">Catatan: {order.detailAddress}</span></>}
            </span>
          </div>
          {order.lat && order.lng && (
            <div className="flex justify-between mt-1">
              <span className="text-sovia-500">Lokasi GPS</span>
              <a
                href={`https://www.google.com/maps?q=${order.lat},${order.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                Buka Peta ↗
              </a>
            </div>
          )}

          <hr className="border-sovia-200 my-3" />

          <div className="flex justify-between">
            <span className="text-sovia-500">Kurir</span>
            <span className="text-sovia-900 font-semibold text-right">
              {order.shippingMethod === "EXPEDITION" ? "Ekspedisi" : "COD"}
              {order.courierName && ` - ${order.courierName.toUpperCase()}`}
              {order.courierService && ` (${order.courierService})`}
            </span>
          </div>
          {order.trackingNumber && (
            <div className="flex justify-between items-center">
              <span className="text-sovia-500">No. Resi</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded border border-sovia-200 ${isMobile ? 'bg-sovia-50 text-sovia-900' : 'bg-sovia-200 text-sovia-900'}`}>
                {order.trackingNumber}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tracking Timeline & Status Actions */}
      <div className={`border border-sovia-200 rounded-xl p-5 shadow-sm mt-4 ${isMobile ? 'bg-sovia-100' : 'bg-sovia-50'}`}>
        <h3 className="text-sovia-700 font-semibold mb-4 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-sovia-500" /> Riwayat Status
        </h3>

        <div className="mb-6 flex gap-2 items-center bg-sovia-100 p-3 rounded-lg border border-sovia-100 shadow-sm">
          <p className='text-sovia-500 text-sm'>Status Saat Ini:</p>
          <span className={`px-3 py-1 rounded text-[11px] font-bold tracking-wide uppercase ${statusConfig[order.status]?.color} opacity-90`}>
            {statusConfig[order.status]?.label}
          </span>
        </div>

        <div className="relative border-l-2 border-sovia-200 ml-3 space-y-6 mb-8">
          {order.status === "CANCELLED" ? (
            <div className="relative pl-6">
              <div className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-sovia-50 border-rose-500 text-rose-500 z-10">
                <XCircle className="w-3 h-3" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-600">Dibatalkan</p>
                <p className="text-xs text-sovia-500 mt-0.5">{new Date(order.updatedAt).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ) : (
            statusOrder.map((status, index) => {
              const currentStatusIndex = statusOrder.indexOf(order.status)
              const isCompleted = index < currentStatusIndex || order.status === "COMPLETED"
              const isCurrent = index === currentStatusIndex
              const isPending = index > currentStatusIndex
              const Icon = statusConfig[status].icon

              let timeStr = ""
              if (isCurrent) timeStr = new Date(order.updatedAt).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              else if (index === 0 && (isCompleted || isCurrent)) timeStr = new Date(order.createdAt).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              else if (isCompleted && currentStatusIndex > 0) {
                const cTime = new Date(order.createdAt).getTime()
                const uTime = new Date(order.updatedAt).getTime()
                const diff = uTime - cTime
                const fakeTime = cTime + (diff / currentStatusIndex) * index
                timeStr = new Date(fakeTime).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              }

              return (
                <div key={status} className="relative pl-6">
                  <div className={`absolute -left-[13px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-sovia-50 z-10 ${isCompleted ? 'border-emerald-500 text-emerald-500' : isCurrent ? 'border-sovia-800 text-sovia-800' : 'border-sovia-200 text-sovia-300'}`}>
                    {isCompleted ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isCurrent ? 'text-sovia-900' : isCompleted ? 'text-sovia-700' : 'text-sovia-400'}`}>{statusConfig[status].label}</p>
                    {timeStr && <p className="text-xs text-sovia-500 mt-0.5">{timeStr}</p>}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <hr className="border-sovia-200 my-6" />

        <h3 className="text-sovia-900 font-semibold mb-4 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-sovia-500" /> Aksi & Update Status
        </h3>

        {(order.status === "PACKING" || order.status === "PENDING_PAYMENT") && !order.isConfirmed ? (
          <div className="flex flex-row gap-3">
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                setConfirmModal({
                  isOpen: true,
                  action: 'REJECT',
                  orderId: order.id,
                  targetStatus: null,
                  title: "Tolak Pesanan",
                  message: "Apakah Anda yakin ingin menolak dan membatalkan pesanan ini? Aksi ini tidak dapat dibatalkan."
                });
              }}
              className="flex-1 px-4 py-2 bg-rose-700 text-rose-50 border border-rose-200 rounded-lg text-sm font-semibold hover:bg-rose-800 transition-colors shadow-sm active:transform-[scale(0.95)]"
            >
              Tolak
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); confirmOrder(order.id, true); }}
              className="flex-1 px-4 py-2 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 transition duration-300 text-sm font-semibold rounded-lg flex items-center gap-2 active:transform-[scale(0.95)]"
            >
              Setujui
            </button>
          </div>
        ) : order.status === "CANCELLED" ? (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-rose-700 font-semibold">Pesanan Dibatalkan</p>
              <p className="text-rose-600 text-xs mt-1">Pesanan ini telah dibatalkan dan tidak bisa dilanjutkan.</p>
            </div>
          </div>
        ) : order.status === "COMPLETED" ? (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex items-start gap-3 ">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-emerald-700 font-semibold text-sm">Pesanan Selesai</p>
              <p className="text-emerald-600 text-xs mt-1">Seluruh proses pesanan telah diselesaikan dengan baik.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-row flex-wrap gap-3">
            {statusOrder.map((status, index) => {
              const currentStatusIndex = statusOrder.indexOf(order.status)
              const isNext = index === currentStatusIndex + 1

              if (!isNext) return null;

              const sConfig = statusConfig[status]

              return (
                <button
                  key={status}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (status === "SHIPPED") {
                      setTrackingOrderId(order.id);
                      setTrackingInput("");
                      setTrackingModalOpen(true);
                    } else {
                      setConfirmModal({
                        isOpen: true,
                        action: 'UPDATE_STATUS',
                        orderId: order.id,
                        targetStatus: status,
                        title: `Update Status ke ${sConfig.label}`,
                        message: `Apakah Anda yakin ingin memperbarui status pesanan ini menjadi ${sConfig.label}?`
                      });
                    }
                  }}
                  className="flex-1 px-4 py-2.5 hover:bg-sovia-600 text-sovia-50 bg-sovia-700  rounded-lg text-sm font-semibold transition-all shadow-md active:transform-[scale(0.98)] flex items-center justify-center gap-2"
                >
                  <span>Update ke {sConfig.label}</span>
                  
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  if (loading) return <LoadingOverlay />

  return (
    <div className="pb-5 animate-in fade-in duration-500">
      {/* Sticky Header Group: Title + Tabs */}
      <div className="lg:sticky top-0 z-30 bg-sovia-50 pt-4 pb-4 -mt-6 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-6 lg:px-6 border-b border-sovia-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-sovia-900 text-3xl font-serif mb-2">Kelola Pesanan</h1>
            <p className="text-sovia-700 text-sm">Kelola pesanan yang masuk dari website.</p>
          </div>
        </div>

        {/* Tabs (Desktop) */}
        <div className="hidden md:flex overflow-x-auto gap-8 w-full scrollbar-hide pb-2">
          {tabs.map((tab) => {
            const count = tab.id === "ALL" ? orders.length : orders.filter(o => o.status === tab.id).length
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSelectedOrder(null)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 whitespace-nowrap outline-none ${isActive
                    ? "text-sovia-700 border-b-2 border-sovia-700"
                    : "text-sovia-700 hover:text-sovia-700"
                  }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full transition-colors font-serif ${isActive ? 'bg-sovia-700 text-sovia-100' : 'bg-sovia-200 text-sovia-800'
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tabs (Mobile Select) */}
        <div className="md:hidden pb-4">
          <CustomSelect
            value={activeTab}
            onChange={(val) => {
              setActiveTab(val)
              setSelectedOrder(null)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            options={tabs.map(tab => {
              const count = tab.id === "ALL" ? orders.length : orders.filter(o => o.status === tab.id).length
              const isActive = activeTab === tab.id
              return {
                value: tab.id,
                label: tab.label,
                badge: count > 0 ? (
                  <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full transition-colors font-serif ${isActive ? 'bg-sovia-800 text-sovia-50' : 'bg-sovia-200 text-sovia-700'
                    }`}>
                    {count}
                  </span>
                ) : undefined
              }
            })}
            className="w-full"
          />
        </div>
      </div>

      {/* Orders Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Orders List (Left / Main) */}
        <div className={`flex-1 w-full space-y-3 transition-all duration-500 ${selectedOrder ? "lg:max-w-[400px]" : ""}`}>
          <div className="flex flex-row items-stretch sm:items-center justify-between gap-3 my-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-sovia-500" />
              </div>
              <input
                type="text"
                placeholder="Cari ID pesanan atau nama pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-sovia-200/30 border border-sovia-200 rounded-lg text-sm text-sovia-700 focus:outline-none focus:ring-2 focus:ring-sovia-400 transition-shadow placeholder:text-sovia-400"
              />
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="flex items-center justify-center gap-2 px-3 py-2 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 border border-sovia-200 rounded-lg text-sm font-medium transition-all active:transform-[scale(0.95)]"
            >
              <ArrowUpDown className="w-4 h-4 text-sovia-50" />
              {sortOrder === "desc" ? "Terbaru" : "Terdahulu"}
            </button>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 h-[100%] w-full bg-sovia-50 rounded-2xl border border-sovia-200 animate-in fade-in zoom-in-95 duration-300">
              <Package className="w-12 h-12 text-sovia-300 mx-auto mb-3" />
              <p className="text-sovia-600 font-medium">Tidak ada pesanan</p>
              <p className="text-sovia-400 text-sm mt-1">Pesanan yang sesuai kriteria akan muncul di sini.</p>
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT
              const isSelected = selectedOrder?.id === order.id

              return (
                <div
                  key={order.id}
                  className={`bg-sovia-100 rounded-xl shadow-sm border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 overflow-hidden ${isSelected ? 'bg-sovia-200/50 border-sovia-200 my-4' : 'border-sovia-200 hover:border-sovia-400 hover:shadow-md'
                    }`}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                >
                  <div
                    className={`p-4 cursor-pointer flex justify-between gap-4 ${selectedOrder ? 'flex-row items-start' : 'flex-col md:flex-row md:items-center'}`}
                    onClick={() => setSelectedOrder(isSelected ? null : order)}
                  >
                    {/* Column 1: User Data */}
                    <div className={`flex flex-col flex-shrink-0 ${selectedOrder ? 'flex-1 min-w-0' : 'w-full md:w-1/4'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sovia-800 font-semibold truncate max-w-[150px]">{order.user.name}</p>
                        <span className="text-sovia-400 text-xs">#{order.id.slice(-8)}</span>
                      </div>
                      <p className="text-sovia-500 text-xs">
                        {formatDate(order.createdAt)} • {new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sovia-500 text-xs flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate max-w-[180px]">{order.address.split(",").slice(-2)[0]?.trim() || order.address}</span>
                      </p>
                    </div>

                    {/* Column 2: Mini Products */}
                    {!selectedOrder && order.items.length > 0 && (
                      <div className="hidden md:flex flex-1 items-center justify-start gap-3 overflow-x-auto scrollbar-hide py-3 md:py-0 md:border-x border-sovia-200/50 md:px-4 w-full border-y md:border-y-0 mt-2 md:mt-0">
                        {order.items.slice(0, 5).map((item) => {
                          let imageUrl = "https://placehold.co/80x96/F3EFE6/3C3228?text=Item";
                          if (item.product.images) {
                            try {
                              const parsed = JSON.parse(item.product.images);
                              if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
                              else if (typeof parsed === "string") imageUrl = parsed;
                            } catch (e) {
                              imageUrl = item.product.images;
                            }
                          }
                          return (
                            <div key={item.id} className="flex flex-col items-center w-14 flex-shrink-0">
                              <div className="w-12 h-14 bg-sovia-200 rounded-md overflow-hidden border border-sovia-200 shadow-sm mb-1.5">
                                <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                              </div>
                              <p className="text-sovia-500 text-[9px] truncate w-full text-center leading-tight font-medium" title={item.product.name}>{item.product.name}</p>
                            </div>
                          )
                        })}
                        {order.items.length > 5 && (
                          <div className="flex flex-col items-center w-12 flex-shrink-0">
                            <div className="w-12 h-14 bg-sovia-200/50 rounded-md border border-sovia-200 shadow-sm mb-1.5 flex items-center justify-center">
                              <span className="text-sovia-600 text-xs font-bold">+{order.items.length - 5}</span>
                            </div>
                            <p className="text-transparent text-[9px]">.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Column 3: Status & Price */}
                    <div className={`flex justify-between flex-shrink-0 ${selectedOrder ? 'flex-col items-end gap-1' : 'flex-row md:flex-col items-center md:items-end w-full md:w-[15%] pt-1 md:pt-0'}`}>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold  ${statusInfo.color} opacity-90`}>
                        {statusInfo.label}
                      </span>
                      <div className="text-right mt-0 md:mt-2">
                        <p className={`text-sovia-500 text-[10px] font-medium ${selectedOrder ? '' : 'hidden md:block'}`}>{order.items.length} Produk</p>
                        <p className="text-sovia-900 font-serif font-semibold md:mt-0.5">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inline Mobile Details */}
                  <div
                    className={`lg:hidden transition-all duration-300 ease-in-out bg-sovia-50/50 ${isSelected ? 'max-h-[2000px] opacity-100 p-4 border-t border-sovia-100' : 'max-h-0 opacity-0 px-4'
                      }`}
                  >
                    {isSelected && renderOrderDetails(order, true)}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Order Details Sidebar (Right - Desktop) */}
        {selectedOrder && (
          <div className="hidden lg:block lg:flex-1 bg-sovia-100 border border-sovia-200 rounded-2xl p-5 shadow-sm sticky top-[180px] animate-in slide-in-from-right-8 fade-in duration-500 mt-4">
            <div className="flex justify-between items-start border-b border-sovia-100 pb-5 mb-5">
              <div>
                <h2 className="text-xl font-serif text-sovia-900 font-semibold mb-1">Detail Pesanan</h2>
                <p className="text-sovia-500 text-sm">Order #{selectedOrder.id.slice(-8)} • {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-sovia-100 text-sovia-500 transition-colors hover:text-sovia-800"
                title="Tutup Detail"
              >
                <XCircle className="w-8 h-8" />
              </button>
            </div>

            {renderOrderDetails(selectedOrder, false)}
          </div>
        )}
      </div>
      {/* Tracking Number Modal (Shadcn Style) */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-sovia-50 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-sovia-100">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-sovia-900 mb-2">Input Nomor Resi</h2>
              <p className="text-sm text-sovia-500 mb-5 leading-relaxed">
                Silakan masukkan nomor resi pengiriman untuk pesanan ini. Pelanggan akan dapat melacak pesanannya menggunakan nomor ini.
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-sovia-700">Nomor Resi <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  autoFocus
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Contoh: JP1234567890"
                  className="w-full px-3 py-3 border border-sovia-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sovia-800 focus:border-sovia-800 text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-sovia-50/80 border-t border-sovia-100 flex justify-end gap-3">
              <button
                onClick={() => setTrackingModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-sovia-700 hover:bg-sovia-100  bg-sovia-50 rounded-lg transition-colors border border-sovia-200 shadow-sm"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!trackingInput.trim()) {
                    toast.error("Nomor resi wajib diisi!");
                    return;
                  }
                  if (trackingOrderId) {
                    updateOrderStatus(trackingOrderId, "SHIPPED", trackingInput.trim());
                    setTrackingModalOpen(false);
                  }
                }}
                className="px-4 py-2 text-sm font-medium hover:bg-sovia-600 text-sovia-50 bg-sovia-700  rounded-lg shadow-sm transition-colors"
              >
                Simpan & Kirim
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Generic Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-sovia-50 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-sovia-100">
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-2 ${confirmModal.action === 'REJECT' ? 'text-rose-600' : 'text-sovia-900'}`}>
                {confirmModal.title}
              </h2>
              <p className="text-sm text-sovia-500 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-sovia-50/80 border-t border-sovia-100 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-sovia-700 hover:bg-sovia-100 bg-sovia-50 rounded-lg transition-colors border border-sovia-200 shadow-sm"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (confirmModal.action === 'UPDATE_STATUS' && confirmModal.orderId && confirmModal.targetStatus) {
                    updateOrderStatus(confirmModal.orderId, confirmModal.targetStatus);
                  } else if (confirmModal.action === 'REJECT' && confirmModal.orderId) {
                    confirmOrder(confirmModal.orderId, false, true);
                  }
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className={`px-4 py-2 text-sm font-medium text-sovia-50 rounded-lg shadow-sm transition-colors ${
                  confirmModal.action === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'hover:bg-sovia-600 text-sovia-50 bg-sovia-700'
                }`}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}