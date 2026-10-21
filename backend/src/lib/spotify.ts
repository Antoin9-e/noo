// Lien Spotify collé ou partagé → ce qu'il faut pour l'afficher.
// Pas de compte ni de clé : la page publique d'open.spotify.com suffit.

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

export const spotifyUrl = (type: string, id: string) => `https://open.spotify.com/${type}/${id}`;
