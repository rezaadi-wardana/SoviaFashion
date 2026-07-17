/**
 * PUT /api/users/profile
 * Memperbarui data profil pengguna yang sedang login (nama, telepon, alamat, koordinat, pekerjaan, tanggal lahir, foto).
 */
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, phone, address, detailAddress, lat, lng, job, birthDate, image } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        address,
        detailAddress,
        lat: lat || null,
        lng: lng || null,
        job: job || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        detailAddress: true,
        lat: true,
        lng: true,
        job: true,
        birthDate: true,
        image: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
