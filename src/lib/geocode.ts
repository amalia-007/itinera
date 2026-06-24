import type { GeoPoint } from "./types";

// Open-Meteo geocoding — free, no API key, CORS-friendly. Used server-side in
// the route handler to resolve a free-text city name to coordinates.
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function geocodeCity(query: string): Promise<GeoPoint | null> {
  const q = query.trim();
  if (!q) return null;

  const url = `${GEO_URL}?name=${encodeURIComponent(q)}&count=1&language=fr&format=json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{
        name: string;
        country?: string;
        country_code?: string;
        latitude: number;
        longitude: number;
      }>;
    };
    const hit = data.results?.[0];
    if (!hit) return null;
    return {
      name: hit.name,
      country: hit.country,
      cc: hit.country_code,
      lat: hit.latitude,
      lon: hit.longitude,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
