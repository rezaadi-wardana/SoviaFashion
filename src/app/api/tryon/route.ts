/**
 * POST /api/tryon
 * Memulai prediksi Virtual Try-On menggunakan API Replicate.
 * Mengirim foto pengguna dan gambar pakaian sebagai input ke model AI,
 * lalu menyimpan predictionId ke database untuk dipantau (polling/webhook).
 */
import { NextResponse, NextRequest } from "next/server";
import Replicate from "replicate";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { join } from "path";

// 1. Inisialisasi client Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

// 2. Tentukan versi model (hanya hash, tanpa owner/model prefix)
const MODEL_VERSION =
  "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";

/**
 * Convert a local file path (relative to /public) to a base64 data URI.
 * This ensures Replicate can always access the image, even if ngrok has interstitial pages.
 */
async function localPathToDataUri(relativePath: string): Promise<string> {
  // relativePath is like "/uploads/xxx.webp"
  const filePath = join(process.cwd(), "public", relativePath);
  const buffer = await readFile(filePath);
  const base64 = buffer.toString("base64");
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
    'webp': 'image/webp', 'gif': 'image/gif', 'svg': 'image/svg+xml',
  };
  const mimeType = mimeMap[ext] || "image/png";
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Resolve the public base URL for this deployment.
 */
function getBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NGROK_HOST) {
    return process.env.NGROK_HOST.replace(/\/$/, '');
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  }
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    // 3. Ambil data dari request yang dikirim frontend
    const {
      humanImageUrl, // URL foto pengguna (data URI dari upload endpoint)
      garmentImageUrl, // URL foto produk (relative path dari database)
      garmentDesc, // Deskripsi produk
      crop, // Apakah akan di crop
      category, // Kategori: "upper_body", "lower_body", "dresses"
    } = await request.json();

    if (!humanImageUrl || !garmentImageUrl) {
      return NextResponse.json(
        { error: "URL gambar manusia dan pakaian diperlukan." },
        { status: 400 },
      );
    }

    // Resolve image URLs for Replicate
    let finalHumanImageUrl = humanImageUrl;
    let finalGarmentImageUrl = garmentImageUrl;

    const isVercel = !!process.env.VERCEL;
    const baseUrl = getBaseUrl(request);

    // Handle garment image URL
    if (finalGarmentImageUrl.startsWith('http://') || finalGarmentImageUrl.startsWith('https://')) {
      // Full URL (e.g., Vercel Blob URL) — use as-is
      console.log("✅ Garment image is a full URL, using directly");
    } else if (finalGarmentImageUrl.startsWith('/')) {
      if (!isVercel) {
        // Local dev: read from filesystem and convert to data URI
        // This avoids ngrok interstitial page issues
        try {
          finalGarmentImageUrl = await localPathToDataUri(finalGarmentImageUrl);
          console.log("✅ Garment image converted to data URI from local file");
        } catch (fsErr) {
          // Fallback to absolute URL via ngrok
          console.warn("⚠️ Could not read garment from filesystem, using URL:", fsErr);
          finalGarmentImageUrl = `${baseUrl}${finalGarmentImageUrl}`;
        }
      } else {
        // Vercel: static files in public/ are served at the root domain
        finalGarmentImageUrl = `${baseUrl}${finalGarmentImageUrl}`;
      }
    }

    // Handle human image URL (usually already a data URI from upload endpoint)
    if (finalHumanImageUrl.startsWith('http://') || finalHumanImageUrl.startsWith('https://')) {
      // Full URL (e.g., Vercel Blob URL) — use as-is
      console.log("✅ Human image is a full URL, using directly");
    } else if (finalHumanImageUrl.startsWith('/')) {
      if (!isVercel) {
        try {
          finalHumanImageUrl = await localPathToDataUri(finalHumanImageUrl);
          console.log("✅ Human image converted to data URI from local file");
        } catch (fsErr) {
          console.warn("⚠️ Could not read human image from filesystem, using URL:", fsErr);
          finalHumanImageUrl = `${baseUrl}${finalHumanImageUrl}`;
        }
      } else {
        finalHumanImageUrl = `${baseUrl}${finalHumanImageUrl}`;
      }
    }

    console.log("🔄 Creating Replicate prediction...");
    console.log("   Human image:", finalHumanImageUrl.startsWith('data:') ? `data URI (${Math.round(finalHumanImageUrl.length / 1024)}KB)` : finalHumanImageUrl);
    console.log("   Garment image:", finalGarmentImageUrl.startsWith('data:') ? `data URI (${Math.round(finalGarmentImageUrl.length / 1024)}KB)` : finalGarmentImageUrl);
    console.log("   Category:", category || "upper_body");

    // Build prediction options
    const predictionOptions: Parameters<typeof replicate.predictions.create>[0] = {
      version: MODEL_VERSION,
      input: {
        human_img: finalHumanImageUrl,
        garm_img: finalGarmentImageUrl,
        garment_des: garmentDesc || "",
        category: category || "upper_body",
        crop: true,
        force_dc: category === "dresses",
        mask_only: false,
        steps: 30,
        seed: 42,
      },
    };

    // Only use webhook in local dev where ngrok tunnel is reliably available
    if (!isVercel && process.env.NGROK_HOST) {
      const webhookUrl = `${process.env.NGROK_HOST.replace(/\/$/, '')}/api/webhooks/replicate`;
      predictionOptions.webhook = webhookUrl;
      predictionOptions.webhook_events_filter = ["completed"];
      console.log("   Webhook:", webhookUrl);
    } else {
      console.log("   Webhook: disabled (using direct polling)");
    }

    // 4. Kirim request ke Replicate
    const prediction = await replicate.predictions.create(predictionOptions);
    console.log(`✅ Prediction created: ${prediction.id} (status: ${prediction.status})`);

    // Save initial record to database
    await prisma.tryOnResult.create({
      data: {
        predictionId: prediction.id,
        status: "starting"
      }
    });

    // Langsung kirim balik predictionId ke frontend
    return NextResponse.json({ id: prediction.id }, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ Error saat memulai prediksi:", error);
    
    // Check for Replicate-specific errors
    const errMsg = error instanceof Error ? error.message : String(error);
    
    if (errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('throttled')) {
      return NextResponse.json(
        { error: "Batas penggunaan Replicate API tercapai. Silakan coba lagi dalam beberapa saat, atau tambahkan kredit di https://replicate.com/account/billing" },
        { status: 429 },
      );
    }
    
    if (errMsg.includes('less than') && errMsg.includes('credit')) {
      return NextResponse.json(
        { error: "Saldo kredit Replicate tidak mencukupi. Silakan tambahkan kredit di https://replicate.com/account/billing" },
        { status: 402 },
      );
    }
    
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memulai proses virtual try-on." },
      { status: 500 },
    );
  }
}
