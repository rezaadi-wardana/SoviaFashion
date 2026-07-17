/**
 * Endpoint handler NextAuth.js untuk semua rute autentikasi (/api/auth/*).
 * Delegasikan seluruh logic autentikasi ke konfigurasi NextAuth di lib/auth.ts.
 */
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers