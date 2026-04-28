import { prisma } from '@/lib/prisma';
import VirtualTryOnClient from '@/components/VirtualTryOnClient';
import VirtualTryOnAdvanced from '@/components/VirtualTryOnAdvanced';

export const dynamic = 'force-dynamic';

async function getProducts() {
  const variants = await prisma.productVariant.findMany({
    where: { tryOnImage: { not: null } },
    select: { 
      id: true, 
      name: true, 
      tryOnImage: true,
      product: { select: { name: true } }
    },
    take: 15,
  });

  // Map to the shape expected by Virtual Try On
  return variants.map(v => ({
    id: v.id,
    name: `${v.product.name} - ${v.name}`,
    tryOnImage: v.tryOnImage as string,
  }));
}

export default async function VirtualTryOnPage() {
  const products = await getProducts();
  
  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Real-time Webcam Try-On - Saat ini di-hidden sesuai permintaan, dapat diaktifkan kembali nanti jika dibutuhkan */}
      {/* 
      <section>
        <VirtualTryOnClient products={products} />
      </section>
      */}

      {/* Advanced AI Try-On using Replicate */}
      <section className="pt-8">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <h2 className="text-3xl font-serif text-stone-800">Advanced AI Virtual Try-On</h2>
          <p className="text-stone-500 mt-2">Gunakan mode Advanced berbasis AI untuk hasil pemakaian virtual beresolusi tinggi, realistis, dan pencahayaan yang disesuaikan secara otomatis.</p>
        </div>
        <VirtualTryOnAdvanced />
      </section>
    </div>
  );
}
