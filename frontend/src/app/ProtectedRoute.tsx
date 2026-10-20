import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/lib/auth-client";

export function ProtectedRoute() {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) return <div className="min-h-dvh" />;
  if (!session) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
