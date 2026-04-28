import { NextResponse, NextRequest } from "next/server";
import Replicate from "replicate";
import { prisma } from "@/lib/prisma";

// 1. Inisialisasi client Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

// 2. Tentukan model ID yang akan digunakan
// Gunakan @latest untuk selalu menggunakan versi terbaru, atau hash spesifik untuk konsistensi.
const MODEL_ID =
  "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";

export async function POST(request: NextRequest) {
  try {
    // 3. Ambil data dari request yang dikirim frontend
    const {
      humanImageUrl, // URL foto pengguna (bisa dari upload ke server atau public URL)
      garmentImageUrl, // URL foto produk (dari database atau penyimpanan file)
      garmentDesc, // Deskripsi produk, misal: "Blue floral dress"
      category, // Kategori: "upper_body", "lower_body", "dresses"
    } = await request.json();

    if (!humanImageUrl || !garmentImageUrl) {
      return NextResponse.json(
        { error: "URL gambar manusia dan pakaian diperlukan." },
        { status: 400 },
      );
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = process.env.NGROK_HOST || process.env.NEXTAUTH_URL || process.env.VERCEL_URL || `${protocol}://${host}`;
    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/webhooks/replicate`;

    // 4. Kirim request ke Replicate untuk memulai prediksi
    //    Proses ini akan berjalan di latar belakang.
    const prediction = await replicate.predictions.create({
      version: MODEL_ID,
      input: {
        human_img: humanImageUrl, // Foto model (wajib)
        garm_img: garmentImageUrl, // Foto pakaian (wajib)
        garment_des: garmentDesc || "", // Deskripsi, kosongkan jika tidak ada.

        // Parameter tambahan yang disarankan untuk IDM-VTON
        category: category || "upper_body", // Kategori pakaian: upper_body, lower_body, dresses
        crop: false, // Nonaktifkan crop otomatis untuk hasil lebih baik
        force_dc: category === "dresses", // Aktifkan untuk pakaian kategori 'dresses'
        mask_only: false, // Kembalikan gambar pakaian saja
        steps: 30, // Jumlah langkah difusi (nilai 30 adalah default yang baik)
        seed: 42, // Seed untuk hasil yang konsisten (bisa pakai random)
      },
      // 5. Tentukan webhook (akan kita buat di langkah 3.2)
      webhook: webhookUrl,
      webhook_events_filter: ["completed"], // Replicate hanya akan mengirim notifikasi saat selesai
    });

    // Save initial record to database
    await prisma.tryOnResult.create({
      data: {
        predictionId: prediction.id,
        status: "starting"
      }
    });

    // 6. Langsung kirim balik predictionId ke frontend
    //    Sisanya akan ditangani oleh webhook.
    return NextResponse.json({ id: prediction.id }, { status: 201 });
  } catch (error) {
    console.error("Error saat memulai prediksi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memulai proses virtual try-on." },
      { status: 500 },
    );
  }
}
