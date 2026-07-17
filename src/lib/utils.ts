import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Menggabungkan nama-nama kelas CSS dengan clsx dan tailwind-merge
 * untuk menghasilkan daftar kelas CSS yang bersih dan tanpa konflik.
 * 
 * @param inputs - Daftar kelas CSS (string, object, array, dll)
 * @returns String nama-nama kelas yang sudah bersih dari duplikasi/konflik
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Memformat angka nominal uang menjadi string mata uang Rupiah (IDR).
 * 
 * @param price - Angka harga yang akan diformat
 * @returns String harga terformat (contoh: Rp 150.000,00)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(price)
}

/**
 * Memformat objek Date atau string tanggal menjadi format tanggal lokal Indonesia.
 * 
 * @param date - Tanggal berupa objek Date atau string
 * @returns String tanggal terformat (contoh: 14 Juli 2026)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d)
}

/**
 * Mengubah string menjadi format Title Case (huruf pertama setiap kata menjadi kapital).
 * 
 * @param str - String input yang akan diubah
 * @returns String hasil konversi ke Title Case
 */
export function toTitleCase(str: string): string {
  if (!str) return ""
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  )
}

/**
 * Menentukan harga jual produk berdasarkan varian dan ukuran yang dipilih.
 * Jika terdapat ukuran spesifik, akan ditarik harga untuk ukuran tersebut.
 * Jika tidak, akan memakai harga varian atau harga dasar produk sebagai cadangan (fallback).
 * 
 * @param productPrice - Harga dasar produk
 * @param variant - Objek varian produk yang dipilih (opsional)
 * @param sizeName - Nama ukuran yang dipilih (opsional)
 * @returns Harga final dalam tipe number
 */
export function resolvePrice(
  productPrice: number,
  variant?: { price?: number | null; sizes?: string | null },
  sizeName?: string | null,
  stock?: number,
): number {
  if (!variant) return productPrice;

  // Check if size is specified and has a specific price
  if (sizeName && variant.sizes) {
    const sizeMatch = variant.sizes.split(",").find((s) => {
      const [name] = s.split(":");
      return name.trim() === sizeName;
    });
    if (sizeMatch) {
      const parts = sizeMatch.split(":");
      if (parts.length >= 3 && parts[2].trim() !== "") {
        return parseFloat(parts[2]);
      }
    }
  }

  // Fallback to variant price
  if (variant.price !== null && variant.price !== undefined) {
    return variant.price;
  }

  // Fallback to product price
  return productPrice;
}

/**
 * Menentukan harga beli modal (buyPrice) berdasarkan varian dan ukuran yang dipilih.
 * Berguna untuk pencatatan laporan keuangan/admin.
 * 
 * @param variant - Objek varian produk yang dipilih (opsional)
 * @param sizeName - Nama ukuran yang dipilih (opsional)
 * @returns Harga beli final (dalam number) atau null jika tidak didefinisikan
 */
export function resolveBuyPrice(
  variant?: { buyPrice?: number | null; sizes?: string | null },
  sizeName?: string | null
): number | null {
  if (!variant) return null;

  // Check if size is specified and has a specific buy price
  // The string format is Name:Stock:Price:BuyPrice
  if (sizeName && variant.sizes) {
    const sizeMatch = variant.sizes.split(",").find((s) => {
      const [name] = s.split(":");
      return name.trim() === sizeName;
    });
    if (sizeMatch) {
      const parts = sizeMatch.split(":");
      if (parts.length >= 4 && parts[3].trim() !== "") {
        return parseFloat(parts[3]);
      }
    }
  }

  // Fallback to variant buy price
  if (variant.buyPrice !== null && variant.buyPrice !== undefined) {
    return variant.buyPrice;
  }

  return null;
}

/**
 * Mendapatkan rentang harga (minimum dan maksimum) dari suatu produk
 * berdasarkan harga dasar dan harga varian/ukurannya.
 * 
 * @param product - Objek produk yang menyertakan harga dasar dan varian
 * @returns Objek berisi harga min, max, dan boolean hasRange jika harga bervariasi
 */
export function getProductPriceRange(product: {
  price: number;
  variants?: { price?: number | null; sizes?: string | null }[];
}): { min: number; max: number; hasRange: boolean } {
  let min = product.price;
  let max = product.price;
  let prices = new Set<number>();
  
  // We only add product.price to the set if there are NO variants at all.
  // Or, we should always add it? Usually if variants exist, their prices override the base price.
  // Wait, if a product has variants, the lowest variant price is the starting price.
  if (!product.variants || product.variants.length === 0) {
    prices.add(product.price);
  } else {
    product.variants.forEach((v) => {
      let variantBasePrice = product.price;
      if (v.price !== null && v.price !== undefined) {
        variantBasePrice = v.price;
      }
      
      if (!v.sizes) {
        prices.add(variantBasePrice);
      } else {
        const sizesArr = v.sizes.split(",").filter(Boolean);
        if (sizesArr.length === 0) {
          prices.add(variantBasePrice);
        } else {
          sizesArr.forEach((s) => {
            const parts = s.split(":");
            if (parts.length >= 3 && parts[2].trim() !== "") {
              prices.add(parseFloat(parts[2]));
            } else {
              prices.add(variantBasePrice);
            }
          });
        }
      }
    });
  }

  const sortedPrices = Array.from(prices).sort((a, b) => a - b);
  if (sortedPrices.length > 0) {
    min = sortedPrices[0];
    max = sortedPrices[sortedPrices.length - 1];
  }

  return { min, max, hasRange: min !== max };
}