import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { signUpSchema, type SignUpData } from "@/schemas/auth";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "./AuthLayout";
import { Field } from "./Field";
import { GoogleButton } from "./GoogleButton";
import { useNext } from "./useNext";

export default function SignUpPage() {
  const navigate = useNavigate();
  const next = useNext();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = async (data: SignUpData) => {
    setError(null);
    const { error } = await signUp.email(data);
    if (error) {
      return setError(
        error.code === "USER_ALREADY_EXISTS" || error.status === 422
          ? "Un compte existe déjà avec cet email."
          : "Impossible de créer le compte, réessaie.",
      );
    }
    navigate(next, { replace: true });
  };

  return (
    <AuthLayout
      title="Bienvenue 👋"
      subtitle="Ton compte, en 20 secondes."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link to={`/signin${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-violet">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Prénom" autoComplete="given-name" placeholder="Ton prénom" error={errors.name?.message} {...form.register("name")} />
        <Field label="Email" type="email" autoComplete="email" inputMode="email" placeholder="toi@exemple.fr" error={errors.email?.message} {...form.register("email")} />
        <Field label="Mot de passe" type="password" autoComplete="new-password" placeholder="8 caractères minimum" error={errors.password?.message} {...form.register("password")} />
        {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-caption font-medium text-danger">{error}</p>}
        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
      <GoogleButton next={next} />
    </AuthLayout>
  );
}
