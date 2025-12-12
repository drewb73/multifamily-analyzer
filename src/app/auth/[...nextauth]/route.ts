import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { z } from "zod";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Validation schema for credentials
const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth (optional)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Email/Password Credentials
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Validate input
          const validatedCredentials = credentialsSchema.safeParse(credentials);
          if (!validatedCredentials.success) {
            throw new Error(validatedCredentials.error.errors[0].message);
          }

          const { email, password } = validatedCredentials.data;

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email },
          });

          // If user doesn't exist or no password (OAuth user)
          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }

          // Verify password
          const passwordValid = await compare(password, user.password);
          if (!passwordValid) {
            throw new Error("Invalid email or password");
          }

          // Return user object (excluding password)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            trialEndsAt: user.trialEndsAt,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    // Add user ID to session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.trialEndsAt = token.trialEndsAt as string | null;
      }
      return session;
    },
    
    // Add custom fields to JWT token
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.trialEndsAt = user.trialEndsAt;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt", // Use JWT for sessions (stateless)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };