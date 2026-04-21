"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, Users, ShoppingCart, TrendingUp, DollarSign, Activity, ArrowUp, ArrowDown } from "lucide-react"
import { formatPrice } from "@/lib/utils"
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
  topProducts: { name: string; sold: number; revenue: number }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    revenueChange: 12,
    ordersByDay: [],
    topProducts: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      color: "bg-white",
    },
    {
      label: "Active Visitors",
      value: stats.totalOrders.toString(),
      change: 8,
      icon: Activity,
      color: "bg-white",
    },
    {
      label: "Inventory Status",
      value: stats.totalProducts.toString(),
      change: -3,
      icon: Package,
      color: "bg-red-300",
    },
    {
      label: "Total Customers",
      value: stats.totalUsers.toString(),
      change: 15,
      icon: Users,
      color: "bg-white",
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-stone-900 text-4xl font-serif mb-2">Overview</h1>
          <p className="text-stone-700 text-sm">
            Welcome back to the atelier. Here is your daily summary.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-6 py-3 bg-stone-600 text-white text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          New Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`${card.color} h-48 p-8 rounded-lg shadow-lg flex flex-col justify-between`}
          >
            <div className="flex justify-between items-start">
              <p className="text-stone-700 text-sm">{card.label}</p>
              <card.icon className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <p className="text-stone-900 text-3xl font-serif mb-1">
                {loading ? "..." : card.value}
              </p>
              <p className="text-stone-700 text-xs flex items-center gap-1">
                {card.change > 0 ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {Math.abs(card.change)}% from last month
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        {/* Sales Trajectory */}
        <div className="col-span-2 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-stone-900 text-xl font-serif mb-6">Sales Trajectory</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.ordersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" stroke="#78716c" fontSize={12} />
                <YAxis stroke="#78716c" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e7e5e4",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#be123c"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling */}
        <div className="bg-stone-100 p-8 rounded-lg">
          <h2 className="text-stone-900 text-xl font-serif mb-6">Top Selling Collections</h2>
          <div className="space-y-4">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-200 rounded flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-stone-900 text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-stone-700 text-xs">{product.sold} units</p>
                  </div>
                  <p className="text-stone-600 text-sm font-medium">
                    {formatPrice(product.revenue)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-stone-500 text-sm py-8">
                No sales data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-stone-900 text-xl font-serif mb-6">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                  Order ID
                </th>
                <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                  Customer
                </th>
                <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                  Items
                </th>
                <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                  Total
                </th>
                <th className="text-left py-4 px-4 text-stone-700 text-xs font-semibold uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stone-100">
                <td className="py-4 px-4 text-stone-700 text-sm">#ORD001</td>
                <td className="py-4 px-4 text-stone-700 text-sm">John Doe</td>
                <td className="py-4 px-4 text-stone-700 text-sm">2 items</td>
                <td className="py-4 px-4 text-stone-700 text-sm">
                  Rp 850.000
                </td>
                <td className="py-4 px-4">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    Pending
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}