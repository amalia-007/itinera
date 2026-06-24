import type {
  Destination,
  Filters,
  GeoPoint,
  RankedDestination,
  TouristicWish,
  Vibe,
} from "./types";
import { estimateFlight } from "./flights";
import { monthlyTemp, weatherCategory, weatherMatch } from "./climate";
import { dailyBudget, costRatio } from "./costOfLiving";
import { monthName } from "./format";

const TOURISTIC_TARGET: Record<Exclude<TouristicWish, "peu_importe">, number> = {
  calme: 1.5,
  equilibre: 3,
  anime: 4.5,
};

function touristicMatch(wish: TouristicWish | undefined, level: number): number {
  if (!wish || wish === "peu_importe") return 0.6;
  const target = TOURISTIC_TARGET[wish];
  return Math.max(0, 1 - Math.abs(target - level) / 3);
}

function vibeMatch(wanted: Vibe[] | undefined, has: Vibe[]): number {
  if (!wanted || wanted.length === 0) return 0.6;
  const hits = wanted.filter((v) => has.includes(v)).length;
  return hits / wanted.length;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Rank candidate destinations against the traveller's filters.
 * Returns the full scored list (the UI can re-sort by price or cost of living).
 */
export function rankDestinations(
  origin: GeoPoint,
  candidates: Destination[],
  filters: Filters,
  originCostIndex?: number
): RankedDestination[] {
  const month = filters.month;

  const ranked = candidates.map<RankedDestination>((dest) => {
    const flight = estimateFlight(origin, dest, month);
    const tempC = monthlyTemp(dest, month ?? 7);
    const wMatch = weatherMatch(filters.weather, tempC);
    const tMatch = touristicMatch(filters.touristic, dest.touristic);
    const vMatch = vibeMatch(filters.vibes, dest.vibes);
    const cost = dailyBudget(dest);

    let score = 0;
    score += wMatch * 30;
    score += vMatch * 25;
    score += tMatch * 15;

    // Flight budget: full marks within budget, decaying penalty above it.
    if (!filters.budgetMax) {
      score += 12;
    } else if (flight.roundTrip <= filters.budgetMax) {
      score += 20;
    } else {
      const over = flight.roundTrip - filters.budgetMax;
      score += Math.max(0, 20 - over / 20);
    }

    // Mild bias toward affordable destinations (cheaper cost of living).
    score += clamp(10 - dest.costIndex / 14, 0, 10);

    const reasons = buildReasons(dest, filters, tempC, wMatch, vMatch, flight.roundTrip);

    return {
      destination: dest,
      flight,
      weatherTempC: tempC,
      weatherCategory: weatherCategory(tempC),
      weatherMatch: wMatch,
      costPerDay: cost,
      costVsOrigin: costRatio(dest, originCostIndex),
      score: Math.round(clamp(score, 0, 100)),
      reasons,
    };
  });

  // Drop destinations far over budget so the list stays relevant.
  const filtered = filters.budgetMax
    ? ranked.filter((r) => r.flight.roundTrip <= filters.budgetMax! * 1.6)
    : ranked;

  return filtered.sort((a, b) => b.score - a.score);
}

function buildReasons(
  dest: Destination,
  filters: Filters,
  tempC: number,
  wMatch: number,
  vMatch: number,
  roundTrip: number
): string[] {
  const reasons: string[] = [];
  const month = filters.month;

  if (wMatch >= 0.85 && month) {
    reasons.push(`${tempC}°C en ${monthName(month)} — pile la météo voulue`);
  } else if (month) {
    reasons.push(`${tempC}°C attendus en ${monthName(month)}`);
  }

  if (filters.vibes && filters.vibes.length && vMatch >= 0.5) {
    const matched = filters.vibes.filter((v) => dest.vibes.includes(v));
    if (matched.length) reasons.push(`Idéal pour : ${matched.join(", ")}`);
  }

  if (filters.budgetMax && roundTrip <= filters.budgetMax) {
    reasons.push(`Vol estimé dans le budget`);
  }

  if (dest.costIndex <= 45) {
    reasons.push(`Coût de la vie très abordable`);
  }

  if (month && dest.bestMonths.includes(month)) {
    reasons.push(`${monthName(month)} est l'un des meilleurs mois pour y aller`);
  }

  return reasons.slice(0, 4);
}
