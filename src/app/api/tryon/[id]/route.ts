/**
 * GET /api/tryon/[id]
 * Memeriksa status prediksi Virtual Try-On berdasarkan predictionId.
 * Pertama mengecek database (untuk hasil dari webhook), lalu fallback ke polling langsung Replicate API.
 * Mengembalikan status COMPLETED (dengan URL gambar hasil) / FAILED / processing.
 */
import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { prisma } from '@/lib/prisma';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // First check the database for cached/webhook-updated results
    const dbResult = await prisma.tryOnResult.findUnique({
      where: { predictionId: id },
    });

    // If we already have a completed or failed result in DB, return it immediately
    if (dbResult && (dbResult.status === 'COMPLETED' || dbResult.status === 'FAILED')) {
      return NextResponse.json({
        status: dbResult.status,
        resultImageUrl: dbResult.resultImageUrl,
      });
    }

    // Poll Replicate API directly for the latest status
    try {
      const prediction = await replicate.predictions.get(id);
      console.log(`📡 Replicate poll for ${id}: status=${prediction.status}`);

      if (prediction.status === 'succeeded') {
        // Extract the result image URL
        let outputImageUrl: string | null = null;
        if (typeof prediction.output === 'string') {
          outputImageUrl = prediction.output;
        } else if (Array.isArray(prediction.output) && prediction.output.length > 0 && typeof prediction.output[0] === 'string') {
          outputImageUrl = prediction.output[0];
        } else if (prediction.output && typeof prediction.output === 'object' && 'url' in (prediction.output as Record<string, unknown>)) {
          outputImageUrl = (prediction.output as Record<string, unknown>).url as string;
        }

        if (outputImageUrl) {
          console.log(`✅ Prediction ${id} succeeded! Output: ${outputImageUrl.substring(0, 100)}...`);

          // Update database with the result
          await prisma.tryOnResult.update({
            where: { predictionId: id },
            data: { resultImageUrl: outputImageUrl, status: 'COMPLETED' },
          });

          return NextResponse.json({
            status: 'COMPLETED',
            resultImageUrl: outputImageUrl,
          });
        } else {
          console.warn(`⚠️ Prediction ${id} succeeded but output format unexpected:`, JSON.stringify(prediction.output).substring(0, 200));
        }
      } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
        console.error(`❌ Prediction ${id} ${prediction.status}:`, prediction.error);

        // Update database with failed status
        await prisma.tryOnResult.update({
          where: { predictionId: id },
          data: { status: 'FAILED' },
        });

        return NextResponse.json({
          status: 'FAILED',
          error: prediction.error || `Prediction ${prediction.status}`,
        });
      }

      // Still processing
      return NextResponse.json({
        status: prediction.status || 'processing',
      });
    } catch (replicateError) {
      console.error(`❌ Error polling Replicate API for ${id}:`, replicateError);
      
      // Fallback to database result if Replicate API fails
      if (dbResult) {
        return NextResponse.json({
          status: dbResult.status,
          resultImageUrl: dbResult.resultImageUrl,
        });
      }
      
      return NextResponse.json({
        status: 'processing',
      });
    }
  } catch (error) {
    console.error('Error getting prediction status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}