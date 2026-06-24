import type { Vibe, WeatherWish } from "./types";

export const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function monthName(month?: number): string {
  if (!month) return "";
  return MONTHS_FR[(((month - 1) % 12) + 12) % 12];
}

export function euro(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export const WEATHER_LABELS: Record<WeatherWish, string> = {
  chaud: "Chaud (≥ 29°C)",
  doux: "Doux (23-28°C)",
  tempere: "Tempéré (16-22°C)",
  frais: "Frais (8-15°C)",
  froid: "Froid (< 8°C)",
  peu_importe: "Peu importe",
};

export const VIBE_LABELS: Record<Vibe, string> = {
  plage: "Plage",
  culture: "Culture",
  nature: "Nature",
  fête: "Fête",
  gastronomie: "Gastronomie",
  aventure: "Aventure",
  romantique: "Romantique",
  ski: "Ski",
  farniente: "Farniente",
  citytrip: "City-trip",
};

export const VIBE_EMOJI: Record<Vibe, string> = {
  plage: "🏖️",
  culture: "🏛️",
  nature: "🌿",
  fête: "🎉",
  gastronomie: "🍽️",
  aventure: "🧭",
  romantique: "💕",
  ski: "🎿",
  farniente: "🌴",
  citytrip: "🏙️",
};
