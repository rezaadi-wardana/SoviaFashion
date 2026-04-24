"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react"
import { formatPrice } from "@/lib/utils"
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
  }
}

export default function CartPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchCartItems()
    }
  }, [session])

  async function fetchCartItems() {
    try {
      const res = await fetch("/api/cart")
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateQuantity(itemId: string, delta: number) {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const newQty = item.quantity + delta
    if (newQty < 1) {
      await removeItem(itemId)
      return
    }

    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.product.id, quantity: newQty }),
      })

      if (res.ok) {
        fetchCartItems()
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  async function removeItem(itemId: string) {
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchCartItems()
        toast.success("Item removed from cart")
      }
    } catch (error) {
      console.error("Error removing item:", error)
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const shipping = items.length > 0 ? 25000 : 0
  const total = subtotal + shipping

  if (status === "loading") {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-stone-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-stone-400" />
          <p className="text-stone-600 text-lg mb-4">
            Please sign in to view your cart
          </p>
          <Link
            href="/auth/signin"
            className="px-6 py-3 bg-stone-600 text-white rounded-lg"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <h1 className="text-stone-900 text-4xl font-serif mb-8">Shopping Cart</h1>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-stone-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-stone-400" />
            <p className="text-stone-600 text-lg mb-4">Your cart is empty</p>
            <Link
              href="/catalog"
              className="px-6 py-3 bg-stone-600 text-white rounded-lg inline-block"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex gap-12">
            {/* Cart Items */}
            <div className="flex-1 space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-white rounded-lg p-4"
                >
                  <div className="w-20 h-24 bg-stone-200 rounded flex-shrink-0 overflow-hidden">
                    <Image
                      src={
                        getProductImages(item.product.images)[0] ||
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
                    <p className="text-stone-900 text-base font-medium mt-2">
                      {formatPrice(item.product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center bg-stone-200 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center bg-stone-200 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-stone-500 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="w-96">
              <div className="bg-stone-100 rounded-lg p-8">
                <h2 className="text-stone-900 text-2xl font-serif mb-6">
                  Order Summary
                </h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-stone-700 text-sm">Subtotal</span>
                    <span className="text-stone-700 text-sm">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-700 text-sm">Shipping</span>
                    <span className="text-stone-700 text-sm">
                      {formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-stone-200">
                    <span className="text-stone-900 text-lg font-medium">Total</span>
                    <span className="text-stone-900 text-lg font-medium">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="block w-full py-4 bg-gradient-to-r from-stone-600 to-red-300 text-white text-center rounded-lg font-medium"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}