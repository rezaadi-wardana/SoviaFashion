"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Check, Edit, X, QrCode } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

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
  }
}

interface UserData {
  name: string
  phone: string
  address: string
  lat: number
  lng: number
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
    lat: 0,
    lng: 0,
  })
  const [shippingMethod, setShippingMethod] = useState<"EXPEDITION" | "COD">("EXPEDITION")
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId) {
      if (status === "unauthenticated") {
        router.push("/auth/signin")
      }
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

      if (!userRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const userDataResult = await userRes.json()

      setUserData({
        name: userDataResult.name || session?.user?.name || "",
        phone: userDataResult.phone || "",
        address: userDataResult.address || "",
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

  async function handleSubmit() {
    if (!userData.name || !userData.phone || !userData.address) {
      toast.error("Please complete your profile with delivery details")
      router.push("/profile")
      return
    }

    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    setSubmitting(true)

    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          size: item.size,
          color: item.color,
        })),
        subtotal: items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),
        shippingCost: shippingMethod === "EXPEDITION" ? 25000 : 35000,
        shippingMethod,
        paymentMethod: shippingMethod === "COD" ? "COD" : "QRIS",
        recipientName: userData.name,
        phone: userData.phone,
        address: userData.address,
        lat: userData.lat,
        lng: userData.lng,
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (res.ok) {
        const order = await res.json()
        toast.success("Order placed successfully!")
        router.push(`/orders?order=${order.id}`)
      } else {
        toast.error("Failed to place order")
      }
    } catch (error) {
      console.error("Error placing order:", error)
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const shippingCost = shippingMethod === "EXPEDITION" ? 25000 : 35000
  const total = subtotal + shippingCost

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-stone-600 border-t-transparent rounded-full" />
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
        <h1 className="text-stone-900 text-4xl font-serif mb-8">Checkout</h1>

        <div className="flex gap-12">
          <div className="flex-1 space-y-8">
            {/* Delivery Details */}
            <div>
              <div className="flex justify-between items-center pb-2 border-b border-stone-200 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-stone-600 rounded-xl flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-stone-600 text-xl font-serif">Delivery Details</h2>
                </div>
                <button
                  onClick={() => router.push("/profile")}
                  className="text-stone-600 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
              <div className="bg-white rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-stone-700 text-sm">Full Name</p>
                  <p className="text-stone-900 font-medium">{userData.name}</p>
                </div>
                <div>
                  <p className="text-stone-700 text-sm">Phone Number</p>
                  <p className="text-stone-900 font-medium">{userData.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-stone-700 text-sm">Address</p>
                  <p className="text-stone-900 font-medium">{userData.address || "-"}</p>
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div>
              <div className="flex justify-between items-center pb-2 border-b border-stone-200 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl border border-stone-500 flex items-center justify-center">
                    <div className="w-3 h-3 bg-stone-500" />
                  </div>
                  <h2 className="text-stone-900 text-xl font-serif">Shipping Method</h2>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => setShippingMethod("EXPEDITION")}
                  className={`w-full p-6 rounded-lg outline outline-1 ${
                    shippingMethod === "EXPEDITION"
                      ? "outline-stone-600 bg-stone-100"
                      : "outline-stone-300 bg-white"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-stone-900 font-medium">
                      Standard Expedition
                    </span>
                    <span className="text-stone-900 font-medium">
                      {formatPrice(25000)}
                    </span>
                  </div>
                  <p className="text-stone-700 text-sm mt-2">
                    Estimated delivery: 2-3 Days
                  </p>
                </button>
                <button
                  onClick={() => setShippingMethod("COD")}
                  className={`w-full p-6 rounded-lg outline outline-1 ${
                    shippingMethod === "COD"
                      ? "outline-stone-600 bg-stone-100"
                      : "outline-stone-300 bg-white"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-stone-900 font-medium">
                      Cash on Delivery
                    </span>
                    <span className="text-stone-900 font-medium">
                      {formatPrice(35000)}
                    </span>
                  </div>
                  <p className="text-stone-700 text-sm mt-2">
                    Pay when order arrives
                  </p>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <div className="flex justify-between items-center pb-2 border-b border-stone-200 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl border border-stone-500 flex items-center justify-center">
                    <div className="w-3 h-3 bg-stone-500" />
                  </div>
                  <h2 className="text-stone-900 text-xl font-serif">Payment</h2>
                </div>
              </div>
              <div className="bg-white rounded-lg p-8 text-center">
                {shippingMethod === "COD" ? (
                  <div>
                    <p className="text-stone-700 text-base mb-4">
                      Payment will be collected upon delivery
                    </p>
                    <div className="inline-block px-6 py-3 bg-rose-100 rounded-lg">
                      <p className="text-stone-600 text-sm">Cash on Delivery</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-stone-700 text-base mb-4">
                      Scan QRIS code to pay
                    </p>
                    <div className="w-48 h-48 bg-stone-200 rounded-lg mx-auto flex items-center justify-center mb-4">
                      <QrCode className="w-24 h-24 text-stone-400" />
                    </div>
                    <p className="text-sm">
                      Total to pay:{" "}
                      <span className="font-semibold">{formatPrice(total)}</span>
                    </p>
                    <p className="text-stone-700 text-xs mt-2">
                      Awaiting payment confirmation...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-96">
            <div className="bg-stone-100 rounded-lg p-8">
              <h2 className="text-stone-900 text-2xl font-serif mb-6">
                Order Summary
              </h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-24 bg-stone-200 rounded flex-shrink-0 overflow-hidden">
                      <Image
                        src={
                          item.product.images ||
                          "https://placehold.co/80x96/fafaf9/1c1917?text=Item"
                        }
                        alt={item.product.name}
                        width={80}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-stone-900 text-lg font-serif">
                        {item.product.name}
                      </h3>
                      <p className="text-stone-700 text-sm">
                        {item.color && `Color: ${item.color}`}
                        {item.size && ` | Size: ${item.size}`}
                      </p>
                      <div className="flex justify-between mt-2">
                        <span className="text-stone-700 text-sm">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-stone-900 font-medium">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-stone-500 text-center py-4">
                    No items in cart
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-700 text-sm">Subtotal</span>
                  <span className="text-stone-700 text-sm">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-700 text-sm">Shipping</span>
                  <span className="text-stone-700 text-sm">
                    {formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-stone-200">
                  <span className="text-stone-900 text-lg font-medium">Total</span>
                  <span className="text-stone-900 text-lg font-medium">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || items.length === 0}
                className="w-full py-4 bg-gradient-to-r from-stone-600 to-red-300 text-white rounded-lg font-medium mt-6 disabled:opacity-60"
              >
                {submitting ? "Processing..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}