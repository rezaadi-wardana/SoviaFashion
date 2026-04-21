"use client"

import { useEffect, useState } from "react"
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface ReportData {
  totalRevenue: number
  totalOrders: number
  totalProductsSold: number
  averageOrderValue: number
  ordersByMonth: { month: string; orders: number; revenue: number }[]
  topProducts: { name: string; sold: number; revenue: number }[]
  ordersByStatus: { status: string; count: number }[]
}

const COLORS = ["#be123c", "#0ea5e9", "#8b5cf6", "#22c55e", "#f59e0b"]

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProductsSold: 0,
    averageOrderValue: 0,
    ordersByMonth: [],
    topProducts: [],
    ordersByStatus: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    try {
      const res = await fetch("/api/admin/reports")
      if (res.ok) {
        const reportData = await res.json()
        setData(reportData)
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const summaryCards = [
    {
      label: "Total Revenue",
      value: formatPrice(data.totalRevenue),
      icon: DollarSign,
    },
    {
      label: "Total Orders",
      value: data.totalOrders.toString(),
      icon: ShoppingCart,
    },
    {
      label: "Products Sold",
      value: data.totalProductsSold.toString(),
      icon: Package,
    },
    {
      label: "Average Order Value",
      value: formatPrice(data.averageOrderValue),
      icon: TrendingUp,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-stone-900 text-3xl font-serif mb-2">Sales Reports</h1>
        <p className="text-stone-700 text-sm">
          View detailed sales analytics and performance metrics.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {summaryCards.map((card, index) => (
          <div key={index} className="bg-white h-40 p-6 rounded-lg shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-stone-700 text-sm">{card.label}</p>
              <card.icon className="w-5 h-5 text-stone-600" />
            </div>
            <p className="text-stone-900 text-2xl font-serif">
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-8">
        {/* Revenue by Month */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-stone-900 text-xl font-serif mb-6">
            Revenue by Month
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ordersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="month" stroke="#78716c" fontSize={12} />
                <YAxis stroke="#78716c" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e7e5e4",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => formatPrice(Number(value) || 0)}
                />
                <Bar dataKey="revenue" fill="#be123c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-stone-900 text-xl font-serif mb-6">
            Orders by Status
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {data.ordersByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-8 rounded-lg shadow-lg mt-8">
        <h2 className="text-stone-900 text-xl font-serif mb-6">
          Top Selling Products
        </h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="text-left py-4 text-stone-700 text-xs font-semibold uppercase">
                Product
              </th>
              <th className="text-left py-4 text-stone-700 text-xs font-semibold uppercase">
                Units Sold
              </th>
              <th className="text-left py-4 text-stone-700 text-xs font-semibold uppercase">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.map((product, index) => (
              <tr key={index} className="border-b border-stone-100">
                <td className="py-4 text-stone-900 text-sm">{product.name}</td>
                <td className="py-4 text-stone-700 text-sm">{product.sold}</td>
                <td className="py-4 text-stone-900 text-sm font-medium">
                  {formatPrice(product.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}