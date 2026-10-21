import { useLocation, useSearchParams } from "react-router-dom";

// Où revenir après connexion : ?next=/join/xxx ou la page protégée d'origine
export function useNext() {
  const [params] = useSearchParams();
  const location = useLocation();
  const next = params.get("next") ?? (location.state as { from?: string } | null)?.from ?? "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
