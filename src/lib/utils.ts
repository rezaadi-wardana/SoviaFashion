import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(price)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d)
}

export function toTitleCase(str: string): string {
  if (!str) return ""
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  )
}

export function resolvePrice(
  productPrice: number,
  variant?: { price?: number | null; sizes?: string | null },
  sizeName?: string | null
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