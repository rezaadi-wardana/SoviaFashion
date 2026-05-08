const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ take: 5 });
  console.log("Product Images:");
  products.forEach(p => console.log(p.images));
  
  const categories = await prisma.category.findMany({ take: 5 });
  console.log("\nCategory Images:");
  categories.forEach(c => console.log(c.image));
  
  const heroes = await prisma.hero.findMany({ take: 5 });
  console.log("\nHero Images:");
  heroes.forEach(h => console.log(h.image));
}

main().finally(() => prisma.$disconnect());
