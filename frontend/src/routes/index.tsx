import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import DashboardPage from "@/pages/DashboardPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Routes protégées */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Redirection par défaut */}
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
