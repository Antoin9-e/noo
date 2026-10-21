function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

// Fourni par Vercel : l'URL de prod sans config manuelle
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

export const env = {
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required("DATABASE_URL"),
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? vercelUrl ?? "http://localhost:3000",
  appOrigins: (process.env.APP_ORIGIN ?? vercelUrl ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  tmdbApiKey: process.env.TMDB_API_KEY ?? "",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidSubject: process.env.VAPID_SUBJECT ?? "mailto:noo@example.com",
  cronSecret: process.env.CRON_SECRET ?? "",
};
