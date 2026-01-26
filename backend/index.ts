import { Elysia } from "elysia";
import { auth } from "./src/lib/auth.js";
import { cors } from "@elysiajs/cors";
import { userRoutes } from "./src/routes/user.js";
import { familyRoutes } from "./src/routes/family.js";
import { uploadRoutes } from "./src/routes/upload_avatar.js";

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  )
  .use(userRoutes)
  .use(familyRoutes)
  .use(uploadRoutes)
  .all("/api/auth/*", ({ request }) => auth.handler(request))
  .get("/", () => "Backend is running!")
  .listen(3000);

console.log(`🦊 Server running at ${app.server?.hostname}:${app.server?.port}`);
