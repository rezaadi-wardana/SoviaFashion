import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// Fungsi untuk validasi keaslian webhook
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = headers();
    const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET;

    // (Opsional) Validasi signature untuk keamanan
    // if (webhookSecret) {
    //   const signature = headersList.get('replicate-signature') || '';
    //   if (!verifyWebhookSignature(body, signature, webhookSecret)) {
    //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    //   }
    // }

    const data = JSON.parse(body);

    // 1. Cek status prediksi
    if (data.status === 'succeeded') {
      // 2. Ekstrak URL gambar hasil virtual try-on
      //    Hasil bisa berupa single URL (string) atau array of URLs.
      let outputImageUrl: string | null = null;
      if (typeof data.output === 'string') {
        outputImageUrl = data.output;
      } else if (Array.isArray(data.output) && data.output.length > 0 && typeof data.output[0] === 'string') {
        outputImageUrl = data.output[0];
      } else if (data.output && typeof data.output === 'object' && 'url' in data.output) {
        outputImageUrl = data.output.url;
      }

      if (outputImageUrl) {
        // 3. SIMPAN HASILNYA KE DATABASE ANDA!
        await prisma.tryOnResult.update({
          where: { predictionId: data.id },
          data: { resultImageUrl: outputImageUrl, status: 'COMPLETED' }
        });
        console.log(`✅ Prediction ${data.id} completed! Result: ${outputImageUrl}`);
      } else {
        console.warn(`⚠️ Prediction ${data.id} completed but output format unexpected:`, data.output);
      }
    } else if (data.status === 'failed') {
      // 4. Catat error jika prediksi gagal
      console.error(`❌ Prediction ${data.id} failed:`, data.error);
      await prisma.tryOnResult.update({
        where: { predictionId: data.id },
        data: { status: 'FAILED' }
      });
    } else {
      // 5. Status lain: 'starting', 'processing'
      console.log(`🔄 Prediction ${data.id} status: ${data.status}`);
    }

    // 6. Selalu return 200 agar Replicate tahu webhook kita sudah menerima notifikasi.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}