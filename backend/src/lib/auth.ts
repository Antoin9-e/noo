import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { env } from "./env.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: env.appOrigins,
  baseURL: env.betterAuthUrl,
  session: {
    // Une PWA reste ouverte longtemps : session de 60 jours, renouvelée chaque jour d'usage
    expiresIn: 60 * 60 * 24 * 60,
    updateAge: 60 * 60 * 24,
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    },
  },
});
