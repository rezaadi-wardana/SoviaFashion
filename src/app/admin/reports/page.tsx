"use client"

import { useEffect, useState } from "react"
import { DollarSign, ShoppingCart, Package, TrendingUp, Wallet, Activity, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import LoadingOverlay from "@/components/ui/LoadingOverlay"
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
  Legend,
} from "recharts"

interface ReportData {
  totalRevenue: number
  totalProfit: number
  totalOrders: number
  totalProductsSold: number
  averageOrderValue: number
  ordersByMonth: { month: string; orders: number; revenue: number; expense: number; profit: number }[]
  topProducts: { name: string; sold: number; revenue: number }[]
  ordersByStatus: { status: string; count: number }[]
  rawOrders: {
    id: string
    createdAt: string
    recipientName: string
    phone: string
    address: string
    detailAddress?: string | null
    total: number
    subtotal: number
    shippingCost: number
    status: string
    paymentMethod: string
    courierName?: string | null
    trackingNumber?: string | null
    expense: number
    profit: number
    items: {
      name: string
      quantity: number
      price: number
      buyPrice: number
      size?: string | null
      color?: string | null
    }[]
  }[]
}

const COLORS = ["#B49583", "#0ea5e9", "#8b5cf6", "#22c55e", "#f59e0b"]

/**
 * Komponen Utama Halaman Laporan Penjualan Admin yang menampilkan ringkasan keuangan,
 * grafik pendapatan bulanan, distribusi status pesanan, produk terlaris, dan riwayat
 * pesanan lengkap dengan kemampuan ekspor ke file PDF.
 */
