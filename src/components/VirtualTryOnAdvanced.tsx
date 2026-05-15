'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Sparkles, UploadCloud, CheckCircle2, AlertCircle, RefreshCw, Download, Image as ImageIcon } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface Product {
  id: string;
  name: string;
  tryOnImage: string;
  category: string;
}

export default function VirtualTryOnAdvanced({ products = [] }: { products?: Product[] }) {
  const { data: session } = useSession();
  const [humanFile, setHumanFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [humanPreview, setHumanPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [category, setCategory] = useState<string>('upper_body');

  useEffect(() => {
    if (selectedProduct) {
      const cat = selectedProduct.category.toLowerCase();
      if (cat.includes('atas') || cat.includes('kemeja') || cat.includes('kaos') || cat.includes('blus')) {
        setCategory('upper_body');
      } else if (cat.includes('bawah') || cat.includes('rok') || cat.includes('celana')) {
        setCategory('lower_body');
      } else if (cat.includes('dress') || cat.includes('gamis')) {
        setCategory('dresses');
      }
    }
  }, [selectedProduct]);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/public', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!humanFile || !selectedProduct) {
      return;
    }

    if (!session) {
      const tryOnCount = parseInt(localStorage.getItem('guest_tryon_count') || '0');
      if (tryOnCount >= 1) {
        alert("Batas penggunaan gratis Virtual Try-On telah habis. Silakan Masuk (Login) untuk menggunakan fitur ini tanpa batas.");
        signIn("google", { callbackUrl: "/virtual-tryon" });
        return;
      }
      localStorage.setItem('guest_tryon_count', (tryOnCount + 1).toString());
    }

    setIsLoading(true);
    setStatus('Mengunggah gambar...');
    setResultImage(null);
    setPredictionId(null);

    try {
      const humanImageUrl = await uploadImage(humanFile);
      const garmentImageUrl = selectedProduct.tryOnImage;

      setStatus('Memulai proses virtual try-on...');

      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humanImageUrl,
          garmentImageUrl,
          garmentDesc: `Pakaian dari Sovia Fashion: ${selectedProduct.name}`,
          category: category, 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memulai prediksi');

      const newPredictionId = data.id;
      setPredictionId(newPredictionId);
      setStatus('AI sedang bekerja, mohon tunggu...');

      if (pollingInterval.current) clearInterval(pollingInterval.current);
      let pollCount = 0;
      const MAX_POLLS = 72; // 72 * 2.5s = 180s = 3 minutes max
      pollingInterval.current = setInterval(async () => {
        pollCount++;
        if (pollCount > MAX_POLLS) {
          setStatus('Timeout: proses terlalu lama. Silakan coba lagi.');
          setIsLoading(false);
          if (pollingInterval.current) clearInterval(pollingInterval.current);
          return;
        }
        try {
          const statusRes = await fetch(`/api/tryon/${newPredictionId}`);
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          if (statusData.status === 'COMPLETED') {
            setResultImage(statusData.resultImageUrl);
            setStatus('Selesai!');
            setIsLoading(false);
            if (pollingInterval.current) clearInterval(pollingInterval.current);
          } else if (statusData.status === 'FAILED') {
            setStatus(`Proses gagal: ${statusData.error || 'silakan coba lagi.'}`);
            setIsLoading(false);
            if (pollingInterval.current) clearInterval(pollingInterval.current);
          } else {
            // Show a human-readable status with progress indicator
            const statusMap: Record<string, string> = {
              'starting': 'Menginisialisasi model AI...',
              'processing': 'AI sedang memproses gambar...',
            };
            setStatus(statusMap[statusData.status] || `Status: ${statusData.status}`);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2500); 
    } catch (error) {
      console.error(error);
      setStatus('Terjadi kesalahan. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 mt-12 bg-sovia-50 rounded-2xl shadow-sm border border-sovia-200/60">
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-accent-100 rounded-full mb-2">
          <Sparkles className="w-8 h-8 text-sovia-600" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-sovia-900">Advanced AI Try-On</h2>
        <p className="text-sovia-500 max-w-lg mx-auto">
          Unggah foto Anda dan foto produk pilihan Anda. Teknologi AI kami akan menggabungkannya dengan sangat realistis!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload Foto Model */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-sovia-700">1. Foto Anda (Full Body / Half Body)</label>
            <div className="relative group border-2 border-dashed border-sovia-300 hover:border-accent-300 bg-sovia-50 rounded-xl transition-all duration-200 overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setHumanFile(file);
                    setHumanPreview(URL.createObjectURL(file));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {humanPreview ? (
                <img src={humanPreview} alt="Preview Anda" className="w-full h-full object-cover absolute inset-0" />
              ) : (
                <div className="flex flex-col items-center text-sovia-400 group-hover:text-accent-400 transition-colors p-6 text-center">
                  <UploadCloud className="w-12 h-12 mb-3" />
                  <p className="font-medium text-sm">Klik atau drop foto Anda di sini</p>
                  <p className="text-xs mt-1 opacity-70">Pastikan pose tubuh terlihat jelas</p>
                </div>
              )}
              {humanPreview && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-sovia-900 text-sovia-50 text-xs px-3 py-1.5 rounded-full backdrop-blur-md z-20 pointer-events-none">
                  Klik untuk mengganti foto
                </div>
              )}
            </div>
          </div>

          {/* Pilih Produk */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-sovia-700">2. Pilih Pakaian</label>
            <div className="relative mb-4">
              <CustomSelect
                options={products.map(p => ({ value: p.id, label: p.name }))}
                value={selectedProduct?.id || ''}
                onChange={(val) => {
                  const p = products.find(prod => prod.id === val);
                  setSelectedProduct(p || null);
                }}
                placeholder="-- Pilih Pakaian --"
              />
            </div>

            <div className="relative border-2 border-sovia-300 bg-sovia-50 rounded-xl overflow-hidden h-[230px] flex flex-col items-center justify-center">
              {selectedProduct ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedProduct.tryOnImage} alt={selectedProduct.name} className="w-full h-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center text-sovia-400 p-6 text-center">
                  <ImageIcon className="w-12 h-12 mb-3" />
                  <p className="font-medium text-sm">Pilih produk di atas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden">
          <label className="text-sm font-medium text-sovia-700 whitespace-nowrap">Kategori Pakaian:</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 w-full bg-sovia-50 border border-sovia-200 text-sovia-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
          >
            <option value="upper_body">Atasan (Kaos, Kemeja, Blus)</option>
            <option value="lower_body">Bawahan (Celana, Rok)</option>
            <option value="dresses">Dress / Gamis</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading || !humanFile || !selectedProduct}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-sm flex justify-center items-center gap-2 transition-all duration-300
            ${(isLoading || !humanFile || !selectedProduct) 
              ? 'bg-sovia-200 text-sovia-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-sovia-600 to-accent-1000 hover:from-accent-400 hover:to-accent-300 text-white hover:shadow-md hover:-translate-y-0.5'}`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              {status || 'Memproses...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Try-On
            </>
          )}
        </button>
      </form>

      {/* Progress Info */}
      {isLoading && (
        <div className="mt-8 p-6 bg-accent-100 border border-accent-100 rounded-xl text-center">
          <RefreshCw className="w-8 h-8 text-accent-400 animate-spin mx-auto mb-3" />
          <h3 className="font-semibold text-sovia-800">AI Sedang Bekerja</h3>
          <p className="text-sovia-500 text-sm mt-1">{status}</p>
          <p className="text-xs text-sovia-400 mt-4">Proses ini dapat memakan waktu 30-60 detik tergantung kerumitan gambar.</p>
        </div>
      )}

      {/* Result Area */}
      {resultImage && !isLoading && (
        <div className="mt-10 border-t border-sovia-200 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-sovia-900">Hasil Try-On</h2>
          </div>
          
          <div className="relative group overflow-hidden rounded-2xl shadow-xl max-w-md mx-auto border-4 border-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={resultImage} 
              alt="Hasil Try-On" 
              className="w-full h-auto object-cover" 
            />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(resultImage);
                    const blob = await res.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = objectUrl;
                    link.download = `sovia-advanced-tryon-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(objectUrl);
                  } catch (e) {
                    console.error('Gagal mendownload gambar', e);
                    window.open(resultImage, '_blank');
                  }
                }}
                className="bg-sovia-50 text-sovia-900 font-semibold py-3 px-6 rounded-full flex items-center gap-2 hover:bg-accent-100 hover:text-sovia-600 hover:scale-105 transition-all shadow-lg"
              >
                <Download className="w-5 h-5" />
                Simpan Hasil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
