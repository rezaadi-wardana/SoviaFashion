"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { User, MapPin, Save } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    phone: "",
    address: "",
    lat: 0,
    lng: 0,
    
  })
  
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const userId = session?.user?.id
    const userName = session?.user?.name
    if (!userId) return

    async function loadUserData() {
      try {
        const res = await fetch(`/api/users/${userId}`)
        if (res.ok) {
          const data = await res.json()
          setFormData({
            name: data.name || userName || "",
            phone: data.phone || "",
            address: data.address || "",
            lat: data.lat || 0,
            lng: data.lng || 0,
          })
        }
      } catch {
        console.error("Error loading user data")
      }
    }

    loadUserData()
  }, [session])

  async function handleGetLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }))
          toast.success("Location detected!")
        },
        () => {
          toast.error("Could not get location. Please enable GPS.")
        }
      )
    } else {
      toast.error("Geolocation is not supported by your browser.")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success("Profile updated successfully!")
        await update({ name: formData.name })
      } else {
        toast.error("Failed to update profile")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-stone-400" />
          <p className="text-stone-600 text-lg">Please sign in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="mb-16">
          <h1 className="text-stone-600 text-6xl font-serif">Your Profile</h1>
          <p className="text-stone-700 text-lg mt-4 max-w-[672px]">
            Manage your personal details and delivery logistics to ensure a seamless
            editorial experience with SOVIA.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Details */}
          <div className="bg-white rounded-lg p-12">
            <h2 className="text-stone-600 text-3xl font-serif mb-8">
              Personal Dossier
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-stone-700 text-sm block mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900"
                />
              </div>
              <div>
                <label className="text-stone-700 text-sm block mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={session.user?.email || ""}
                  disabled
                  className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900 opacity-60"
                />
              </div>
              <div>
                <label className="text-stone-700 text-sm block mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+62 812 3456 7890"
                  className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-stone-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save Details"}
              </button>
            </form>
          </div>

          {/* Delivery Coordinates */}
          <div className="bg-white rounded-lg p-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-stone-600 text-3xl font-serif">
                Delivery Coordinates
              </h2>
              <button
                onClick={handleGetLocation}
                className="p-2 hover:bg-stone-100 rounded-lg"
                title="Get Current Location"
              >
                <MapPin className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-stone-700 text-sm block mb-2">
                  Full Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Jl. Sudirman Kav. 21, Jakarta"
                  rows={3}
                  className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-stone-700 text-sm block mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lat: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900"
                    placeholder="-6.2088"
                  />
                </div>
                <div>
                  <label className="text-stone-700 text-sm block mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lng: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900"
                    placeholder="106.8456"
                  />
                </div>
              </div>
            </div>

            {/* Map Preview */}
            <div
              ref={mapRef}
              className="h-96 bg-stone-200 rounded flex items-center justify-center relative overflow-hidden"
            >
              {formData.lat && formData.lng ? (
                <div className="absolute inset-0 bg-gradient-to-l from-white/50 to-white/0">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-12 h-12 bg-stone-600/20 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-stone-600" />
                    </div>
                  </div>
                  <p className="absolute bottom-4 left-4 text-stone-600 text-sm">
                    {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div className="text-center text-stone-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Click location button to set GPS</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}