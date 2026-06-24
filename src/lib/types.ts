// Shared domain types for Itinera — the trip discovery core.
// Everything here is framework-agnostic (no Next.js imports) so it can run
// on the server (route handlers) or be unit-tested in isolation.

export type Region =
  | "Europe"
  | "Asie"
  | "Amérique du Nord"
  | "Amérique latine"
  | "Afrique"
  | "Océanie"
  | "Moyen-Orient";

export type Vibe =
  | "plage"
  | "culture"
  | "nature"
  | "fête"
  | "gastronomie"
  | "aventure"
  | "romantique"
  | "ski"
  | "farniente"
  | "citytrip";

export type ClimateArchetype =
  | "tropical"
  | "mousson"
  | "mediterraneen"
  | "desertique"
  | "oceanique"
  | "continental"
  | "subtropical"
  | "alpin";

export type Hemisphere = "N" | "S";

export interface Destination {
  id: string;
  city: string;
  country: string;
  cc: string; // ISO 3166-1 alpha-2
  lat: number;
  lon: number;
  region: Region;
  archetype: ClimateArchetype;
  hemisphere: Hemisphere;
  tempOffset?: number; // °C correction vs the archetype baseline
  costIndex: number; // cost-of-living index, base 100 = New York
  currency: string;
  vibes: Vibe[];
  touristic: 1 | 2 | 3 | 4 | 5; // 1 = hors des sentiers battus, 5 = très touristique
  bestMonths: number[]; // 1-12, meilleurs mois météo
  blurb: string;
}

export type WeatherWish =
  | "chaud"
  | "doux"
  | "tempere"
  | "frais"
  | "froid"
  | "peu_importe";

export type TouristicWish = "calme" | "equilibre" | "anime" | "peu_importe";

export interface Filters {
  month?: number; // 1-12, mois de voyage envisagé
  dateStart?: string; // ISO (optionnel)
  dateEnd?: string;
  budgetMax?: number; // budget vol max aller-retour / personne, EUR
  weather?: WeatherWish;
  touristic?: TouristicWish;
  vibes?: Vibe[];
  travelers?: number;
}

export interface GeoPoint {
  name: string;
  country?: string;
  cc?: string;
  lat: number;
  lon: number;
}

export interface FlightEstimate {
  roundTrip: number; // EUR / personne
  oneWay: number;
  distanceKm: number;
  level: "estimation"; // marqueur d'honnêteté : ce n'est pas un tarif live
  bestTimeToBuy: string; // conseil d'achat
  cheapestMonths: number[]; // mois les moins chers pour voler
}

export interface DailyBudget {
  budget: number; // routard, EUR/jour hors vol
  mid: number; // confort moyen
  comfort: number; // confort
}

export interface RankedDestination {
  destination: Destination;
  flight: FlightEstimate;
  weatherTempC: number; // température attendue au mois de voyage
  weatherCategory: WeatherWish;
  weatherMatch: number; // 0-1
  costPerDay: DailyBudget;
  costVsOrigin?: number; // ratio coût de la vie destination / départ (si départ connu)
  score: number; // pertinence globale 0-100
  reasons: string[]; // pourquoi ça matche
  detour?: number; // ratio de détour si proposé comme escale (1 = pile sur la route)
}

export interface StopSuggestions {
  destination: GeoPoint;
  directDistanceKm: number;
  requested: number; // nombre d'escales souhaitées
  candidates: RankedDestination[];
}

export interface DiscoverRequest {
  originQuery: string;
  destinationQuery?: string;
  stops?: number;
  filters: Filters;
}

export interface DiscoverResponse {
  origin: GeoPoint;
  originCostIndex?: number;
  results: RankedDestination[];
  stops?: StopSuggestions;
  generatedAt: string;
}
