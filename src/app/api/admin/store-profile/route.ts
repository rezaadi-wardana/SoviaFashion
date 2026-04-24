import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const STORE_PROFILE_ID = "store-profile"

// GET - fetch store profile (public for WhatsApp number access)
export async function GET() {
  try {
    let profile = await prisma.storeProfile.findUnique({
      where: { id: STORE_PROFILE_ID },
    })

    if (!profile) {
      profile = await prisma.storeProfile.create({
        data: { id: STORE_PROFILE_ID },
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching store profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch store profile" },
      { status: 500 }
    )
  }
}

// PUT - update store profile (admin only)
export async function PUT(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      ownerName,
      phone,
      whatsapp,
      email,
      address,
      lat,
      lng,
      instagram,
      facebook,
    } = body

    const profile = await prisma.storeProfile.upsert({
      where: { id: STORE_PROFILE_ID },
      update: {
        name,
        description,
        ownerName,
        phone,
        whatsapp,
        email,
        address,
        lat: lat || null,
        lng: lng || null,
        instagram,
        facebook,
      },
      create: {
        id: STORE_PROFILE_ID,
        name,
        description,
        ownerName,
        phone,
        whatsapp,
        email,
        address,
        lat: lat || null,
        lng: lng || null,
        instagram,
        facebook,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error updating store profile:", error)
    return NextResponse.json(
      { error: "Failed to update store profile" },
      { status: 500 }
    )
  }
}
