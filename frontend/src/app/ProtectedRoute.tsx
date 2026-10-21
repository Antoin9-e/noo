import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/lib/auth-client";

const KEY = "noo-had-session";

function hadSession() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function ProtectedRoute() {
  const { data: session, isPending, error } = useSession();
  const location = useLocation();

  useEffect(() => {
    try {
      if (session) localStorage.setItem(KEY, "1");
      else if (!isPending && !error) localStorage.removeItem(KEY);
    } catch {
      /* rien */
    }
  }, [session, isPending, error]);

  if (isPending) return <div className="min-h-dvh" />;
  // Hors-ligne (métro, avion) : on reste dans l'app avec les données en cache
  const offline = !session && (error || !navigator.onLine) && hadSession();
  if (!session && !offline) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
