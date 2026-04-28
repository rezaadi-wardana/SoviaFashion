import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // sesuaikan dengan lokasi Prisma client Anda

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Ambil data dari database berdasarkan predictionId
    const result = await prisma.tryOnResult.findUnique({
      where: { predictionId: id },
    });

    if (!result) {
      return NextResponse.json({ error: 'Prediksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      status: result.status,
      resultImageUrl: result.resultImageUrl,
    });
  } catch (error) {
    console.error('Error getting prediction status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}