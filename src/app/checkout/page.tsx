"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Script from "next/script"
import { Check, Truck, Package, MapPin, Loader2, AlertCircle, ChevronDown, ChevronUp, Upload, Image as ImageIcon, CheckCircle } from "lucide-react"
import { formatPrice, resolvePrice } from "@/lib/utils"
import { toast } from "sonner"

function getProductImages(images: string | null): string[] {
  if (!images) return []
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : [images]
  } catch {
    return [images]
  }
}

interface DirectOrder {
  productId: string
  productName: string
  productPrice: number
  productImage: string | null
  quantity: number
  size: string | null
  color: string | null
}

interface CartItem {
  id: string
  quantity: number
  size: string | null
  color: string | null
  product: {
    id: string
    name: string
    price: number
    images: string | null
    colors: string | null
    variants: {
      id: string
      name: string
      image: string | null
      sizes?: string | null
      price?: number | null
    }[]
  }
}

interface UserData {
  name: string
  phone: string
  address: string
  detailAddress: string
  lat: number
  lng: number
}

interface ShippingRate {
  courierName: string
  courierCode: string
  serviceName: string
  serviceCode: string
  description: string
  duration: string
  price: number
  shipmentDurationRange: string
  shipmentDurationUnit: string
  type: string
}

interface SelectedCourier {
  courierName: string
  courierCode: string
  serviceName: string
  serviceCode: string
  price: number
  duration: string
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [directOrder, setDirectOrder] = useState<DirectOrder | null>(null)
  const [userData, setUserData] = useState<UserData>({
    name: session?.user?.name || "",
    phone: "",
    address: "",
    detailAddress: "",
    lat: 0,
    lng: 0,
  })
  const [shippingMethod, setShippingMethod] = useState<"EXPEDITION" | "COD">("EXPEDITION")
  const [submitting, setSubmitting] = useState(false)
  const [storeProfile, setStoreProfile] = useState<{bankAccount: string | null, bankImage: string | null, eWallet: string | null, eWalletImage: string | null} | null>(null)
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  // Shipping rates state
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [codRates, setCodRates] = useState<ShippingRate[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [ratesError, setRatesError] = useState<string | null>(null)
  const [selectedCourier, setSelectedCourier] = useState<SelectedCourier | null>(null)
  const [showAllCouriers, setShowAllCouriers] = useState(false)

  const fetchData = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId) {
      if (status === "unauthenticated") {
        router.push("/auth/signin")
      }
      setLoading(false)
      return
    }
    try {
      setLoading(true)

      const storedDirectOrder = sessionStorage.getItem("directOrder")
      let directOrderData: DirectOrder | null = null

      if (storedDirectOrder) {
        directOrderData = JSON.parse(storedDirectOrder)
        sessionStorage.removeItem("directOrder")
        setDirectOrder(directOrderData)
      }

      const userRes = await fetch(`/api/users/${userId}`)
      const storeRes = await fetch(`/api/admin/store-profile`)

      if (!userRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const userDataResult = await userRes.json()
      
      if (storeRes.ok) {
        const storeData = await storeRes.json()
        setStoreProfile({
          bankAccount: storeData.bankAccount,
          bankImage: storeData.bankImage,
          eWallet: storeData.eWallet,
          eWalletImage: storeData.eWalletImage,
        })
      }

      setUserData({
        name: userDataResult.name || session?.user?.name || "",
        phone: userDataResult.phone || "",
        address: userDataResult.address || "",
        detailAddress: userDataResult.detailAddress || "",
        lat: userDataResult.lat || 0,
        lng: userDataResult.lng || 0,
      })

      if (directOrderData) {
        setItems([{
          id: "direct",
          quantity: directOrderData.quantity,
          size: directOrderData.size,
          color: directOrderData.color,
          product: {
            id: directOrderData.productId,
            name: directOrderData.productName,
            price: directOrderData.productPrice,
            images: directOrderData.productImage,
            colors: directOrderData.color,
            variants: [],
          }
        }])
      } else {
        const cartRes = await fetch("/api/cart")
        if (!cartRes.ok) {
          throw new Error("Failed to fetch data")
        }
        const cartData = await cartRes.json()
        setItems(cartData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load checkout data")
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch shipping rates when user data and items are available
  const fetchShippingRates = useCallback(async () => {
    if (!userData.lat || !userData.lng || items.length === 0) return

    setLoadingRates(true)
    setRatesError(null)

    try {
      const itemsPayload = items.map((item) => {
        const variant = item.product.variants?.find((v) => v.name === item.color)
        const finalPrice = resolvePrice(item.product.price, variant, item.size)
        return {
          name: item.product.name,
          price: finalPrice,
          quantity: item.quantity,
          weight: 300,
        }
      })

      // Fetch regular rates
      const [regularRes, codRes] = await Promise.all([
        fetch("/api/shipping/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinationLat: userData.lat,
            destinationLng: userData.lng,
            items: itemsPayload,
            isCod: false,
          }),
        }),
        fetch("/api/shipping/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinationLat: userData.lat,
            destinationLng: userData.lng,
            items: itemsPayload,
            isCod: true,
          }),
        }),
      ])

      if (!regularRes.ok || !codRes.ok) {
        throw new Error("Gagal mengambil tarif pengiriman (API tidak merespon JSON)");
      }

      const regularData = await regularRes.json()
      const codData = await codRes.json()

      if (regularData.success) {
        setShippingRates(regularData.rates || [])
        setSelectedCourier(null)
      } else {
        setRatesError(regularData.error || "Gagal mengambil tarif pengiriman")
      }

      if (codData.success) {
        setCodRates(codData.rates || [])
      }
    } catch (error) {
      console.error("Error fetching shipping rates:", error)
      setRatesError("Terjadi kesalahan saat mengambil tarif pengiriman")
    } finally {
      setLoadingRates(false)
    }
  }, [userData.lat, userData.lng, items])

  useEffect(() => {
    if (userData.lat && userData.lng && items.length > 0) {
      fetchShippingRates()
    }
  }, [fetchShippingRates])

  // When switching shipping method, reset courier selection
  useEffect(() => {
    setSelectedCourier(null)
  }, [shippingMethod])

  function handleSelectCourier(rate: ShippingRate) {
    setSelectedCourier({
      courierName: rate.courierName,
      courierCode: rate.courierCode,
      serviceName: rate.serviceName,
      serviceCode: rate.serviceCode,
      price: rate.price,
      duration: rate.duration,
    })
  }

  const handleCreateOrder = async () => {
    if (!userData.name || !userData.phone || !userData.address) {
      toast.error("Lengkapi data profil pengiriman terlebih dahulu")
      router.push("/profile")
      return
    }

    if (!userData.lat || !userData.lng) {
      toast.error("Lokasi pengiriman belum ditentukan. Silakan atur di profil Anda.")
      router.push("/profile")
      return
    }

    if (items.length === 0) {
      toast.error("Keranjang belanja kosong")
      return
    }
    if (!selectedCourier) {
      toast.error("Pilih kurir pengiriman terlebih dahulu")
      return
    }

    if (!session?.user || !selectedCourier) return
    setSubmitting(true)

    try {
      const orderData = {
        items: items.map((item) => {
          const variant = item.product.variants?.find((v) => v.name === item.color)
          const finalPrice = resolvePrice(item.product.price, variant, item.size)
          return {
            productId: item.product.id,
            quantity: item.quantity,
            price: finalPrice,
            size: item.size,
            color: item.color,
          }
        }),
        subtotal,
        shippingCost: selectedCourier.price,
        shippingMethod,
        paymentMethod: shippingMethod === "COD" ? "COD" : "MANUAL_TRANSFER",
        recipientName: userData.name,
        phone: userData.phone,
        address: userData.address,
        detailAddress: userData.detailAddress,
        lat: userData.lat,
        lng: userData.lng,
        courierName: selectedCourier.courierName,
        courierCode: selectedCourier.courierCode,
        courierService: `${selectedCourier.serviceName} (${selectedCourier.serviceCode})`,
        isDirect: !!directOrder,
        paymentProofUrl: null as string | null,
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (res.ok) {
        const order = await res.json()
        
        if (shippingMethod === "COD") {
          toast.success("Pesanan berhasil dibuat!")
          router.push(`/profile?tab=orders&order=${order.id}`)
        } else {
          setCreatedOrderId(order.id)
          toast.success("Pesanan dibuat. Silakan lakukan pembayaran.")
          
          // Scroll to payment section
          setTimeout(() => {
            const paymentElement = document.getElementById("payment-section")
            if (paymentElement) {
              paymentElement.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          }, 100)
        }
      } else {
        toast.error("Gagal membuat pesanan")
      }
    } catch (error) {
      console.error("Error placing order:", error)
      toast.error("Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!createdOrderId) return
    
    if (!paymentProofFile) {
      toast.error("Silakan unggah bukti pembayaran terlebih dahulu")
      return
    }

    setSubmitting(true)
    const toastId = toast.loading("Mengunggah bukti pembayaran...")

    try {
      const formData = new FormData()
      formData.append("file", paymentProofFile)
      
      const uploadRes = await fetch("/api/upload/payment-proof", {
        method: "POST",
        body: formData,
      })
      
      if (!uploadRes.ok) {
        toast.error("Gagal mengunggah bukti pembayaran", { id: toastId })
        setSubmitting(false)
        return
      }

      const uploadData = await uploadRes.json()
      
      const updateRes = await fetch(`/api/orders/${createdOrderId}/payment-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentProofUrl: uploadData.url }),
      })

      if (updateRes.ok) {
        toast.success("Pembayaran berhasil dikonfirmasi!", { id: toastId })
        router.push(`/profile?tab=orders&order=${createdOrderId}`)
      } else {
        toast.error("Gagal mengonfirmasi pembayaran", { id: toastId })
      }
    } catch (error) {
      console.error("Error confirming payment:", error)
      toast.error("Terjadi kesalahan saat mengonfirmasi pembayaran", { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  const subtotal = items.reduce(
    (sum, item) => {
      const variant = item.product.variants?.find((v) => v.name === item.color)
      const finalPrice = resolvePrice(item.product.price, variant, item.size)
      return sum + finalPrice * item.quantity
    },
    0
  )
  const shippingCost = selectedCourier?.price || 0
  const total = subtotal + shippingCost

  const currentRates = shippingMethod === "COD" ? codRates : shippingRates
  const displayedRates = showAllCouriers ? currentRates : currentRates.slice(0, 4)

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sovia-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (status === "unauthenticated" || !session) {
    router.push("/auth/signin")
    return null
  }

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <h1 className="text-sovia-900 text-4xl font-serif mb-8">Checkout</h1>

        <div className="flex gap-12 flex-col lg:flex-row">
          <div className="flex-1 space-y-8">
            {/* Delivery Details */}
            <div>
              <div className="flex justify-between items-center pb-2 border-b border-sovia-200 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-sovia-600 rounded-xl flex items-center justify-center">
                    <Check className="w-4 h-4 text-sovia-50" />
                  </div>
                  <h2 className="text-sovia-600 text-xl font-serif">Detail Pengiriman</h2>
                </div>
                {!createdOrderId && (
                  <button
                    onClick={() => router.push("/profile")}
                    className="text-sovia-600 text-sm font-medium hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="bg-[#F3EFE6] rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sovia-700 text-sm">Nama Lengkap</p>
                  <p className="text-sovia-900 font-medium">{userData.name}</p>
                </div>
                <div>
                  <p className="text-sovia-700 text-sm">Nomor Telepon</p>
                  <p className="text-sovia-900 font-medium">{userData.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sovia-700 text-sm">Alamat</p>
                  <p className="text-sovia-900 font-medium">{userData.address || "-"}</p>
                  <p className="text-sovia-600 text-sm mt-1">{userData.detailAddress || ""}</p>
                </div>
                {userData.lat && userData.lng ? (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Lokasi pengiriman terdeteksi</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      Lokasi pengiriman belum ditentukan.{" "}
                      {!createdOrderId && (
                        <button
                          onClick={() => router.push("/profile")}
                          className="underline font-medium"
                        >
                          Atur sekarang
                        </button>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Method */}
            <div>
              <div className="flex justify-between items-center pb-2 border-b border-sovia-200 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl border border-sovia-500 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-sovia-500" />
                  </div>
                  <h2 className="text-sovia-900 text-xl font-serif">Metode Pengiriman</h2>
                </div>
              </div>

              {/* Method Toggle */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setShippingMethod("EXPEDITION")}
                  disabled={!!createdOrderId}
                  className={`p-4 rounded-lg outline outline-1 transition-all ${shippingMethod === "EXPEDITION"
                      ? "outline-sovia-600 bg-sovia-100 outline-2"
                      : "outline-sovia-300 bg-[#F3EFE6] hover:bg-sovia-50"
                    } ${createdOrderId ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Package className={`w-5 h-5 ${shippingMethod === "EXPEDITION" ? "text-sovia-700" : "text-sovia-400"}`} />
                    <div className="text-left">
                      <p className="text-sovia-900 font-medium text-sm">Ekspedisi</p>
                      <p className="text-sovia-500 text-xs">Transfer Bank / E-Wallet</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setShippingMethod("COD")}
                  disabled={!!createdOrderId}
                  className={`p-4 rounded-lg outline outline-1 transition-all ${shippingMethod === "COD"
                      ? "outline-sovia-600 bg-sovia-100 outline-2"
                      : "outline-sovia-300 bg-[#F3EFE6] hover:bg-sovia-50"
                    } ${createdOrderId ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className={`w-5 h-5 ${shippingMethod === "COD" ? "text-sovia-700" : "text-sovia-400"}`} />
                    <div className="text-left">
                      <p className="text-sovia-900 font-medium text-sm">COD</p>
                      <p className="text-sovia-500 text-xs">Bayar di tempat</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Courier Selection */}
              <div className="space-y-2">
                {loadingRates ? (
                  <div className="bg-[#F3EFE6] rounded-lg p-8 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-sovia-400 mb-3" />
                    <p className="text-sovia-500 text-sm">Mengambil tarif pengiriman...</p>
                    <p className="text-sovia-400 text-xs mt-1">Menghitung jarak dan ongkos kirim dari Biteship</p>
                  </div>
                ) : ratesError ? (
                  <div className="bg-red-50 rounded-lg p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-700 text-sm font-medium">{ratesError}</p>
                    <button
                      onClick={fetchShippingRates}
                      className="mt-3 text-red-600 text-sm underline hover:no-underline"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : currentRates.length === 0 && !loadingRates ? (
                  <div className="bg-sovia-50 rounded-lg p-6 text-center">
                    <Package className="w-8 h-8 text-sovia-400 mx-auto mb-2" />
                    <p className="text-sovia-600 text-sm">
                      {!userData.lat || !userData.lng
                        ? "Atur lokasi pengiriman di profil untuk melihat tarif"
                        : "Tidak ada kurir tersedia untuk lokasi ini"}
                    </p>
                  </div>
                ) : (
                  <>
                    {displayedRates.map((rate, index) => (
                      <button
                        key={`${rate.courierCode}-${rate.serviceCode}-${index}`}
                        onClick={() => handleSelectCourier(rate)}
                        disabled={!!createdOrderId}
                        className={`w-full p-4 rounded-lg outline outline-1 transition-all text-left ${selectedCourier?.courierCode === rate.courierCode &&
                            selectedCourier?.serviceCode === rate.serviceCode
                            ? "outline-sovia-700 bg-sovia-100 outline-2"
                            : "outline-sovia-200 bg-[#F3EFE6] hover:bg-sovia-50"
                          } ${createdOrderId ? "opacity-70 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sovia-900 font-semibold text-sm">
                                {rate.courierName}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-sovia-200 text-sovia-600 rounded-full">
                                {rate.serviceName}
                              </span>
                            </div>
                            <p className="text-sovia-500 text-xs mt-1">
                              {rate.description || `Estimasi ${rate.duration}`}
                            </p>
                            {rate.shipmentDurationRange && (
                              <p className="text-sovia-400 text-xs mt-0.5">
                                ⏱ {rate.shipmentDurationRange} {rate.shipmentDurationUnit}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sovia-900 font-semibold text-sm">
                              {formatPrice(rate.price)}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}

                    {currentRates.length > 4 && !createdOrderId && (
                      <button
                        onClick={() => setShowAllCouriers(!showAllCouriers)}
                        className="w-full py-3 text-sovia-600 text-sm font-medium flex items-center justify-center gap-1 hover:text-sovia-900 transition-colors"
                      >
                        {showAllCouriers ? (
                          <>
                            Tampilkan lebih sedikit <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Lihat {currentRates.length - 4} kurir lainnya <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Payment Method - Only shown after order is created */}
            {createdOrderId && (
              <div id="payment-section" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center pb-2 border-b border-sovia-200 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl border border-sovia-500 flex items-center justify-center bg-sovia-500 text-sovia-50">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <h2 className="text-sovia-900 text-xl font-serif">Pembayaran</h2>
                  </div>
                </div>
                <div className="bg-[#F3EFE6] rounded-lg p-8 text-center">
                {shippingMethod === "COD" ? (
                  <div>
                    <p className="text-sovia-700 text-base mb-4">
                      Pembayaran dilakukan saat barang diterima
                    </p>
                    <div className="inline-block px-6 py-3 bg-accent-100 rounded-lg">
                      <p className="text-sovia-600 text-sm">Cash on Delivery</p>
                    </div>
                    <p className="text-sovia-500 text-xs mt-4">
                      Total yang harus dibayar saat menerima:{" "}
                      <span className="font-semibold text-sovia-700">{formatPrice(total)}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sovia-700 text-base">
                      Silakan transfer ke salah satu rekening atau E-Wallet berikut:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="bg-sovia-50 border border-sovia-200 p-4 rounded-lg flex flex-col h-full">
                        <p className="text-sovia-500 text-xs font-medium mb-2 uppercase tracking-wider">Rekening Bank</p>
                        <p className="text-sovia-900 font-medium whitespace-pre-wrap flex-grow">{storeProfile?.bankAccount || "Belum diatur"}</p>
                        {storeProfile?.bankImage && (
                          <div className="mt-4 relative w-full h-32 bg-sovia-50 rounded border border-sovia-100 overflow-hidden">
                            <img src={storeProfile.bankImage} alt="Bank QR/Logo" className="absolute inset-0 w-full h-full object-contain p-2" />
                          </div>
                        )}
                      </div>
                      <div className="bg-sovia-50 border border-sovia-200 p-4 rounded-lg flex flex-col h-full">
                        <p className="text-sovia-500 text-xs font-medium mb-2 uppercase tracking-wider">E-Wallet</p>
                        <p className="text-sovia-900 font-medium whitespace-pre-wrap flex-grow">{storeProfile?.eWallet || "Belum diatur"}</p>
                        {storeProfile?.eWalletImage && (
                          <div className="mt-4 relative w-full h-32 bg-sovia-50 rounded border border-sovia-100 overflow-hidden">
                            <img src={storeProfile.eWalletImage} alt="E-Wallet QR/Logo" className="absolute inset-0 w-full h-full object-contain p-2" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-sovia-50 border border-sovia-200 p-6 rounded-lg text-left mt-4">
                      <p className="text-sm text-sovia-900 font-medium mb-3">Upload Bukti Transfer</p>
                      <p className="text-xs text-sovia-600 mb-4">Silakan unggah foto bukti transfer Anda di bawah ini agar pesanan dapat diproses.</p>
                      
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-sovia-300 border-dashed rounded-lg cursor-pointer bg-sovia-100 hover:bg-sovia-50 transition-colors relative overflow-hidden group">
                        {paymentProofFile ? (
                          <div className="flex flex-col items-center justify-center p-2 w-full h-full relative">
                            {/* Preview Image */}
                            <img 
                              src={URL.createObjectURL(paymentProofFile)} 
                              alt="Preview" 
                              className="absolute inset-0 w-full h-full object-contain opacity-40 group-hover:opacity-20 transition-opacity" 
                            />
                            <div className="relative z-10 flex flex-col items-center">
                              <div className="bg-sovia-900 text-sovia-50 p-2 rounded-full mb-2 shadow-md">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                              <p className="text-sm text-sovia-900 font-semibold truncate max-w-[200px] bg-sovia-200/80 px-2 py-0.5 rounded">{paymentProofFile.name}</p>
                              <p className="text-xs text-sovia-700 mt-2 font-medium bg-sovia-100 border border-sovia-200 px-3 py-1 rounded-full shadow-sm group-hover:bg-sovia-100 transition-colors">Klik untuk mengganti foto</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 text-sovia-400 mb-3 group-hover:-translate-y-1 transition-transform" />
                            <div className="bg-sovia-900 text-sovia-50 px-5 py-2 rounded-lg mb-3 text-sm font-medium hover:bg-sovia-800 transition-colors shadow-md">
                              Pilih Foto Bukti Transfer
                            </div>
                            <p className="text-xs text-sovia-500">PNG, JPG atau WEBP (Maks. 5MB)</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPaymentProofFile(e.target.files[0])
                            }
                          }}
                        />
                      </label>
                    </div>

                    <p className="text-sm mt-4">
                      Total pembayaran:{" "}
                      <span className="font-semibold">{formatPrice(total)}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-96">
            <div className="bg-sovia-100 rounded-lg p-8 lg:sticky lg:top-32">
              <h2 className="text-sovia-900 text-2xl font-serif mb-6">
                Ringkasan Pesanan
              </h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-24 bg-sovia-200 rounded flex-shrink-0 overflow-hidden">
                      <Image
                        src={
                          item.product.variants?.find(v => v.name === item.color)?.image ||
                          getProductImages(item.product.images)[0] ||
                          "https://placehold.co/80x96/F3EFE6/3C3228?text=Item"
                        }
                        alt={item.product.name}
                        width={80}
                        height={96}
                        className="object-cover w-auto h-auto"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sovia-900 text-lg font-serif">
                        {item.product.name}
                      </h3>
                      <p className="text-sovia-700 text-sm">
                        {item.color && `Varian: ${item.color}`}
                        {item.size && ` | Ukuran: ${item.size}`}
                      </p>
                      <div className="flex justify-between mt-2">
                        <span className="text-sovia-700 text-sm">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-sovia-900 font-medium">
                          {formatPrice(resolvePrice(item.product.price, item.product.variants?.find(v => v.name === item.color), item.size) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-sovia-500 text-center py-4">
                    Keranjang kosong
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-sovia-200">
                <div className="flex justify-between">
                  <span className="text-sovia-700 text-sm">Subtotal</span>
                  <span className="text-sovia-700 text-sm">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="text-sovia-700 text-sm">Ongkos Kirim</span>
                    {selectedCourier && (
                      <p className="text-sovia-400 text-xs">
                        {selectedCourier.courierName} — {selectedCourier.serviceName}
                      </p>
                    )}
                  </div>
                  <span className="text-sovia-700 text-sm">
                    {selectedCourier ? formatPrice(shippingCost) : "-"}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-sovia-200">
                  <span className="text-sovia-900 text-lg font-medium">Total</span>
                  <span className="text-sovia-900 text-lg font-medium">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {!createdOrderId ? (
                <button
                  onClick={handleCreateOrder}
                  disabled={submitting || items.length === 0 || !selectedCourier || loadingRates || !userData.address || !userData.phone || !userData.name}
                  className="w-full py-4 bg-gradient-to-r from-sovia-600 to-accent-300 text-white rounded-lg font-medium mt-6 disabled:opacity-60 transition-opacity"
                >
                  {submitting ? "Memproses..." : "Checkout"}
                </button>
              ) : (
                <button
                  onClick={handleConfirmPayment}
                  disabled={submitting || !paymentProofFile}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg font-medium mt-6 disabled:opacity-60 transition-opacity"
                >
                  {submitting ? "Memproses..." : "Konfirmasi Pembayaran"}
                </button>
              )}

              {!selectedCourier && !loadingRates && items.length > 0 && !createdOrderId && (
                <p className="text-amber-600 text-xs text-center mt-3">
                  Pilih kurir pengiriman untuk melanjutkan
                </p>
              )}
              {createdOrderId && !paymentProofFile && (
                <p className="text-amber-600 text-xs text-center mt-3 animate-pulse">
                  Menunggu Anda mengunggah bukti pembayaran
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}