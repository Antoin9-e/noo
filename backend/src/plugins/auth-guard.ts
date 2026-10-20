import { Elysia } from "elysia";
import { auth } from "../lib/auth.js";

// Macro `auth: true` : injecte { user, session } ou répond 401
export const authGuard = new Elysia({ name: "auth-guard" }).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const session = await auth.api.getSession({ headers });
      if (!session) return status(401, { error: "Non connecté" });
      return { user: session.user, session: session.session };
    },
  },
});
