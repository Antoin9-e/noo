import { env } from "./env.js";

// Lien Spotify collé ou partagé → ce qu'il faut pour l'afficher.
// Pas de compte ni de clé : la page publique d'open.spotify.com suffit.
// La recherche, elle, passe par l'API Web (identifiants de l'app, sans connexion utilisateur).

const TYPES = ["track", "album", "playlist", "episode", "show", "artist"] as const;
export type SpotifyType = (typeof TYPES)[number];

export interface SpotifyItem {
  type: SpotifyType;
  id: string;
  title: string | null;
  artist: string | null;
  image: string | null;
}

// open.spotify.com/intl-fr/track/ID?si=… ou spotify:track:ID
const LINK = new RegExp(`open\\.spotify\\.com/(?:intl-[a-z-]+/)?(${TYPES.join("|")})/([A-Za-z0-9]{22})`);
const URI = new RegExp(`spotify:(${TYPES.join("|")}):([A-Za-z0-9]{22})`);
// Liens courts de l'app mobile, qui redirigent vers open.spotify.com
const SHORT_HOSTS = ["spotify.link", "spotify.app.link"];

export function parseSpotify(text: string): { type: SpotifyType; id: string } | null {
  const m = text.match(LINK) ?? text.match(URI);
  return m ? { type: m[1] as SpotifyType, id: m[2]! } : null;
}

function shortLinkIn(text: string) {
  const m = text.match(/https?:\/\/[^\s]+/g) ?? [];
  return m.find((u) => URL.canParse(u) && SHORT_HOSTS.includes(new URL(u).hostname));
}

// On ne suit que les redirections qui restent chez Spotify
async function resolveShortLink(url: string) {
  let current = url;
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(4000) });
    const found = parseSpotify(current) ?? parseSpotify(res.headers.get("location") ?? "");
    if (found) return found;
    const next = res.headers.get("location");
    if (!next) return parseSpotify(await res.text());
    current = new URL(next, current).href;
    if (!SHORT_HOSTS.includes(new URL(current).hostname) && new URL(current).hostname !== "open.spotify.com") return null;
  }
  return null;
}

function meta(html: string, key: string) {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)="${key}"[^>]+content="([^"]*)"`));
  return m ? decode(m[1]!) : null;
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// og:description d'un morceau : « Rick Astley · Whenever You Need Somebody · Song · 1987 »
function artistFrom(type: SpotifyType, description: string | null) {
  if (!description || !["track", "album"].includes(type)) return null;
  return description.split(" · ")[0]?.trim() || null;
}

export async function lookupSpotify(text: string): Promise<SpotifyItem | null> {
  const ref = parseSpotify(text) ?? (await resolveShortLinkSafe(shortLinkIn(text)));
  if (!ref) return null;

  const item: SpotifyItem = { ...ref, title: null, artist: null, image: null };
  try {
    const res = await fetch(`https://open.spotify.com/${ref.type}/${ref.id}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Noo)" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const html = await res.text();
      item.title = meta(html, "og:title");
      item.artist = artistFrom(ref.type, meta(html, "og:description"));
      item.image = meta(html, "og:image");
    }
  } catch {
    // Spotify injoignable : on garde le lien, l'affichage se rabat sur « Morceau Spotify »
  }
  return item;
}

async function resolveShortLinkSafe(url: string | undefined) {
  if (!url) return null;
  try {
    return await resolveShortLink(url);
  } catch {
    return null;
  }
}

export const searchEnabled = () => !!(env.spotifyClientId && env.spotifyClientSecret);

let token: { value: string; expiresAt: number } | null = null;

// Jeton « client credentials », valable 1 h : on le garde en mémoire tant qu'il est frais
async function accessToken() {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${env.spotifyClientId}:${env.spotifyClientSecret}`)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Spotify token ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return token.value;
}

interface ApiTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { images: Array<{ url: string; width: number | null }> };
}

export async function searchTracks(q: string): Promise<SpotifyItem[]> {
  const url = new URL("https://api.spotify.com/v1/search");
  url.search = new URLSearchParams({ q, type: "track", limit: "10", market: "FR" }).toString();
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${await accessToken()}` },
    signal: AbortSignal.timeout(5000),
  });
  if (res.status === 401) token = null;
  if (!res.ok) throw new Error(`Spotify search ${res.status}`);
  const data = (await res.json()) as { tracks: { items: ApiTrack[] } };
  return data.tracks.items.map((t) => ({
    type: "track",
    id: t.id,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    // La plus petite pochette qui reste nette (≈ 300 px)
    image: t.album.images.find((i) => (i.width ?? 0) <= 320)?.url ?? t.album.images[0]?.url ?? null,
  }));
}
