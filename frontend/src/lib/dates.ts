import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h >= 18 || h < 5) return "Bonsoir";
  if (h >= 12) return "Bon après-midi";
  return "Bonjour";
}

export function fmt(date: Date | string | number, pattern: string) {
  return format(typeof date === "string" ? new Date(date) : date, pattern, { locale: fr });
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
