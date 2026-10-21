import { useState } from "react";
import { ExternalLink, Music2, Play, X } from "lucide-react";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { openInSpotify } from "./hooks";

interface Props {
  type: string;
  id: string;
  title: string | null;
  artist: string | null;
  image: string | null;
  className?: string;
}

const KIND: Record<string, string> = {
  track: "Morceau",
  album: "Album",
  playlist: "Playlist",
  episode: "Épisode",
  show: "Podcast",
  artist: "Artiste",
};

// Pochette + titre ; ▶ ouvre le lecteur Spotify dans l'app, ↗ ouvre l'app Spotify
export function MusicCard({ type, id, title, artist, image, className }: Props) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl", className)}>
        <iframe
          title={title ?? "Spotify"}
          src={`https://open.spotify.com/embed/${type}/${id}?utm_source=generator`}
          height={type === "track" || type === "episode" ? 152 : 352}
          className="block w-full border-0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
        <button
          type="button"
          aria-label="Fermer le lecteur"
          onClick={() => setPlaying(false)}
          className="pressable absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/50 text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5 rounded-2xl bg-[#121212] p-2 text-white", className)}>
      {image ? (
        <img src={image} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10">
          <Music2 className="size-6" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 leading-tight font-semibold">{title ?? "Une musique Spotify"}</span>
        <span className="block truncate text-caption text-white/60">{artist ?? KIND[type] ?? "Spotify"}</span>
      </span>
      <a
        href={openInSpotify(type, id)}
        target="_blank"
        rel="noreferrer"
        aria-label="Ouvrir dans Spotify"
        className="pressable grid size-9 shrink-0 place-items-center rounded-full text-white/70"
      >
        <ExternalLink className="size-5" />
      </a>
      <button
        type="button"
        aria-label="Écouter"
        onClick={() => {
          tap(8);
          setPlaying(true);
        }}
        className="pressable grid size-11 shrink-0 place-items-center rounded-full bg-[#1ed760] text-black"
      >
        <Play className="size-5 translate-x-px fill-current" />
      </button>
    </div>
  );
}
