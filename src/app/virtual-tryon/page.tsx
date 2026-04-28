import { prisma } from '@/lib/prisma';
import VirtualTryOnClient from '@/components/VirtualTryOnClient';

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
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <VirtualTryOnClient products={products} />
    </div>
  );
}