export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData>({
    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0,
    totalProductsSold: 0,
    averageOrderValue: 0,
    ordersByMonth: [],
    topProducts: [],
    ordersByStatus: [],
    rawOrders: [],
  })
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const [pdfFilter, setPdfFilter] = useState("ALL")
  const [selectedOrder, setSelectedOrder] = useState<ReportData['rawOrders'][0] | null>(null)
  const itemsPerPage = 20

  useEffect(() => {
    fetchReports()
  }, [])

  /**
   * Mengambil seluruh data laporan penjualan dari API /api/admin/reports.
   */
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

  const availableMonths = Array.from(new Set(data.rawOrders.map(o => {
    const d = new Date(o.createdAt)
    return d.toLocaleString('default', { month: 'short', year: 'numeric' })
  })))
  const availableYears = Array.from(new Set(data.rawOrders.map(o => new Date(o.createdAt).getFullYear().toString())))

  /**
   * Menyaring daftar pesanan berdasarkan filter periode yang dipilih (semua waktu, bulan, atau tahun).
   */
  const filteredOrders = data.rawOrders.filter(order => {
    if (pdfFilter === "ALL") return true
    const orderDate = new Date(order.createdAt)
    if (pdfFilter.length === 4) {
      return orderDate.getFullYear().toString() === pdfFilter
    } else {
      return orderDate.toLocaleString('default', { month: 'short', year: 'numeric' }) === pdfFilter
    }
  })

  let dynamicRevenue = 0;
  let dynamicProfit = 0;
  let dynamicOrders = 0;
  let dynamicProductsSold = 0;
  const statusMap: Record<string, number> = {};
  const productsMap: Record<string, { name: string; sold: number; revenue: number }> = {};
  
  filteredOrders.forEach(order => {
    if (order.status !== "CANCELLED") {
      dynamicRevenue += order.total;
      dynamicProfit += order.profit;
      
      order.items.forEach(item => {
        dynamicProductsSold += item.quantity;
        if (!productsMap[item.name]) {
          productsMap[item.name] = { name: item.name, sold: 0, revenue: 0 };
        }
        productsMap[item.name].sold += item.quantity;
        productsMap[item.name].revenue += item.price * item.quantity;
      });
    }
    dynamicOrders++;
    statusMap[order.status] = (statusMap[order.status] || 0) + 1;
  });

  const dynamicAverageOrderValue = dynamicOrders > 0 ? dynamicRevenue / dynamicOrders : 0;
  const dynamicTopProducts = Object.values(productsMap)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
  const dynamicOrdersByStatus = Object.entries(statusMap).map(([status, count]) => ({
    status, count
  }));
  const dynamicOrdersByMonth = data.ordersByMonth.filter(d => {
    if (pdfFilter === "ALL") return true;
    if (pdfFilter.length === 4) {
      return d.month.includes(pdfFilter);
    } else {
      return d.month === pdfFilter;
    }
  });

  const summaryCards = [
    {
      label: "Total Pendapatan",
      value: formatPrice(dynamicRevenue),
      icon: DollarSign,
    },
    {
      label: "Total Laba",
      value: formatPrice(dynamicProfit || 0),
      icon: Wallet,
    },
    {
      label: "Total Pesanan",
      value: dynamicOrders.toString(),
      icon: ShoppingCart,
    },
    {
      label: "Produk Terjual",
      value: dynamicProductsSold.toString(),
      icon: Package,
    },
    {
      label: "Rata-rata Nilai Pesanan",
      value: formatPrice(dynamicAverageOrderValue),
      icon: Activity,
    },
  ]

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  /**
   * Menghasilkan dan mengunduh file PDF laporan penjualan lengkap menggunakan library jsPDF,
   * mencakup ringkasan keuangan, produk terlaris, dan detail riwayat pesanan berdasarkan filter periode.
   */
  const handleGeneratePDF = () => {
    const doc = new jsPDF('landscape')
    doc.setFontSize(18)
    doc.text("Laporan Penjualan Lengkap Sovia Fashion", 14, 22)
    doc.setFontSize(11)
    doc.text(`Periode: ${pdfFilter === "ALL" ? "Semua Waktu" : pdfFilter}`, 14, 30)

    // 1. Ringkasan Penjualan
    doc.setFontSize(14)
    doc.text("Ringkasan Penjualan", 14, 42)
    autoTable(doc, {
      startY: 46,
      head: [["Total Pendapatan", "Total Pengeluaran", "Total Laba", "Total Pesanan", "Total Produk Terjual"]],
      body: [[
        formatPrice(dynamicRevenue),
        formatPrice(dynamicRevenue - dynamicProfit),
        formatPrice(dynamicProfit),
        dynamicOrders.toString(),
        dynamicProductsSold.toString()
      ]],
      theme: 'grid',
      headStyles: { fillColor: [180, 149, 131] }
    })

    // 2. Produk Terlaris
    doc.text("Produk Terlaris", 14, (doc as any).lastAutoTable.finalY + 12)
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 16,
      head: [["Nama Produk", "Unit Terjual", "Pendapatan"]],
      body: dynamicTopProducts.map(p => [p.name, p.sold.toString(), formatPrice(p.revenue)]),
      theme: 'grid',
      headStyles: { fillColor: [180, 149, 131] }
    })

    // 3. Detail Riwayat Pesanan
    doc.text("Detail Riwayat Pesanan", 14, (doc as any).lastAutoTable.finalY + 12)
    const tableData = filteredOrders.map(o => {
      const itemsStr = o.items.map(i => `- ${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ''}`).join('\n')
      return [
        o.id.slice(-8),
        new Date(o.createdAt).toLocaleDateString("id-ID"),
        `${o.recipientName}\n${o.phone}`,
        itemsStr,
        o.status,
        `Rp ${o.total.toLocaleString("id-ID")}`,
        `Rp ${o.expense.toLocaleString("id-ID")}`,
        `Rp ${o.profit.toLocaleString("id-ID")}`
      ]
    })

    let totalRev = 0, totalExp = 0, totalProf = 0;
    filteredOrders.forEach(o => {
      totalRev += o.total;
      totalExp += o.expense;
      totalProf += o.profit;
    });

    tableData.push([
      "TOTAL",
      "",
      "",
      "",
      "",
      `Rp ${totalRev.toLocaleString("id-ID")}`,
      `Rp ${totalExp.toLocaleString("id-ID")}`,
      `Rp ${totalProf.toLocaleString("id-ID")}`
    ])

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 16,
      head: [["Order ID", "Tanggal", "Pembeli", "Daftar Item", "Status", "Pendapatan", "Pengeluaran", "Laba"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [180, 149, 131] },
      styles: { cellWidth: 'wrap' },
      columnStyles: {
        3: { cellWidth: 70 } // Give more width to items
      }
    })

    doc.save(`Laporan_Penjualan_Lengkap_${pdfFilter.replace(' ', '_')}.pdf`)
  }

  if (loading) return <LoadingOverlay />

  return (
    <div className="relative">
      <div className="mb-8 -mx-6 px-6 sticky top-0 z-20 bg-sovia-50 pt-6 pb-4 border-b border-sovia-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-sovia-900 text-3xl font-serif mb-2">Penjualan Produk</h1>
          <p className="text-sovia-700 text-sm">
            Lihat performa penjualan produk.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select 
            value={pdfFilter}
            onChange={(e) => { setPdfFilter(e.target.value); setCurrentPage(1); }}
            className="bg-sovia-200/30 border-sovia-200 border text-sovia-900 text-sm rounded-lg focus:ring-sovia-500 focus:border-sovia-500 block p-2.5"
          >
            <option value="ALL">Semua Waktu</option>
            <optgroup label="Bulanan">
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </optgroup>
            <optgroup label="Tahunan">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </optgroup>
          </select>
          <button 
            onClick={handleGeneratePDF}
            className="flex items-center gap-2 bg-sovia-600 hover:bg-sovia-700 text-sovia-50 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm active:transform-[scale(0.95)]"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Download PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6 mb-8 md:mb-12">
        {summaryCards.map((card, index) => (
          <div key={index} className="bg-[#F3EFE6] p-4 md:p-6 rounded-lg shadow-lg flex flex-col justify-between min-h-[120px] md:min-h-[140px] overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sovia-700 text-xs md:text-sm leading-tight">{card.label}</p>
              <card.icon className="w-4 h-4 md:w-5 md:h-5 text-sovia-600 shrink-0 ml-1" />
            </div>
            <p className="text-sovia-900 text-base md:text-2xl font-serif truncate" title={card.value}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Revenue by Month */}
        <div className="bg-[#F3EFE6] p-8 rounded-lg shadow-lg">
          <h2 className="text-sovia-900 text-xl font-serif mb-6">
            Pendapatan per Bulan
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicOrdersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5D8D2" />
                <XAxis dataKey="month" stroke="#645445" fontSize={12} />
                <YAxis stroke="#645445" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F3EFE6",
                    border: "1px solid #E5D8D2",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => formatPrice(Number(value) || 0)}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="revenue" name="Revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-[#F3EFE6] p-8 rounded-lg shadow-lg">
          <h2 className="text-sovia-900 text-xl font-serif mb-6">
            Status Pesanan
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dynamicOrdersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {dynamicOrdersByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-[#F3EFE6] p-6 md:p-8 rounded-lg shadow-lg mt-8">
        <h2 className="text-sovia-900 text-xl font-serif mb-6">
          Produk Terlaris
        </h2>
        <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-sovia-200">
              <th className="text-left py-4 text-sovia-700 text-xs font-semibold uppercase">
                Produk
              </th>
              <th className="text-left py-4 text-sovia-700 text-xs font-semibold uppercase">
                Unit Terjual
              </th>
              <th className="text-left py-4 text-sovia-700 text-xs font-semibold uppercase">
                Pendapatan
              </th>
            </tr>
          </thead>
          <tbody>
            {dynamicTopProducts.map((product, index) => (
              <tr key={index} className="border-b border-sovia-100">
                <td className="py-4 text-sovia-900 text-sm">{product.name}</td>
                <td className="py-4 text-sovia-700 text-sm">{product.sold}</td>
                <td className="py-4 text-sovia-900 text-sm font-medium">
                  {formatPrice(product.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {/* Order History */}
      <div className="bg-[#F3EFE6] p-6 md:p-8 rounded-lg shadow-lg mt-8">
        <h2 className="text-sovia-900 text-xl font-serif mb-6">
          Riwayat Pesanan
        </h2>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-sovia-200">
                <th className="text-left py-4 text-sovia-700 text-xs font-semibold uppercase">ID Pesanan</th>
                <th className="text-left py-4 text-sovia-700 text-xs font-semibold uppercase">Tanggal</th>
                <th className="text-left py-4 text-sovia-700 text-xs font-semibold uppercase">Pelanggan</th>
                <th className="text-left py-4 text-sovia-700 text-xs font-semibold uppercase">Status</th>
                <th className="text-left py-4 text-sovia-700 text-xs font-semibold uppercase">Pendapatan</th>
                <th className="text-left py-4 text-sovia-700 text-xs font-semibold uppercase">Biaya</th>
                <th className="text-left py-4 text-sovia-700 text-xs font-semibold uppercase">Laba</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className="border-b border-sovia-100 hover:bg-sovia-100/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="py-4 text-sovia-900 text-sm font-mono">{order.id.slice(-8)}</td>
                  <td className="py-4 text-sovia-700 text-sm">{new Date(order.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="py-4 text-sovia-900 text-sm">{order.recipientName}</td>
                  <td className="py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 text-sovia-900 text-sm font-medium">{formatPrice(order.total)}</td>
                  <td className="py-4 text-red-600 text-sm font-medium">{formatPrice(order.expense)}</td>
                  <td className="py-4 text-green-600 text-sm font-medium">{formatPrice(order.profit)}</td>
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sovia-500 text-sm">
                    Tidak ada pesanan untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-sovia-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-sovia-100 text-sovia-600 hover:bg-sovia-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-sovia-100 text-sovia-600 hover:bg-sovia-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-2xl w-full">
            {/* Tombol Close overlap */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute -top-3 -right-3 w-10 h-10 hover:bg-sovia-600 text-sovia-50 bg-sovia-700 rounded-full flex items-center justify-center shadow-lg z-50 transition-all text-2xl font-light active:transform-[scale(0.95)]"
            >
              ×
            </button>

            <div className="bg-[#F3EFE6] rounded-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
              <div className="px-6 md:px-8 py-5 border-b border-sovia-200 bg-[#F3EFE6] shrink-0 z-10 shadow-sm relative">
                <h2 className="text-sovia-900 text-2xl font-serif">
                  Detail Pesanan
                </h2>
              </div>
            
              <div className="p-6 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sovia-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-sovia-400 space-y-6">
                {/* Top Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sovia-500 text-xs uppercase mb-1">ID Pesanan</p>
                  <p className="text-sovia-900 font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sovia-500 text-xs uppercase mb-1">Tanggal</p>
                  <p className="text-sovia-900 text-sm">{new Date(selectedOrder.createdAt).toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <p className="text-sovia-500 text-xs uppercase mb-1">Status</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${
                    selectedOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    selectedOrder.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sovia-500 text-xs uppercase mb-1">Metode Pembayaran</p>
                  <p className="text-sovia-900 text-sm font-medium">{selectedOrder.paymentMethod || '-'}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-sovia-100/50 p-4 rounded-lg">
                <h4 className="text-sovia-900 font-semibold mb-3 text-sm border-b border-sovia-200 pb-2">Informasi Pelanggan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-sovia-600">Nama</span>
                    <span className="text-sovia-900 font-medium">{selectedOrder.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sovia-600">No. Telepon</span>
                    <span className="text-sovia-900">{selectedOrder.phone}</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-sovia-600">Alamat</span>
                    <span className="text-sovia-900 whitespace-pre-wrap">
                      {selectedOrder.address}
                      {selectedOrder.detailAddress && `\n${selectedOrder.detailAddress}`}
                    </span>
                  </div>
                  {selectedOrder.courierName && (
                    <div className="flex justify-between mt-2 pt-2 border-t border-sovia-200">
                      <span className="text-sovia-600">Courier</span>
                      <span className="text-sovia-900">{selectedOrder.courierName} {selectedOrder.trackingNumber ? `(${selectedOrder.trackingNumber})` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-sovia-900 font-semibold mb-3 text-sm">Produk yang dibeli</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-sovia-50 border border-sovia-100 p-3 rounded-lg shadow-sm">
                      <div>
                        <p className="text-sovia-900 text-sm font-medium">{item.name}</p>
                        <div className="flex gap-2 text-xs text-sovia-600 mt-1">
                          {item.size && <span>Ukuran: {item.size}</span>}
                          {item.color && <span>Warna: {item.color}</span>}
                          <span>Jumlah: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sovia-900 text-sm font-medium">{formatPrice(item.price)}</p>
                        <p className="text-sovia-500 text-xs">Total: {formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-sovia-100/50 border border-sovia-200 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-sovia-600">Subtotal</span>
                  <span className="text-sovia-900">{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sovia-600">Ongkos Kirim</span>
                  <span className="text-sovia-900">{formatPrice(selectedOrder.shippingCost)}</span>
                </div>
                <div className="flex justify-between border-t border-sovia-200 pt-2 font-medium">
                  <span className="text-sovia-900">Total Pemasukan</span>
                  <span className="text-sovia-900">{formatPrice(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Total Pengeluaran</span>
                  <span>{formatPrice(selectedOrder.expense)}</span>
                </div>
                <div className="flex justify-between border-t border-sovia-200 pt-2 font-medium text-green-600">
                  <span>Profit Bersih</span>
                  <span>{formatPrice(selectedOrder.profit)}</span>
                </div>
              </div>
              </div>
              <div className="px-6 md:px-8 py-4 border-t border-sovia-200 bg-[#F3EFE6] shrink-0 z-10 flex justify-end">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2 bg-sovia-200 hover:bg-sovia-300 text-sovia-900 rounded-lg text-sm font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}