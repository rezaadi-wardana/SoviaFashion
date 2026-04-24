const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const store = await prisma.storeProfile.findUnique({
    where: { id: 'store-profile' }
  });
  console.log(store);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
