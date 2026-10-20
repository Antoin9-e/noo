import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Au moins 2 caractères"),
  email: z.email("Adresse email invalide"),
  password: z.string().min(8, "Au moins 8 caractères"),
});

export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
