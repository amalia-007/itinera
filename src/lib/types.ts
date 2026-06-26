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

export type TripType = "aller-retour" | "aller-simple";
export type MonthPart = "debut" | "milieu" | "fin";

export interface Filters {
  month?: number; // 1-12
  monthPart?: MonthPart;
  tripType?: TripType;
  budgetMax?: number; // budget vol max / personne, EUR (A/R ou aller simple selon tripType)
  weather?: WeatherWish[]; // multi-select
  touristic?: TouristicWish;
  vibes?: Vibe[];
  travelers?: number;
  dateStart?: string;
  dateEnd?: string;
}

export interface GeoPoint {
  name: string;
  country?: string;
  cc?: string;
  lat: number;
  lon: number;
}

// Airport from real IATA database
export interface Airport {
  iata: string;
  name: string; // full airport name
  city: string;
  country: string;
  lat: number;
  lon: number;
}

// One stopover séjour chosen by the user
export interface StopoverSejour {
  airport?: Airport; // undefined = Itinera suggère
  durationNights: number;
}

export interface FlightEstimate {
  roundTrip: number; // EUR / personne
  oneWay: number;
  distanceKm: number;
  level: "estimation";
  bestTimeToBuy: string;
  cheapestMonths: number[];
}

export interface DailyBudget {
  budget: number; // routard, EUR/jour hors vol
  mid: number; // confort moyen
  comfort: number; // confort
}

export interface RankedDestination {
  destination: Destination;
  flight: FlightEstimate;
  weatherTempC: number;
  weatherCategory: WeatherWish;
  weatherMatch: number; // 0-1
  costPerDay: DailyBudget;
  costVsOrigin?: number;
  score: number; // 0-100
  reasons: string[];
  detour?: number;
}

export interface StopSuggestions {
  destination: GeoPoint;
  directDistanceKm: number;
  requested: number;
  candidates: RankedDestination[];
}

// One leg of a multi-stop itinerary
export interface FlightLeg {
  fromName: string;
  toName: string;
  distanceKm: number;
  price: number; // per person, one-way
}

// A complete itinerary when stopover séjours have empty city slots
export interface ItineraryCombination {
  id: string;
  stopovers: Array<{ airport: Airport; durationNights: number }>;
  legs: FlightLeg[];
  totalOneWayPrice: number; // all legs one-way, per person
  totalRoundTripPrice: number; // includes return leg, per person
}

export interface DiscoverRequest {
  originQuery: string;
  originAirport?: Airport;
  destinationQuery?: string;
  destinationAirport?: Airport;
  stopoversSejour?: StopoverSejour[];
  stops?: number; // legacy field
  filters: Filters;
}

export interface DiscoverResponse {
  origin: GeoPoint;
  originCostIndex?: number;
  results: RankedDestination[];
  stops?: StopSuggestions;
  combinations?: ItineraryCombination[]; // when stopovers have empty slots
  generatedAt: string;
}
