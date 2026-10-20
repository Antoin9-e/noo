import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppShell } from "./AppShell";
import NotFoundPage from "./NotFoundPage";
import SignInPage from "@/features/auth/SignInPage";
import SignUpPage from "@/features/auth/SignUpPage";
import TodayPage from "@/features/today/TodayPage";
import AgendaPage from "@/features/agenda/AgendaPage";
import WishesPage from "@/features/wishes/WishesPage";
import MePage from "@/features/me/MePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/envies" element={<WishesPage />} />
          <Route path="/moi" element={<MePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
