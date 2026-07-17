/**
 * POST /api/orders/[id]/payment-proof
 * Mengunggah dan menyimpan URL bukti pembayaran manual transfer untuk pesanan tertentu.
 * Hanya pemilik pesanan yang dapat melakukan ini, dan pesanan harus berstatus PENDING_PAYMENT.
 * Setelah berhasil, status pesanan berubah menjadi WAITING_CONFIRMATION.
 */
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { paymentProofUrl } = await request.json()
    const { id } = await params

    if (!paymentProofUrl) {
      return NextResponse.json(
        { error: "Payment proof URL is required" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Order is not in PENDING_PAYMENT status" },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentProofUrl,
        status: "WAITING_CONFIRMATION",
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating payment proof:", error)
    return NextResponse.json(
      { error: "Failed to update payment proof" },
      { status: 500 }
    )
  }
}
