import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { signInSchema, type SignInData } from "@/schemas/auth";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "./AuthLayout";
import { Field } from "./Field";
import { GoogleButton } from "./GoogleButton";
import { useNext } from "./useNext";

export default function SignInPage() {
  const navigate = useNavigate();
  const next = useNext();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignInData>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = async (data: SignInData) => {
    setError(null);
    const { error } = await signIn.email(data);
    if (error) return setError("Email ou mot de passe incorrect.");
    navigate(next, { replace: true });
  };

  return (
    <AuthLayout
      title="Content de te revoir"
      subtitle="Connecte-toi pour retrouver votre petit monde."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-violet">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" type="email" autoComplete="email" inputMode="email" placeholder="toi@exemple.fr" error={errors.email?.message} {...form.register("email")} />
        <Field label="Mot de passe" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...form.register("password")} />
        {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-caption font-medium text-danger">{error}</p>}
        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <GoogleButton next={next} />
    </AuthLayout>
  );
}
