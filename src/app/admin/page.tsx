"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, Users, ShoppingCart, TrendingUp, DollarSign, Activity, ArrowUp, ArrowDown } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import LoadingOverlay from "@/components/ui/LoadingOverlay"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

interface DashboardStats {
  totalRevenue: number
  totalProducts: number
  totalUsers: number
  totalOrders: number
  revenueChange: number
  ordersByDay: { date: string; orders: number; revenue: number }[]
  topProducts: { name: string; sold: number; revenue: number; image?: string | null }[]
  recentOrders: {
    id: string;
    total: number;
    status: string;
    user: { name: string };
    items: any[];
  }[]
  visitorsByDay: { date: string; visitors: number }[]
}

/**
 * Komponen Utama Halaman Dashboard Admin yang menampilkan statistik ringkasan toko,
 * grafik penjualan harian, grafik pengunjung website, produk terlaris, dan pesanan terbaru.
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    revenueChange: 12,
    ordersByDay: [],
    topProducts: [],
    recentOrders: [],
    visitorsByDay: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    /**
     * Mengambil data statistik penjualan & pengunjung untuk dashboard dari API /api/admin/dashboard.
     */
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/dashboard")
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      label: "Total Pendapatan",
      value: formatPrice(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      color: "bg-[#F3EFE6]",
    },
    {
      label: "Pengunjung",
      value: stats.totalOrders.toString(),
      change: 8,
      icon: Activity,
      color: "bg-[#F3EFE6]",
    },
    {
      label: "Total Produk",
      value: stats.totalProducts.toString(),
      change: -3,
      icon: Package,
      color: "bg-sovia-100",
    },
    {
      label: "Total Pelanggan",
      value: stats.totalUsers.toString(),
      change: 15,
      icon: Users,
      color: "bg-[#F3EFE6]",
    },
  ]
  const statusLabels: Record<string, string> = {
    PENDING_PAYMENT: "Menunggu Pembayaran",
    WAITING_CONFIRMATION: "Menunggu Konfirmasi",
    PACKING: "Dalam Pengemasan",
    SHIPPED: "Dikirim",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  }

  if (loading) return <LoadingOverlay />

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 md:mb-12">
        <div>
          <h1 className="text-sovia-900 text-4xl font-serif mb-2">Dashboard</h1>
          <p className="text-sovia-700 text-sm">
            Selamat datang di Sovia Fashion Admin Dashboard
          </p>
        </div>
        <Link
          href="/admin/products?new=true"
          className="px-6 py-3 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 transition duration-300 text-sm font-medium rounded-lg flex items-center gap-2 active:transform-[scale(0.95)]"
        >
          <Package className="w-4 h-4" />
          Tambah Koleksi Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`${card.color} min-h-[130px] md:min-h-[160px] p-4 md:p-6 lg:p-8 rounded-lg shadow-lg flex flex-col justify-between overflow-hidden`}
          >
            <div className="flex justify-between items-start">
              <p className="text-sovia-700 text-xs md:text-sm leading-tight">{card.label}</p>
              <card.icon className="w-4 h-4 md:w-5 md:h-5 text-sovia-600 shrink-0 ml-1" />
            </div>
            <div className="min-w-0">
              <p className="text-sovia-900 text-base md:text-2xl lg:text-3xl font-serif mb-1 truncate" title={card.value}>
                {loading ? "..." : card.value}
              </p>
              <p className="text-sovia-700 text-[10px] md:text-xs flex items-center gap-1">
                {card.change > 0 ? (
                  <ArrowUp className="w-3 h-3 shrink-0" />
                ) : (
                  <ArrowDown className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">{Math.abs(card.change)}% dari bulan lalu</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Sales Trajectory */}
        <div className="bg-sovia-50 p-8 rounded-lg shadow-lg">
          <h2 className="text-sovia-800 text-xl font-serif mb-6">Grafik Penjualan</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.ordersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sovia-200)" />
                <XAxis dataKey="date" stroke="var(--sovia-600)" fontSize={12} />
                <YAxis stroke="var(--sovia-600)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--sovia-200)",
                    borderRadius: "8px",
                    color: "var(--sovia-900)"
                  }}
                  itemStyle={{ color: "var(--sovia-800)" }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--sovia-400)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visitor Traffic */}
        <div className="bg-sovia-50 p-8 rounded-lg shadow-lg">
          <h2 className="text-sovia-800 text-xl font-serif mb-6">Pengunjung Website</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.visitorsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sovia-200)" />
                <XAxis dataKey="date" stroke="var(--sovia-600)" fontSize={12} />
                <YAxis stroke="var(--sovia-600)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--sovia-200)",
                    borderRadius: "8px",
                    color: "var(--sovia-900)"
                  }}
                  cursor={{ fill: 'var(--sovia-100)' }}
                  itemStyle={{ color: "var(--sovia-900)" }}
                />
                <Bar dataKey="visitors" fill="var(--sovia-600)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Top Selling & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
        {/* Top Selling */}
        <div className="col-span-1 bg-sovia-100 p-6 md:p-8 rounded-lg shadow-lg">
          <h2 className="text-sovia-900 text-xl font-serif mb-6">Penjualan Terlaris</h2>
          <div className="space-y-4">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-sovia-200 rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sovia-900 text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-sovia-700 text-xs">{product.sold} terjual</p>
                  </div>
                  <p className="text-sovia-700 text-sm font-medium whitespace-nowrap">
                    {formatPrice(product.revenue)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-sovia-500 text-sm py-8">
                Belum ada data penjualan
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="col-span-1 lg:col-span-2 bg-[#F3EFE6] p-6 md:p-8 rounded-lg shadow-lg">
          <h2 className="text-sovia-900 text-xl font-serif mb-6">Pesanan Terbaru</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-sovia-200">
                  <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase">
                    Order ID
                  </th>
                  <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase">
                    Customer
                  </th>
                  <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase">
                    Items
                  </th>
                  <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase">
                    Total
                  </th>
                  <th className="text-left py-4 px-4 text-sovia-700 text-xs font-semibold uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-sovia-100">
                      <td className="py-4 px-4 text-sovia-700 text-sm">#{order.id.slice(-8)}</td>
                      <td className="py-4 px-4 text-sovia-700 text-sm">{order.user?.name || "Guest"}</td>
                      <td className="py-4 px-4 text-sovia-700 text-sm">{order.items?.length || 0} items</td>
                      <td className="py-4 px-4 text-sovia-700 text-sm">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${order.status === "COMPLETED" ? "bg-emerald-500 text-emerald-50" :
                            order.status === "SHIPPED" ? "bg-indigo-500 text-indigo-50" :
                              order.status === "PACKING" ? "bg-sky-500 text-sky-50" :
                                order.status === "CANCELLED" ? "bg-rose-500 text-rose-50" :
                                  "bg-amber-500 text-amber-50"
                          }`}>
                          {statusLabels[order.status] ?? order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sovia-500 text-sm">
                     Tidak ada order terbaru
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}