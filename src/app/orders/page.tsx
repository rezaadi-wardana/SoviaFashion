"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"
import { toast } from "sonner"

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
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", icon: Clock, color: "text-yellow-600" },
  PACKING: { label: "Dalam Pengemasan", icon: Package, color: "text-blue-600" },
  SHIPPED: { label: "Dikirim", icon: Truck, color: "text-purple-600" },
  COMPLETED: { label: "Selesai", icon: CheckCircle, color: "text-green-600" },
  CANCELLED: { label: "Dibatalkan", icon: X, color: "text-red-600" },
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
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
    if (session) {
      fetchOrders()
    }
  }, [session])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-stone-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 text-lg mb-4">Please sign in to view your orders</p>
          <Link href="/auth/signin" className="px-6 py-3 bg-stone-600 text-white rounded-lg">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <h1 className="text-stone-900 text-4xl font-serif mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto mb-4 text-stone-400" />
            <p className="text-stone-600 text-lg mb-4">No orders yet</p>
            <Link
              href="/catalog"
              className="px-6 py-3 bg-stone-600 text-white rounded-lg inline-block"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT
              const Icon = statusInfo.icon

              return (
                <div key={order.id} className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
                  <div className="flex justify-between items-start pb-4 border-b border-stone-200 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                    <div>
                      <p className="text-stone-500 text-sm">Order #{order.id.slice(-8)}</p>
                      <p className="text-stone-700 text-sm">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-2 px-3 py-1 bg-stone-50 rounded-full ${statusInfo.color}`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{statusInfo.label}</span>
                      </div>
                      <div className="flex items-center gap-1 text-stone-500 hover:text-stone-800 text-xs">
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
                      <div className="bg-stone-50 p-4 rounded-lg mb-6">
                        <h4 className="text-stone-800 text-sm font-medium mb-3">Riwayat Status Pesanan</h4>
                        <div className="flex flex-col gap-2 relative">
                           <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-stone-200"></div>
                           <div className="flex gap-3 relative z-10">
                              <div className="w-4 h-4 rounded-full bg-stone-400 mt-0.5 ring-4 ring-stone-50"></div>
                              <div className="flex-1">
                                <p className="text-stone-800 text-sm font-medium">Pesanan Dibuat</p>
                                <p className="text-stone-500 text-xs">{formatDate(order.createdAt)}</p>
                              </div>
                           </div>
                           {order.status !== "PENDING_PAYMENT" && (
                             <div className="flex gap-3 relative z-10">
                                <div className="w-4 h-4 rounded-full bg-stone-400 mt-0.5 ring-4 ring-stone-50"></div>
                                <div className="flex-1">
                                  <p className="text-stone-800 text-sm font-medium">Pesanan Diproses / Dikonfirmasi</p>
                                </div>
                             </div>
                           )}
                           {(order.status === "SHIPPED" || order.status === "COMPLETED") && (
                             <div className="flex gap-3 relative z-10">
                                <div className="w-4 h-4 rounded-full bg-blue-500 mt-0.5 ring-4 ring-stone-50"></div>
                                <div className="flex-1">
                                  <p className="text-stone-800 text-sm font-medium">Pesanan Dalam Perjalanan</p>
                                  {order.trackingNumber && (
                                    <p className="text-stone-600 text-xs mt-1">Resi: <span className="font-mono bg-stone-200 px-1 rounded">{order.trackingNumber}</span></p>
                                  )}
                                </div>
                             </div>
                           )}
                           {order.status === "COMPLETED" && (
                             <div className="flex gap-3 relative z-10">
                                <div className="w-4 h-4 rounded-full bg-green-500 mt-0.5 ring-4 ring-stone-50"></div>
                                <div className="flex-1">
                                  <p className="text-green-700 text-sm font-medium">Pesanan Selesai</p>
                                  <p className="text-stone-500 text-xs">{formatDate(order.updatedAt)}</p>
                                </div>
                             </div>
                           )}
                        </div>
                      </div>

                      {order.items.map((item) => {
                        let imageUrl = "https://placehold.co/80x96/fafaf9/1c1917?text=Item"
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
                            <div className="w-20 h-24 bg-stone-200 rounded flex-shrink-0 overflow-hidden">
                              <Image
                                src={imageUrl}
                                alt={item.product.name}
                                width={80}
                                height={96}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-stone-900 text-lg font-serif">
                                {item.product.name}
                              </h3>
                              <p className="text-stone-700 text-sm">
                                {item.color && `Color: ${item.color}`}
                                {item.size && ` | Size: ${item.size}`}
                              </p>
                              <div className="flex justify-between mt-2">
                                <span className="text-stone-700 text-sm">Qty: {item.quantity}</span>
                                <span className="text-stone-900 font-medium">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="pt-4 mt-4 border-t border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-stone-700 text-sm font-medium">
                        Pengiriman: {order.shippingMethod === "EXPEDITION" ? "Ekspedisi" : "COD"}
                        {order.courierService && ` (${order.courierService})`}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-stone-600 text-sm mt-1">No Resi: <span className="font-mono bg-stone-100 px-1 py-0.5 rounded">{order.trackingNumber}</span></p>
                      )}
                      <p className="text-stone-500 text-xs mt-1">{order.address}</p>
                    </div>
                    <div className="text-right w-full md:w-auto flex flex-col items-end gap-3">
                      <p className="text-stone-900 text-lg font-medium">
                        Total: {formatPrice(order.total)}
                      </p>
                      {order.status === "SHIPPED" && (
                        <button
                          onClick={() => handleCompleteOrder(order.id)}
                          className="px-6 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors shadow-md"
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
    </div>
  )
}