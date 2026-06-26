import rawAirports from "./airports-db.json";
import type { Airport } from "@/lib/types";

const DB = rawAirports as Airport[];

// Normalize string for fuzzy matching (remove accents, lowercase)
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .trim();
}

export function searchAirports(query: string, limit = 8): Airport[] {
  const q = norm(query);
  if (!q) return [];

  // Exact IATA match first
  if (/^[a-zA-Z]{3}$/.test(query.trim())) {
    const exact = DB.find((a) => a.iata.toLowerCase() === query.trim().toLowerCase());
    if (exact) {
      const rest = DB.filter(
        (a) =>
          a.iata !== exact.iata &&
          (norm(a.city).includes(q) || norm(a.name).includes(q))
      ).slice(0, limit - 1);
      return [exact, ...rest];
    }
  }

  const scored = DB.map((a) => {
    const city = norm(a.city);
    const name = norm(a.name);
    const country = norm(a.country);
    const iata = a.iata.toLowerCase();

    let score = 0;
    if (city.startsWith(q)) score += 100;
    else if (city.includes(q)) score += 60;
    if (name.includes(q)) score += 30;
    if (country.startsWith(q)) score += 20;
    if (iata === q) score += 200;

    return { a, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.a);

  return scored;
}
