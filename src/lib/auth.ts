import NextAuth, { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      /**
       * Melakukan verifikasi kredensial pengguna (email & password) saat login manual.
       * 
       * @param credentials - Objek yang berisi email dan password yang diinput user
       * @returns Objek user jika kredensial cocok, atau null jika tidak valid
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      }
    }),
  ],
  callbacks: {
    /**
     * Callback session untuk memodifikasi objek Session yang dikirim ke client.
     * Memasukkan data ID dan Role user dari JWT token ke objek session.user.
     */
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role) || "USER";
        if (token.picture) session.user.image = token.picture;
        if (token.name) session.user.name = token.name;
      }
      return session;
    },
    /**
     * Callback JWT untuk memproses pembuatan/pembaruan token JWT NextAuth.
     * Mengambil info nama, gambar, ID, dan role terbaru dari database untuk disimpan di token.
     */
    async jwt({ token, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }

      if (token.email && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, image: true, name: true },
        });
        if (dbUser) {
          console.log("JWT callback - found user:", dbUser);
          token.sub = dbUser.id;
          token.role = dbUser.role;
          if (dbUser.image) token.picture = dbUser.image;
          if (dbUser.name) token.name = dbUser.name;
        }
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  trustHost: true,
});