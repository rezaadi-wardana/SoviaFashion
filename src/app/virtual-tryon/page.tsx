import { prisma } from '@/lib/prisma';
import VirtualTryOnAdvanced from '@/components/VirtualTryOnAdvanced';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

/**
 * Mengambil daftar varian produk dari database Prisma yang memiliki gambar coba virtual (tryOnImage),
 * menyaring kategori hijab, lalu memetakan data tersebut ke bentuk objek yang dikenali oleh UI Try-on.
 */
async function getProducts() {
  const variants = await prisma.productVariant.findMany({
    where: { tryOnImage: { not: null } },
    select: {
      id: true,
      name: true,
      tryOnImage: true,
      product: { select: { name: true, category: { select: { name: true } } } }
    },
    take: 30,
  });

  // Map to the shape expected by Virtual Try On
  return variants
    .filter(v => v.product.category?.name.toLowerCase() !== 'hijab')
    .map(v => ({
      id: v.id,
      name: `${v.product.name} - ${v.name}`,
      tryOnImage: v.tryOnImage as string,
      category: v.product.category?.name || '',
    }));
}

/**
 * Komponen Halaman Virtual Try-On (Server Component) yang mengambil data produk dengan try-on aktif,
 * lalu merendernya dalam komponen VirtualTryOnAdvanced di bawah Suspense.
 */
export default async function VirtualTryOnPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-sovia-50 py-12 px-4 sm:px-6 lg:px-8 space-y-16">

      {/* AI Virtual Try-On using Replicate */}
      <section className="pt-8">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <h2 className="text-3xl font-serif text-sovia-800">Virtual Try-On</h2>
          <p className="text-sovia-500 mt-2">Gunakan fitur coba virtual kami  berbasis AI untuk mencoba pakaian dengan realistis, dan pencahayaan yang disesuaikan secara otomatis.</p>
        </div>
        <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-sovia-600 border-t-transparent rounded-full animate-spin"></div></div>}>
          <VirtualTryOnAdvanced products={products} />
        </Suspense>
      </section>
    </div>
  );
}
