/**
 * Komponen Loading global untuk menampilkan indikator pemuatan halaman (Next.js Loading Boundary).
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sovia-50/80 dark:bg-sovia-950/80 backdrop-blur-sm transition-all duration-500">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Dots */}
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full bg-sovia-600 dark:bg-sovia-400 animate-bounce" 
            style={{ animationDelay: "0ms", animationDuration: "1s" }}
          />
          <div 
            className="w-4 h-4 rounded-full bg-sovia-500 dark:bg-sovia-300 animate-bounce" 
            style={{ animationDelay: "150ms", animationDuration: "1s" }}
          />
          <div 
            className="w-4 h-4 rounded-full bg-sovia-400 dark:bg-sovia-200 animate-bounce" 
            style={{ animationDelay: "300ms", animationDuration: "1s" }}
          />
        </div>
        
        {/* Loading Text */}
        <div className="text-sovia-800 dark:text-sovia-100 font-serif text-sm tracking-[0.2em] uppercase animate-pulse">
          Sovia Fashion
        </div>
      </div>
    </div>
  )
}
