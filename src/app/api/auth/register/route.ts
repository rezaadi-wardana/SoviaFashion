/**
 * POST /api/auth/register
 * Mendaftarkan akun pengguna baru ke dalam database.
 * Memvalidasi kelengkapan data (nama, email, password), memeriksa duplikasi email,
 * mengenkripsi password dengan bcrypt, lalu menyimpan user baru.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Endpoint POST /api/auth/register.
 * Mendaftarkan akun pengguna baru ke dalam database.
 * Memvalidasi kelengkapan data (nama, email, password), memeriksa duplikasi email,
 * mengenkripsi password dengan bcrypt, lalu menyimpan user baru.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Nama, Email, dan Password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat mendaftar" },
      { status: 500 }
    );
  }
}
