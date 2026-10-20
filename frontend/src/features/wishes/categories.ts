import type { WishCategory } from "@/types";

export interface CategoryMeta {
  key: WishCategory;
  slug: string;
  label: string;
  singular: string;
  emoji: string;
  tint: string; // fond doux de la tuile
  placeholder: string;
  addedTo: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "MOVIE", slug: "films", label: "Films", singular: "Film", emoji: "🎬", tint: "bg-[#ede4ff] dark:bg-[#2c1f4d]", placeholder: "Dune, Amélie…", addedTo: "aux films" },
  { key: "SERIES", slug: "series", label: "Séries", singular: "Série", emoji: "📺", tint: "bg-[#e3ecff] dark:bg-[#1f2747]", placeholder: "The Bear, Lupin…", addedTo: "aux séries" },
  { key: "RESTAURANT", slug: "restos", label: "Restos", singular: "Resto", emoji: "🍽️", tint: "bg-[#ffe9dc] dark:bg-[#3d2421]", placeholder: "Le petit italien du coin…", addedTo: "aux restos" },
  { key: "OUTING", slug: "sorties", label: "Sorties", singular: "Sortie", emoji: "🎟️", tint: "bg-[#ffe4ef] dark:bg-[#3d1f33]", placeholder: "Expo, concert, balade…", addedTo: "aux sorties" },
  { key: "TRIP", slug: "voyages", label: "Voyages", singular: "Voyage", emoji: "✈️", tint: "bg-[#dcf3ee] dark:bg-[#1a3434]", placeholder: "Lisbonne, Japon…", addedTo: "aux voyages" },
  { key: "GIFT", slug: "cadeaux", label: "Cadeaux", singular: "Cadeau", emoji: "🎁", tint: "bg-[#fff1cc] dark:bg-[#3a3019]", placeholder: "Une idée de cadeau…", addedTo: "aux idées cadeaux" },
  { key: "OTHER", slug: "autre", label: "Autre", singular: "Autre", emoji: "💡", tint: "bg-[#eeeae5] dark:bg-[#2a2433]", placeholder: "Cours de danse, pique-nique…", addedTo: "aux envies" },
];

export const categoryByKey = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<WishCategory, CategoryMeta>;
export const categoryBySlug = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c])) as Record<string, CategoryMeta>;

// Catégories qu'on peut tirer au sort un soir
export const TONIGHT_CATEGORIES: WishCategory[] = ["MOVIE", "SERIES", "RESTAURANT", "OUTING"];
