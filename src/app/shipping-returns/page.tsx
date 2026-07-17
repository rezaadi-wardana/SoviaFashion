/**
 * Komponen Halaman Pengiriman & Pengembalian (ShippingReturnsPage) yang memuat
 * informasi kebijakan pengiriman barang dan prosedur pengembalian/retur produk Sovia Fashion.
 */
export default function ShippingReturnsPage() {
  return (
    <div className="pt-32 pb-24 px-8 bg-sovia-50 min-h-screen">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-4xl font-serif text-sovia-900 mb-8">Shipping & Returns</h1>
        <div className="prose prose-sovia text-sovia-700 space-y-6">
          <h2 className="text-2xl font-serif text-sovia-900 mt-8 mb-4">Pengiriman (Shipping)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Pesanan Anda akan diproses dan dikirim dalam waktu 1-2 hari kerja setelah pembayaran terkonfirmasi.</li>
            <li>Kami menyediakan berbagai layanan ekspedisi tepercaya di platform kami.</li>
            <li>Nomor resi akan diperbarui dan dapat Anda cek di riwayat pesanan Anda.</li>
          </ul>

          <h2 className="text-2xl font-serif text-sovia-900 mt-8 mb-4">Pengembalian (Returns)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Kami menerima pengembalian barang maksimal 3 hari sejak barang diterima berdasarkan laporan resi pengiriman.</li>
            <li>Barang harus dalam kondisi baru, belum pernah dicuci, label/hangtag tidak dilepas, dan tanpa kerusakan/noda.</li>
            <li>Silakan hubungi admin kami melalui WhatsApp <a href="https://wa.me/62895351139282" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center md:justify-start gap-2 hover:text-sovia-600 transition-colors"><strong>+62895351139282</strong></a> untuk panduan lebih lanjut terkait proses retur dan penukaran barang.</li>
            <li>Biaya pengiriman untuk pengembalian barang sepenuhnya ditanggung oleh pembeli, kecuali terdapat kesalahan pengiriman atau cacat produksi dari pihak Sovia Fashion.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
