"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Crosshair, Loader2 } from "lucide-react"

interface MapPickerProps {
  lat: number
  lng: number
  onLocationChange: (lat: number, lng: number) => void
  height?: string
}

export default function MapPicker({ lat, lng, onLocationChange, height = "h-80" }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Cleanup any existing map on this container (fixes HMR / Strict Mode re-init)
    const container = mapContainerRef.current as any
    if (container._leaflet_id) {
      container._leaflet_id = null
      container.innerHTML = ""
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }

    let map: any = null

    async function initMap() {
      const L = (await import("leaflet")).default
      await import("leaflet/dist/leaflet.css")

      // Fix default marker icon issue with webpack/next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      })

      const defaultLat = lat || -6.2088
      const defaultLng = lng || 106.8456

      map = L.map(mapContainerRef.current!, {
        center: [defaultLat, defaultLng],
        zoom: lat && lng ? 15 : 5,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
      }).addTo(map)

      marker.on("dragend", () => {
        const pos = marker.getLatLng()
        onLocationChange(pos.lat, pos.lng)
      })

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng)
        onLocationChange(e.latlng.lat, e.latlng.lng)
      })

      mapInstanceRef.current = map
      markerRef.current = marker
      setIsLoaded(true)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update marker when lat/lng props change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return
    if (!lat || !lng) return

    const currentPos = markerRef.current.getLatLng()
    if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
      markerRef.current.setLatLng([lat, lng])
      mapInstanceRef.current.setView([lat, lng], 15)
    }
  }, [lat, lng])

  function handleDetectLocation() {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude
        const newLng = position.coords.longitude
        onLocationChange(newLat, newLng)
        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng])
          mapInstanceRef.current.setView([newLat, newLng], 15)
        }
        setDetecting(false)
      },
      () => {
        setDetecting(false)
      }
    )
  }

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        className={`${height} w-full rounded-xl overflow-hidden border border-stone-200 z-0`}
      />

      {/* Detect GPS button */}
      <button
        type="button"
        onClick={handleDetectLocation}
        disabled={detecting}
        className="absolute top-3 right-3 z-[1000] bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2 border border-stone-200"
      >
        {detecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Crosshair className="w-4 h-4" />
        )}
        {detecting ? "Detecting..." : "Lokasi Saya"}
      </button>

      {/* Coordinate display */}
      {lat !== 0 && lng !== 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm shadow rounded-lg px-3 py-2 text-xs text-stone-600 flex items-center gap-2">
          <MapPin className="w-3 h-3" />
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </div>
      )}

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-stone-400 mx-auto mb-2" />
            <p className="text-stone-500 text-sm">Memuat peta...</p>
          </div>
        </div>
      )}
    </div>
  )
}
