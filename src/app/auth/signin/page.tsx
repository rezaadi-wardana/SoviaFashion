"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Loader2, Mail, Lock, User as UserIcon, Phone } from "lucide-react"

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
  const [isLogin, setIsLogin] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  })

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")
    setFormLoading(true)

    try {
      if (isLogin) {
        // Login Flow
        const res = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
          callbackUrl
        })

        if (res?.error) {
          setErrorMsg("Email atau password salah")
          setFormLoading(false)
        } else {
          router.push(callbackUrl)
        }
      } else {
        // Register Flow
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        })

        const data = await res.json()

        if (!res.ok) {
          setErrorMsg(data.error || "Terjadi kesalahan saat mendaftar")
          setFormLoading(false)
        } else {
          // Auto login after register
          const loginRes = await signIn("credentials", {
            redirect: false,
            email: formData.email,
            password: formData.password,
            callbackUrl
          })
          
          if (loginRes?.error) {
            setIsLogin(true)
            setErrorMsg("Pendaftaran berhasil, silakan login")
            setFormLoading(false)
          } else {
            router.push(callbackUrl)
          }
        }
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan jaringan")
      setFormLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sovia-50">
        <Loader2 className="w-8 h-8 animate-spin text-sovia-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sovia-100 via-sovia-50 to-accent-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#F3EFE6] rounded-2xl shadow-xl p-8 sm:p-10 relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sovia-600 via-accent-300 to-sovia-400" />

          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-sovia-600 text-4xl font-serif tracking-[4px] mb-2">
              Sovia
            </h1>
            <p className="text-sovia-400 text-xs tracking-[3px] uppercase">
              Fashion Collection
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-sovia-200/50 rounded-xl p-1 mb-8">
            <button
              onClick={() => { setIsLogin(true); setErrorMsg(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${isLogin ? "bg-sovia-100 text-sovia-900 shadow-sm" : "text-sovia-500 hover:text-sovia-700"}`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsLogin(false); setErrorMsg(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${!isLogin ? "bg-sovia-100 text-sovia-900 shadow-sm" : "text-sovia-500 hover:text-sovia-700"}`}
            >
              Daftar
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sovia-700 text-xs font-medium mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-sovia-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-sovia-100 border border-sovia-200 rounded-xl text-sm focus:outline-none focus:border-sovia-500 focus:ring-1 focus:ring-sovia-500 transition-colors"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sovia-700 text-xs font-medium mb-1.5">Nomor HP</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-sovia-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-sovia-100 border border-sovia-200 rounded-xl text-sm focus:outline-none focus:border-sovia-500 focus:ring-1 focus:ring-sovia-500 transition-colors"
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sovia-700 text-xs font-medium mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-sovia-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-sovia-100 border border-sovia-200 rounded-xl text-sm focus:outline-none focus:border-sovia-500 focus:ring-1 focus:ring-sovia-500 transition-colors"
                  placeholder="Masukkan email Anda"
                />
              </div>
            </div>

            <div>
              <label className="block text-sovia-700 text-xs font-medium mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-sovia-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-sovia-100 border border-sovia-200 rounded-xl text-sm focus:outline-none focus:border-sovia-500 focus:ring-1 focus:ring-sovia-500 transition-colors"
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full flex items-center justify-center py-3 bg-sovia-600 text-sovia-100 font-semibold rounded-xl hover:bg-sovia-700 transition-all duration-200 shadow-sm mt-6 disabled:opacity-70"
            >
              {formLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? "Masuk" : "Daftar Akun"
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sovia-200"></div>
            </div>
            <div className="relative bg-[#F3EFE6] px-4 text-xs text-sovia-500 font-medium">
              ATAU
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || formLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-sovia-100 border border-sovia-200 rounded-xl text-sovia-700 font-medium hover:bg-sovia-50 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Lanjutkan dengan Google
          </button>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-sovia-200">
            <p className="text-sovia-400 text-xs text-center leading-relaxed">
              Dengan {isLogin ? 'masuk' : 'mendaftar'}, Anda menyetujui syarat dan ketentuan yang berlaku di Sovia Fashion
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
