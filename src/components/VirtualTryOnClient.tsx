'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, Download, RefreshCw, AlertCircle } from 'lucide-react';

interface Product {
  id: string | number;
  name: string;
  tryOnImage: string;
}

// Ensure TypeScript knows about MediaPipe globals
declare global {
  interface Window {
    Pose: any;
    Camera: any;
  }
}

export default function VirtualTryOnClient({ products }: { products: Product[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tryOnMode, setTryOnMode] = useState<'clothes' | 'hijab'>('clothes');
  const [productImage, setProductImage] = useState<HTMLImageElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);

  // Load product image when selected
  useEffect(() => {
    if (!selectedProduct) {
      setProductImage(null);
      return;
    }
    const img = new Image();
    img.src = selectedProduct.tryOnImage;
    img.crossOrigin = "anonymous";
    img.onload = () => setProductImage(img);
  }, [selectedProduct]);

  // Setup webcam
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function setupCamera() {
      try {
        setLoading(true);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraReady(true);
            setLoading(false);
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Kamera tidak dapat diakses. Pastikan Anda telah memberikan izin kamera.");
        setLoading(false);
      }
    }
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // MediaPipe pose detection & drawing
  useEffect(() => {
    if (!cameraReady || !videoRef.current || !canvasRef.current || typeof window === 'undefined') return;

    if (!window.Pose || !window.Camera) {
      setError("Library MediaPipe gagal dimuat. Coba muat ulang halaman.");
      return;
    }

    let active = true;
    setModelLoading(true);

    const pose = new window.Pose({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults((results: any) => {
      if (!active) return;
      setModelLoading(false);
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw camera feed
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      
      if (results.poseLandmarks && productImage) {
        // Bahu kiri (11) dan kanan (12), hidung (0)
        const leftShoulder = results.poseLandmarks[11];
        const rightShoulder = results.poseLandmarks[12];
        const nose = results.poseLandmarks[0];
        
        if (leftShoulder && rightShoulder) {
          // Visibility check
          if (leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
            const x1 = leftShoulder.x * canvas.width;
            const y1 = leftShoulder.y * canvas.height;
            const x2 = rightShoulder.x * canvas.width;
            const y2 = rightShoulder.y * canvas.height;
            
            // Calculate width based on shoulder distance
            const shoulderWidth = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            let width, height, centerX, topY, angle;

            // Memperbaiki bug rotasi terbalik: 
            // Karena x1 (kiri) ada di kanan layar kamera, dan x2 (kanan) ada di kiri, x1 > x2.
            // Angle yang benar adalah (y1 - y2) terhadap (x1 - x2).
            angle = Math.atan2(y1 - y2, x1 - x2);

            if (tryOnMode === 'clothes') {
              width = shoulderWidth * 2.2; // Offset multiplier untuk gamis/baju
              height = productImage.height * (width / productImage.width);
              centerX = (x1 + x2) / 2;
              // Penempatan Y sedikit di atas bahu
              topY = ((y1 + y2) / 2) - (height * 0.15); 
            } else {
              // Mode Hijab / Kerudung
              width = shoulderWidth * 1.5; // Hijab biasanya lebarnya mendekati lebar bahu
              height = productImage.height * (width / productImage.width);
              
              if (nose) {
                // Pusatkan pada hidung secara horizontal
                centerX = nose.x * canvas.width;
                // Posisikan secara vertikal membungkus wajah
                topY = (nose.y * canvas.height) - (height * 0.4);
              } else {
                // Fallback jika hidung tidak terdeteksi
                centerX = (x1 + x2) / 2;
                topY = ((y1 + y2) / 2) - (height * 0.6);
              }
            }

            ctx.translate(centerX, topY + height/2);
            ctx.rotate(angle);
            ctx.drawImage(productImage, -width/2, -height/2, width, height);
            ctx.rotate(-angle);
            ctx.translate(-centerX, -(topY + height/2));
          }
        }
      }
      ctx.restore();
    });

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current && active) {
          await pose.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });
    
    camera.start();

    return () => {
      active = false;
      camera.stop();
      pose.close();
    };
  }, [cameraReady, productImage]);

  const handleCapture = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `sovia-tryon-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Virtual Try-On</h1>
        <p className="text-gray-500">Coba koleksi pakaian kami langsung dari kamera Anda</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600 flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10" />
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          
          {/* Kamera dan Canvas Container */}
          <div className="md:col-span-2 relative bg-gray-50 rounded-xl overflow-hidden shadow-inner flex items-center justify-center min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 z-10 backdrop-blur-sm">
                <RefreshCw className="w-8 h-8 animate-spin text-pink-500 mb-2" />
                <p className="text-gray-600 font-medium">Mengakses Kamera...</p>
              </div>
            )}
            
            {cameraReady && modelLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/40 z-10 backdrop-blur-sm">
                <RefreshCw className="w-8 h-8 animate-spin text-white mb-2" />
                <p className="text-white font-medium drop-shadow-md">Memuat Model AI...</p>
              </div>
            )}

            <video ref={videoRef} className="hidden" playsInline muted />
            
            <canvas 
              ref={canvasRef} 
              width="640" 
              height="480" 
              className={`w-full h-auto object-cover rounded-xl scale-x-[-1] ${!cameraReady ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
            />

            {/* Empty State / Select Product Helper */}
            {cameraReady && !selectedProduct && !modelLoading && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-md">
                  Pilih pakaian di samping untuk mencoba
                </div>
              </div>
            )}
          </div>

          {/* Kontrol dan Pilihan Pakaian */}
          <div className="space-y-6 flex flex-col justify-between">
            <div>
              {/* Toggle Mode */}
              <div className="mb-6 bg-stone-100 p-1 rounded-xl flex shadow-inner border border-stone-200">
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tryOnMode === 'clothes' ? 'bg-white shadow text-pink-600' : 'text-stone-500 hover:text-stone-700'}`}
                  onClick={() => setTryOnMode('clothes')}
                >
                  Pakaian
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tryOnMode === 'hijab' ? 'bg-white shadow text-pink-600' : 'text-stone-500 hover:text-stone-700'}`}
                  onClick={() => setTryOnMode('hijab')}
                >
                  Hijab
                </button>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Produk</label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => String(p.id) === String(e.target.value));
                    setSelectedProduct(product || null);
                  }}
                >
                  <option value="">-- Pilih Pakaian --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              {selectedProduct && (
                <div className="mt-4 p-4 bg-pink-50/50 rounded-xl border border-pink-100">
                  <p className="text-sm text-gray-500 mb-2">Preview Pakaian:</p>
                  <div className="aspect-square w-full relative bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={selectedProduct.tryOnImage} 
                      alt={selectedProduct.name}
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCapture}
              disabled={!cameraReady || !selectedProduct}
              className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm transition-all duration-200
                ${(!cameraReady || !selectedProduct) 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-pink-600 hover:bg-pink-700 text-white hover:shadow-md hover:-translate-y-0.5'}`}
            >
              <CameraIcon className="w-5 h-5" />
              <span>Ambil Foto</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
