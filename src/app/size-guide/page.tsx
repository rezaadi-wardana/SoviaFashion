export default function SizeGuidePage() {
  return (
    <div className="pt-32 pb-24 px-8 bg-sovia-50 min-h-screen">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-4xl font-serif text-sovia-900 mb-8">Size Guide</h1>
        <div className="prose prose-sovia text-sovia-700 space-y-6">
          <p>Panduan ukuran untuk koleksi pakaian Sovia Fashion. Silakan ukur dengan saksama sebelum melakukan pemesanan.</p>
          
          <div className="overflow-x-auto w-full mt-8">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-sovia-300 bg-sovia-100">
                  <th className="py-3 px-4 font-serif text-sovia-900">Size</th>
                  <th className="py-3 px-4 font-serif text-sovia-900">Lingkar Dada (cm)</th>
                  <th className="py-3 px-4 font-serif text-sovia-900">Panjang Baju (cm)</th>
                  <th className="py-3 px-4 font-serif text-sovia-900">Panjang Lengan (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-sovia-200">
                  <td className="py-3 px-4 font-medium text-sovia-900">S</td>
                  <td className="py-3 px-4">92</td>
                  <td className="py-3 px-4">135</td>
                  <td className="py-3 px-4">55</td>
                </tr>
                <tr className="border-b border-sovia-200">
                  <td className="py-3 px-4 font-medium text-sovia-900">M</td>
                  <td className="py-3 px-4">96</td>
                  <td className="py-3 px-4">138</td>
                  <td className="py-3 px-4">56</td>
                </tr>
                <tr className="border-b border-sovia-200">
                  <td className="py-3 px-4 font-medium text-sovia-900">L</td>
                  <td className="py-3 px-4">100</td>
                  <td className="py-3 px-4">140</td>
                  <td className="py-3 px-4">57</td>
                </tr>
                <tr className="border-b border-sovia-200">
                  <td className="py-3 px-4 font-medium text-sovia-900">XL</td>
                  <td className="py-3 px-4">104</td>
                  <td className="py-3 px-4">142</td>
                  <td className="py-3 px-4">58</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <p className="mt-6 text-sm text-sovia-500">*Toleransi ukuran 1-2 cm karena proses penjahitan manual.</p>
        </div>
      </div>
    </div>
  )
}
