import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export const signUpSchema = z
  .object({
    name: z
      .string("Name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z.email("Invalid email address"),
    password: z
      .string("Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string("Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
  });

export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
