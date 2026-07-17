/**
 * PUT /api/users/password
 * Mengubah password akun pengguna yang sedang login.
 * Memvalidasi password saat ini (jika ada) sebelum mengenkripsi dan menyimpan password baru dengan bcrypt.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Password saat ini harus diisi" }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change Password Error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
