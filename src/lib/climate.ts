import type { ClimateArchetype, Destination, WeatherWish } from "./types";

// Average daytime temperature (°C) by month, Jan..Dec, for the NORTHERN
// hemisphere. Southern-hemisphere destinations are shifted by 6 months.
// These curves are climatological archetypes — good enough to rank a
// destination's "season feel" without 50 live weather calls per search.
const ARCHETYPES: Record<ClimateArchetype, number[]> = {
  tropical: [30, 30, 31, 32, 32, 31, 31, 31, 31, 31, 30, 30],
  mousson: [31, 32, 33, 34, 33, 31, 31, 31, 31, 31, 30, 30],
  mediterraneen: [13, 14, 16, 19, 23, 28, 31, 31, 27, 22, 17, 14],
  desertique: [20, 23, 28, 33, 38, 42, 43, 42, 39, 33, 26, 21],
  oceanique: [8, 9, 12, 15, 18, 21, 23, 23, 20, 16, 11, 9],
  continental: [1, 3, 9, 16, 21, 26, 28, 27, 22, 15, 8, 3],
  subtropical: [16, 18, 22, 26, 29, 31, 32, 32, 30, 26, 21, 17],
  alpin: [-2, 0, 4, 9, 14, 18, 20, 19, 15, 9, 3, -1],
};

/** Expected daytime temperature at a destination for a given month (1-12). */
export function monthlyTemp(dest: Destination, month: number): number {
  const idx = (((month - 1) % 12) + 12) % 12;
  const base = ARCHETYPES[dest.archetype];
  const value = dest.hemisphere === "S" ? base[(idx + 6) % 12] : base[idx];
  return Math.round(value + (dest.tempOffset ?? 0));
}

export function weatherCategory(tempC: number): WeatherWish {
  if (tempC >= 29) return "chaud";
  if (tempC >= 23) return "doux";
  if (tempC >= 16) return "tempere";
  if (tempC >= 8) return "frais";
  return "froid";
}

// Ordered scale used to measure the "distance" between wish and reality.
const SCALE: WeatherWish[] = ["froid", "frais", "tempere", "doux", "chaud"];

/** 0 (opposite) → 1 (exact match). Accepts a single wish or an array. */
export function weatherMatch(
  wish: WeatherWish | WeatherWish[] | undefined,
  tempC: number
): number {
  if (!wish || (Array.isArray(wish) && wish.length === 0)) return 0.6;
  const wishes = Array.isArray(wish) ? wish : [wish];
  if (wishes.includes("peu_importe")) return 0.6;
  const cat = weatherCategory(tempC);
  const catIdx = SCALE.indexOf(cat);
  // Take the best match across all selected weathers
  const best = Math.max(
    ...wishes.map((w) => Math.max(0, 1 - Math.abs(catIdx - SCALE.indexOf(w)) * 0.3))
  );
  return best;
}
