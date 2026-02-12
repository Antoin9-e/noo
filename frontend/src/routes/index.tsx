import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import DashboardPage from "@/pages/DashboardPage";
import ErrorPage from "@/pages/ErrorPage";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";
import FamilyDashboard from "@/pages/FamilyDashboard";
import CreateFamilyPage from "@/pages/CreateFamilyPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/families/:familyId" element={<FamilyDashboard />} />
      <Route path="/families/create" element={<CreateFamilyPage />} />

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
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}
