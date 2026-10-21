import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useUi } from "@/stores/ui";
import { spotifyUrlIn } from "./hooks";

// Android : Spotify → Partager → Noo arrive ici (share_target du manifest)
export default function ShareTargetPage() {
  const [params] = useSearchParams();
  const openNote = useUi((s) => s.openNote);
  const shared = [params.get("url"), params.get("text"), params.get("title")].filter(Boolean).join(" ");

  useEffect(() => {
    const spotifyUrl = spotifyUrlIn(shared);
    openNote(spotifyUrl ? { spotifyUrl } : { text: shared });
  }, [shared, openNote]);

  return <Navigate to="/mots" replace />;
}
