import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@/features/household/hooks";

// Pas encore de foyer → onboarding
export function HouseholdGate() {
  const { data: me, isLoading } = useMe();
  if (isLoading && !me) return <div className="min-h-dvh" />;
  if (me && me.memberships.length === 0) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
