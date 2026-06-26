import type { Destination, FlightEstimate, GeoPoint } from "./types";
import { haversineKm } from "./geo";

// Power-law fare model calibrated on real round-trip economy fares:
//   ~300 km  → ~65 €      ~5 000 km → ~410 €
//   ~1 000 km → ~120 €    ~10 000 km → ~750 €
// This is an HONEST ESTIMATE, not a live quote.
export function estimateFlight(
  origin: Pick<GeoPoint, "lat" | "lon">,
  dest: Destination,
  month?: number
): FlightEstimate {
  const distanceKm = Math.round(haversineKm(origin, dest));
  const safeDist = Math.max(distanceKm, 80);
  const raw = 40 + 0.1146 * Math.pow(safeDist, 0.948);
  const seasonal = month ? seasonMultiplier(dest, month) : 1;
  const roundTrip = round5(raw * seasonal);
  const oneWay = round5(roundTrip * 0.62);

  return {
    roundTrip,
    oneWay,
    distanceKm,
    level: "estimation",
    bestTimeToBuy: buyAdvice(distanceKm),
    cheapestMonths: cheapestMonths(dest),
  };
}

// Airport-to-airport estimate (no destination-specific seasonal data)
export function estimateFlightAtoB(
  from: Pick<GeoPoint, "lat" | "lon">,
  to: Pick<GeoPoint, "lat" | "lon">,
  month?: number
): { oneWay: number; roundTrip: number; distanceKm: number } {
  const distanceKm = Math.round(haversineKm(from, to));
  const safeDist = Math.max(distanceKm, 80);
  const raw = 40 + 0.1146 * Math.pow(safeDist, 0.948);
  // Generic summer/winter holiday premium without destination-specific data
  let seasonal = 1;
  if (month === 7 || month === 8 || month === 12) seasonal = 1.1;
  const roundTrip = round5(raw * seasonal);
  const oneWay = round5(roundTrip * 0.62);
  return { oneWay, roundTrip, distanceKm };
}

function seasonMultiplier(dest: Destination, month: number): number {
  const peak = dest.bestMonths.includes(month);
  let m = peak ? 1.12 : 0.93;
  if (month === 7 || month === 8 || month === 12) m += 0.06;
  return m;
}

function buyAdvice(distanceKm: number): string {
  if (distanceKm < 1500)
    return "Réservez 3 à 6 semaines avant. Mardi/mercredi sont souvent les jours les moins chers.";
  if (distanceKm < 6000)
    return "Réservez 6 à 10 semaines avant pour viser le meilleur tarif.";
  return "Réservez 2 à 5 mois avant : les long-courriers grimpent vite à l'approche du départ.";
}

function cheapestMonths(dest: Destination): number[] {
  const avoid = new Set<number>([...dest.bestMonths, 7, 8, 12]);
  const cheap: number[] = [];
  for (let m = 1; m <= 12; m++) if (!avoid.has(m)) cheap.push(m);
  return cheap.slice(0, 4);
}

function round5(n: number): number {
  return Math.round(n / 5) * 5;
}
