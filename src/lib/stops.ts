import type {
  Destination,
  Filters,
  GeoPoint,
  StopSuggestions,
} from "./types";
import { haversineKm } from "./geo";
import { rankDestinations } from "./scoring";

const NEAR = (a: GeoPoint | Destination, b: GeoPoint | Destination) =>
  haversineKm(a, b) < 120; // same metropolitan area

/**
 * Given a fixed origin → destination route, suggest the best stop-over cities:
 * places that sit roughly "on the way" (low detour) AND in the middle stretch of
 * the journey (so we don't propose a city glued to the departure or arrival,
 * whose detour is ~1 but which makes no sense as a stop). Sorted by detour, then
 * relevance to the traveller's filters.
 */
export function suggestStops(
  origin: GeoPoint,
  destination: GeoPoint,
  candidates: Destination[],
  filters: Filters,
  requested: number,
  originCostIndex?: number
): StopSuggestions {
  const direct = haversineKm(origin, destination);

  const onRoute = candidates
    .map((c) => {
      const leg1 = haversineKm(origin, c);
      const leg2 = haversineKm(c, destination);
      return {
        c,
        detour: (leg1 + leg2) / direct,
        progress: leg1 / direct, // 0 = at origin, 1 = at destination
      };
    })
    .filter(
      (x) =>
        !NEAR(x.c, origin) &&
        !NEAR(x.c, destination) &&
        x.detour <= 1.4 &&
        x.progress >= 0.2 &&
        x.progress <= 0.8
    );

  const detourById = new Map(onRoute.map((x) => [x.c.id, x.detour]));

  const ranked = rankDestinations(
    origin,
    onRoute.map((x) => x.c),
    filters,
    originCostIndex
  ).map((r) => ({
    ...r,
    detour: Math.round((detourById.get(r.destination.id) ?? 0) * 100) / 100,
  }));

  ranked.sort((a, b) => a.detour! - b.detour! || b.score - a.score);

  return {
    destination,
    directDistanceKm: Math.round(direct),
    requested: Math.max(1, Math.min(4, requested || 1)),
    candidates: ranked.slice(0, 12),
  };
}
