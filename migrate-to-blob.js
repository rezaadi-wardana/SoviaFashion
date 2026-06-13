/**
 * Migration Script: Upload existing images from public/uploads/ to Vercel Blob Storage
 * 
 * Usage:
 *   1. Make sure BLOB_READ_WRITE_TOKEN is set in your .env file
 *   2. Run: node migrate-to-blob.js
 * 
 * This script will:
 *   - Read all Product, Category, Hero, and ProductVariant records with /uploads/ paths
 *   - Upload each file from public/uploads/ to Vercel Blob
 *   - Update the database with the new Blob URLs
 */

const { PrismaClient } = require("@prisma/client");
const { put } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function uploadFileToBlob(relativePath) {
  // relativePath is like "/uploads/filename.jpg"
  const localPath = path.join(process.cwd(), "public", relativePath);
  
  if (!fs.existsSync(localPath)) {
    console.warn(`  ⚠️ File not found: ${localPath}`);
    return null;
  }

  const buffer = fs.readFileSync(localPath);
  const fileName = path.basename(relativePath);
  
  // Determine content type
  const ext = path.extname(fileName).toLowerCase();
  const mimeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  const contentType = mimeMap[ext] || 'application/octet-stream';

  const blob = await put(`uploads/${fileName}`, buffer, {
    access: "public",
    contentType,
  });

  return blob.url;
}

function isLocalUploadPath(url) {
  return url && url.startsWith("/uploads/");
}

async function migrateHeroes() {
  console.log("\n📸 Migrating Hero images...");
  const heroes = await prisma.hero.findMany();
  let count = 0;

  for (const hero of heroes) {
    if (isLocalUploadPath(hero.image)) {
      console.log(`  Uploading: ${hero.image}`);
      const blobUrl = await uploadFileToBlob(hero.image);
      if (blobUrl) {
        await prisma.hero.update({
          where: { id: hero.id },
          data: { image: blobUrl },
        });
        console.log(`  ✅ Updated hero "${hero.title}" → ${blobUrl}`);
        count++;
      }
    }
  }
  console.log(`  Done: ${count} hero images migrated.`);
}

async function migrateCategories() {
  console.log("\n📁 Migrating Category images...");
  const categories = await prisma.category.findMany();
  let count = 0;

  for (const cat of categories) {
    if (isLocalUploadPath(cat.image)) {
      console.log(`  Uploading: ${cat.image}`);
      const blobUrl = await uploadFileToBlob(cat.image);
      if (blobUrl) {
        await prisma.category.update({
          where: { id: cat.id },
          data: { image: blobUrl },
        });
        console.log(`  ✅ Updated category "${cat.name}" → ${blobUrl}`);
        count++;
      }
    }
  }
  console.log(`  Done: ${count} category images migrated.`);
}

async function migrateProducts() {
  console.log("\n👗 Migrating Product images...");
  const products = await prisma.product.findMany();
  let count = 0;

  for (const product of products) {
    if (!product.images) continue;

    // images is stored as JSON string array, e.g. '["/uploads/a.jpg", "/uploads/b.jpg"]'
    let imageArray;
    try {
      imageArray = JSON.parse(product.images);
    } catch {
      // Maybe it's a single string
      imageArray = [product.images];
    }

    if (!Array.isArray(imageArray)) imageArray = [imageArray];

    let updated = false;
    const newImageArray = [];

    for (const img of imageArray) {
      if (isLocalUploadPath(img)) {
        console.log(`  Uploading: ${img}`);
        const blobUrl = await uploadFileToBlob(img);
        if (blobUrl) {
          newImageArray.push(blobUrl);
          updated = true;
        } else {
          newImageArray.push(img); // Keep original if upload failed
        }
      } else {
        newImageArray.push(img);
      }
    }

    if (updated) {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify(newImageArray) },
      });
      console.log(`  ✅ Updated product "${product.name}" (${newImageArray.length} images)`);
      count++;
    }
  }
  console.log(`  Done: ${count} products migrated.`);
}

async function migrateProductVariants() {
  console.log("\n🎨 Migrating ProductVariant images...");
  const variants = await prisma.productVariant.findMany();
  let count = 0;

  for (const variant of variants) {
    const updates = {};

    if (isLocalUploadPath(variant.image)) {
      console.log(`  Uploading image: ${variant.image}`);
      const blobUrl = await uploadFileToBlob(variant.image);
      if (blobUrl) updates.image = blobUrl;
    }

    if (isLocalUploadPath(variant.tryOnImage)) {
      console.log(`  Uploading tryOnImage: ${variant.tryOnImage}`);
      const blobUrl = await uploadFileToBlob(variant.tryOnImage);
      if (blobUrl) updates.tryOnImage = blobUrl;
    }

    if (isLocalUploadPath(variant.imageUrl)) {
      console.log(`  Uploading imageUrl: ${variant.imageUrl}`);
      const blobUrl = await uploadFileToBlob(variant.imageUrl);
      if (blobUrl) updates.imageUrl = blobUrl;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: updates,
      });
      console.log(`  ✅ Updated variant "${variant.name}" (${Object.keys(updates).join(", ")})`);
      count++;
    }
  }
  console.log(`  Done: ${count} variants migrated.`);
}

async function main() {
  console.log("🚀 Starting migration to Vercel Blob Storage...");
  console.log("   BLOB_READ_WRITE_TOKEN:", process.env.BLOB_READ_WRITE_TOKEN ? "✅ Set" : "❌ NOT SET");

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("\n❌ BLOB_READ_WRITE_TOKEN is not set!");
    console.error("   Please add it to your .env file or set it as an environment variable.");
    console.error("   You can get this token from: Vercel Dashboard → Project → Storage → Blob");
    process.exit(1);
  }

  try {
    await migrateHeroes();
    await migrateCategories();
    await migrateProducts();
    await migrateProductVariants();

    console.log("\n🎉 Migration complete!");
    console.log("   Next steps:");
    console.log("   1. Verify images are accessible by checking the Blob URLs");
    console.log("   2. Deploy to Vercel: git add . && git commit -m 'Migrate to Vercel Blob' && git push");
    console.log("   3. Test the website — all images should now load correctly");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
