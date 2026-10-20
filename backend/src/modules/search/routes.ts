import { Elysia, t } from "elysia";
import { authGuard } from "../../plugins/auth-guard.js";
import { env } from "../../lib/env.js";

const TMDB = "https://api.themoviedb.org/3";
const POSTER = "https://image.tmdb.org/t/p/w342";

interface TmdbResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string;
  popularity?: number;
}

export interface MovieResult {
  externalId: string;
  category: "MOVIE" | "SERIES";
  title: string;
  year: number | null;
  imageUrl: string | null;
  overview: string;
}

// Clé v3 (courte) en paramètre, ou jeton v4 (JWT) en Bearer
function tmdbRequest(path: string, params: Record<string, string>) {
  const url = new URL(TMDB + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const headers: Record<string, string> = { accept: "application/json" };
  if (env.tmdbApiKey.length > 40) headers.authorization = `Bearer ${env.tmdbApiKey}`;
  else url.searchParams.set("api_key", env.tmdbApiKey);
  return fetch(url, { headers, signal: AbortSignal.timeout(5000) });
}

export const searchRoutes = new Elysia({ prefix: "/api/search" })
  .use(authGuard)
  .get(
    "/movies",
    async ({ query, status }) => {
      if (!env.tmdbApiKey) return status(503, { error: "Recherche de films non configurée" });
      const q = query.q.trim();
      if (q.length < 2) return [];

      const res = await tmdbRequest("/search/multi", {
        query: q,
        language: "fr-FR",
        include_adult: "false",
      });
      if (!res.ok) return status(502, { error: "TMDB ne répond pas" });
      const data = (await res.json()) as { results: TmdbResult[] };

      return data.results
        .filter((r) => r.media_type === "movie" || r.media_type === "tv")
        .slice(0, 12)
        .map<MovieResult>((r) => {
          const date = r.release_date || r.first_air_date;
          return {
            externalId: `tmdb:${r.media_type}:${r.id}`,
            category: r.media_type === "movie" ? "MOVIE" : "SERIES",
            title: (r.title ?? r.name ?? "").trim(),
            year: date ? Number(date.slice(0, 4)) : null,
            imageUrl: r.poster_path ? POSTER + r.poster_path : null,
            overview: r.overview ?? "",
          };
        });
    },
    { auth: true, query: t.Object({ q: t.String({ maxLength: 100 }) }) },
  );
