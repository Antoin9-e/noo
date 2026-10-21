import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppShell } from "./AppShell";
import { HouseholdGate } from "./HouseholdGate";
import NotFoundPage from "./NotFoundPage";
import SignInPage from "@/features/auth/SignInPage";
import SignUpPage from "@/features/auth/SignUpPage";
import TodayPage from "@/features/today/TodayPage";
import AgendaPage from "@/features/agenda/AgendaPage";
import WishesPage from "@/features/wishes/WishesPage";
import WishListPage from "@/features/wishes/WishListPage";
import MatchPage from "@/features/wishes/MatchPage";
import TonightPage from "@/features/wishes/TonightPage";
import NotesPage from "@/features/notes/NotesPage";
import ShareTargetPage from "@/features/notes/ShareTargetPage";
import MePage from "@/features/me/MePage";
import OnboardingPage from "@/features/household/OnboardingPage";
import JoinPage from "@/features/household/JoinPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/join/:token" element={<JoinPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<HouseholdGate />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<TodayPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/envies" element={<WishesPage />} />
            <Route path="/envies/match" element={<MatchPage />} />
            <Route path="/envies/:slug" element={<WishListPage />} />
            <Route path="/ce-soir" element={<TonightPage />} />
            <Route path="/mots" element={<NotesPage />} />
            <Route path="/mots/partager" element={<ShareTargetPage />} />
            <Route path="/moi" element={<MePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
