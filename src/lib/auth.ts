import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "bsm-development-secret-key-super-secure-32chars",
  trustHost: true,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email hoặc Số Điện Thoại", type: "text" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const rawIdentifier = String(credentials.email).trim();
        const cleanEmail = rawIdentifier.toLowerCase();
        const rawPassword = String(credentials.password);

        try {
          // Cho phép đăng nhập linh hoạt bằng Email (không phân biệt hoa thường) HOẶC Số điện thoại
          const user = await db.user.findFirst({
            where: {
              OR: [
                { email: { equals: cleanEmail, mode: "insensitive" } },
                { phone: rawIdentifier },
                { phone: cleanEmail },
              ],
            },
          });

          if (!user || !user.passwordHash) {
            console.warn(`[Auth] Không tìm thấy tài khoản cho thông tin: "${rawIdentifier}"`);
            return null;
          }

          const isValid = await bcrypt.compare(rawPassword, user.passwordHash);

          if (!isValid) {
            console.warn(`[Auth] Mật khẩu không chính xác cho tài khoản: "${user.email}"`);
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (dbError) {
          console.error("[Auth] Database query error in authorize:", dbError);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
