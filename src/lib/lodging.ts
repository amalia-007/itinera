import type { Destination } from "./types";

export type LodgingKey = "hostel" | "appartement" | "hotel" | "resort";

export interface LodgingEstimate {
  key: LodgingKey;
  label: string;
  icon: string;
  perNight: [number, number]; // EUR, whole group, low–high
  note: string;
}

// Per-night ESTIMATES for the whole group, derived from the cost-of-living index
// (base 100 = NYC). Not live prices — the deep-link buttons open the real site.
export function lodgingEstimates(
  dest: Destination,
  opts: { travelers: number; pool: boolean }
): LodgingEstimate[] {
  const k = dest.costIndex / 100;
  const t = Math.max(1, opts.travelers);
  const poolBump = opts.pool ? 1.18 : 1;
  const sizeFactor = 1 + 0.12 * Math.max(0, t - 2);
  const r5 = (n: number) => Math.max(5, Math.round((n * k) / 5) * 5);

  return [
    {
      key: "hostel",
      label: "Auberge / hostel",
      icon: "🛏️",
      perNight: [r5(13 * t), r5(26 * t)],
      note: "Lit en dortoir ou chambre privée. Idéal petit budget & solo.",
    },
    {
      key: "appartement",
      label: "Appartement / Airbnb",
      icon: "🏠",
      perNight: [r5(55 * sizeFactor * poolBump), r5(120 * sizeFactor * poolBump)],
      note: "Cuisine, plus d'espace. Le meilleur rapport pour 3+ ou séjours longs.",
    },
    {
      key: "hotel",
      label: "Hôtel",
      icon: "🏨",
      perNight: [r5(70 * sizeFactor * poolBump), r5(160 * sizeFactor * poolBump)],
      note: "Service quotidien, petit-déj. Confort sans gestion.",
    },
    {
      key: "resort",
      label: "Hôtel confort / resort",
      icon: "🌴",
      perNight: [r5(150 * sizeFactor * poolBump), r5(330 * sizeFactor * poolBump)],
      note: "Standing, piscine, vue. Pour se faire plaisir.",
    },
  ];
}
