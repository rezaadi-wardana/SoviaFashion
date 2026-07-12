"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react"
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
    variants: {
      id: string
      name: string
      stock: number
      sizes: string | null
      image: string | null
      price?: number | null
    }[]
  }
}

function getMaxStock(item: CartItem): number {
  if (!item.product.variants || item.product.variants.length === 0) return 99
  const variant = item.product.variants.find(v => v.name === item.color)
  if (!variant) return 99

  if (item.size && variant.sizes) {
    const sizeObj = variant.sizes.split(",").find(s => s.split(":")[0].trim().toUpperCase() === item.size?.toUpperCase())
    if (sizeObj) {
      return parseInt(sizeObj.split(":")[1] || "0")
    }
    return 0
  }
  return variant.stock
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
    const itemIndex = items.findIndex((i) => i.id === itemId)
    if (itemIndex === -1) return
    const item = items[itemIndex]

    const newQty = item.quantity + delta
    if (newQty < 1) {
      await removeItem(itemId)
      return
    }

    const maxStock = getMaxStock(item)
    if (newQty > maxStock) {
      toast.error(`Stok maksimal untuk item ini adalah ${maxStock}`)
      return
    }

    // Optimistic update
    const previousItems = [...items]
    const updatedItems = [...items]
    updatedItems[itemIndex] = { ...item, quantity: newQty }
    setItems(updatedItems)

    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.product.id, quantity: newQty }),
      })

      if (res.ok) {
        window.dispatchEvent(new Event("cartUpdated"))
      } else {
        setItems(previousItems)
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
      setItems(previousItems)
    }
  }

  async function removeItem(itemId: string) {
    const previousItems = [...items]
    setItems(items.filter((i) => i.id !== itemId))

    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        window.dispatchEvent(new Event("cartUpdated"))
        toast.success("Item removed from cart")
      } else {
        setItems(previousItems)
      }
    } catch (error) {
      console.error("Error removing item:", error)
      setItems(previousItems)
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
  const shipping = items.length > 0 ? 25000 : 0
  const total = subtotal + shipping

  if (status === "loading") {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sovia-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-sovia-400" />
          <p className="text-sovia-600 text-lg mb-4">
            Please sign in to view your cart
          </p>
          <Link
            href="/auth/signin"
            className="px-6 py-3 bg-sovia-600 text-sovia-50 rounded-lg"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        <h1 className="text-sovia-50 dark:text-sovia-900 text-3xl sm:text-4xl font-serif mb-8">Keranjang Belanja</h1>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-sovia-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-sovia-400" />
            <p className="text-sovia-600 text-lg mb-4">Your cart is empty</p>
            <Link
              href="/catalog"
              className="px-6 py-3 bg-sovia-200 text-sovia-900 hover:bg-sovia-100 rounded-lg inline-block"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Cart Items */}
            <div className="flex-1 space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 bg-sovia-100 order-1 border border-sovia-100 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-24 bg-sovia-100 rounded flex-shrink-0 overflow-hidden">
                      <Image
                        src={
                          item.product.variants.find(v => v.name === item.color)?.image ||
                          getProductImages(item.product.images)[0] ||
                          "https://placehold.co/80x96/F3EFE6/3C3228?text=Item"
                        }
                        alt={item.product.name}
                        width={80}
                        height={96}
                        className="object-cover w-auto h-auto"
                      />
                    </div>
                    <div className="flex-1 sm:hidden">
                      <h3 className="text-sovia-900 font-serif">
                        {item.product.name}
                      </h3>
                      <p className="text-sovia-900 font-medium text-sm">
                        {formatPrice(resolvePrice(item.product.price, item.product.variants?.find((v) => v.name === item.color), item.size))}
                      </p>
                      <p className="text-sm">
                        {item.color && `Variant: ${item.color}`}
                        {item.size && ` | Size: ${item.size}`}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block flex-1">
                    <h3 className="text-lg font-serif">
                      {item.product.name}
                    </h3>
                    <p className="text-sm">
                      {item.color && `Variant: ${item.color}`}
                      {item.size && ` | Size: ${item.size}`}
                    </p>
                    <p className="text-base font-medium mt-2">
                      {formatPrice(resolvePrice(item.product.price, item.product.variants?.find((v) => v.name === item.color), item.size))}
                    </p>
                  </div>
                  <div className="text-right ml-4 mt-2 sm:mt-0 flex flex-row sm:flex-col items-center justify-between sm:items-end w-full sm:w-auto">
                    <p className="text-sovia-900 font-serif sm:mb-4">
                      {formatPrice(resolvePrice(item.product.price, item.product.variants?.find((v) => v.name === item.color), item.size) * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-sovia-200 rounded-md"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.quantity >= getMaxStock(item)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-sovia-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-sovia-500 hover:bg-sovia-200 rounded-md"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Order Summary */}
            <div className="w-full lg:w-96">
              <div className="border border-sovia-200 bg-sovia-100 rounded-xl p-6 lg:p-8 shadow-sm">
                <h2 className="text-2xl font-serif mb-6">
                  Ringkasan Pesanan
                </h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal</span>
                    <span className="text-sm">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Shipping</span>
                    <span className="text-sm">
                      {formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-sovia-200">
                    <span className="text-lg font-medium">Total</span>
                    <span className="text-lg font-medium">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
                {/* Button proceed to checkout */}
                <Link
                  href="/checkout"
                  className="flex items-center justify-center w-full py-4 bg-gradient-to-r from-sovia-600 to-accent-300 text-sovia-50 text-center rounded-lg font-medium"
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