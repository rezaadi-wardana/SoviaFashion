export default function ShippingReturnsPage() {
  return (
    <div className="pt-32 pb-24 px-8 bg-sovia-50 min-h-screen">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-4xl font-serif text-sovia-900 mb-8">Shipping & Returns</h1>
        <div className="prose prose-sovia text-sovia-700 space-y-6">
          <h2 className="text-2xl font-serif text-sovia-900 mt-8 mb-4">Pengiriman (Shipping)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Pesanan Anda akan diproses dan dikirim dalam waktu 1-2 hari kerja setelah pembayaran terkonfirmasi.</li>
            <li>Kami bekerja sama dengan berbagai layanan ekspedisi tepercaya yang terintegrasi di platform kami.</li>
            <li>Nomor resi akan otomatis diperbarui dan dapat Anda lacak di halaman pesanan profil Anda.</li>
          </ul>

          <h2 className="text-2xl font-serif text-sovia-900 mt-8 mb-4">Pengembalian (Returns)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Kami menerima pengembalian barang maksimal 3 hari sejak barang diterima berdasarkan laporan resi pengiriman.</li>
            <li>Barang harus dalam kondisi baru, belum pernah dicuci, label/hangtag tidak dilepas, dan tanpa kerusakan/noda.</li>
            <li>Silakan hubungi admin kami melalui WhatsApp untuk panduan lebih lanjut terkait proses retur dan penukaran barang.</li>
            <li>Biaya pengiriman untuk pengembalian barang sepenuhnya ditanggung oleh pembeli, kecuali terdapat kesalahan pengiriman atau cacat produksi dari pihak Sovia Fashion.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
