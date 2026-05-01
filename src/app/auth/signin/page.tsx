"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Loader2 } from "lucide-react"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function SignInContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/catalog"
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl)
    }
  }, [status, router, callbackUrl])

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      await signIn("google", { callbackUrl })
    } catch {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sovia-50">
        <Loader2 className="w-8 h-8 animate-spin text-sovia-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sovia-100 via-sovia-50 to-accent-100 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#F3EFE6] rounded-2xl shadow-xl p-10 relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sovia-600 via-accent-300 to-sovia-400" />

          {/* Logo */}
          <div className="text-center mb-10">
            <h1 className="text-sovia-600 text-4xl font-serif tracking-[4px] mb-2">
              SOVIA
            </h1>
            <p className="text-sovia-400 text-xs tracking-[3px] uppercase">
              Fashion Collection
            </p>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-sovia-900 text-xl font-serif mb-2">
              Selamat Datang
            </h2>
            <p className="text-sovia-500 text-sm leading-relaxed">
              Masuk dengan akun Google Anda untuk mulai berbelanja koleksi fashion terbaik
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#F3EFE6] border-2 border-sovia-200 rounded-xl text-sovia-700 font-medium hover:bg-sovia-50 hover:border-sovia-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? "Menghubungkan..." : "Masuk dengan Google"}
          </button>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-sovia-100">
            <p className="text-sovia-400 text-xs text-center leading-relaxed">
              Dengan masuk, Anda menyetujui syarat dan ketentuan yang berlaku di SOVIA Fashion
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-sovia-500 text-sm hover:text-sovia-700 transition-colors"
          >
            ← Kembali ke halaman utama
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sovia-50">
          <Loader2 className="w-8 h-8 animate-spin text-sovia-400" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
