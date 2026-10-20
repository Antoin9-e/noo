import { useEffect, useState } from "react";
import { usePreferences, type ThemePreference } from "@/stores/preferences";

export type Theme = "day" | "evening";

const META_COLORS: Record<Theme, string> = { day: "#fbf7f2", evening: "#120a22" };

// « Du lever au coucher » : le soir commence à 19h et dure jusqu'à 7h
export function themeForHour(hour: number): Theme {
  return hour >= 19 || hour < 7 ? "evening" : "day";
}

export function resolveTheme(pref: ThemePreference, now = new Date()): Theme {
  return pref === "auto" ? themeForHour(now.getHours()) : pref;
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute("content", META_COLORS[theme]));
}

export function useThemeSync() {
  const pref = usePreferences((s) => s.theme);
  useEffect(() => {
    const update = () => applyTheme(resolveTheme(pref));
    update();
    const timer = window.setInterval(update, 60_000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [pref]);
}

// Thème effectivement appliqué (suit les changements de data-theme)
export function useResolvedTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme) ?? "day",
  );
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setTheme((document.documentElement.dataset.theme as Theme) ?? "day"),
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}
