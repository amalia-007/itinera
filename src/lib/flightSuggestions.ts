import type { Airport } from "./types";
import { haversineKm } from "./geo";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Airline {
  iata: string;
  name: string;
  type: "budget" | "standard" | "haut-de-gamme";
  priceMultiplier: number;
  logo: string;
  maxRangeKm?: number; // low-cost only: excluded above this distance
}

export interface FlightLeg {
  from: string; // IATA
  to: string;
  fromCity: string;
  toCity: string;
  durationMin: number;
  direct: boolean;
  via?: string; // hub name if indirect
}

export interface FlightOption {
  id: string;
  airline: Airline;
  legs: FlightLeg[];
  totalDurationMin: number;
  pricePerPerson: number; // EUR, estimated
  totalPrice: number; // × travelers
  direct: boolean;
  bookingUrl: string;
}

// ─── Airline database ────────────────────────────────────────────────────────

// "haut-de-gamme" = réputées pour le service (repas, espace, ponctualité)
// "standard"      = compagnies classiques
// "budget"        = low-cost, court/moyen-courrier uniquement (< 3 500 km)
const AIRLINES: Record<string, Airline & { maxRangeKm?: number }> = {
  QR: { iata: "QR", name: "Qatar Airways",       type: "haut-de-gamme", priceMultiplier: 1.00, logo: "🇶🇦" },
  EK: { iata: "EK", name: "Emirates",            type: "haut-de-gamme", priceMultiplier: 1.05, logo: "🇦🇪" },
  EY: { iata: "EY", name: "Etihad Airways",      type: "haut-de-gamme", priceMultiplier: 0.97, logo: "🇦🇪" },
  TK: { iata: "TK", name: "Turkish Airlines",    type: "standard",      priceMultiplier: 0.82, logo: "🇹🇷" },
  AF: { iata: "AF", name: "Air France",          type: "standard",      priceMultiplier: 0.95, logo: "🇫🇷" },
  LH: { iata: "LH", name: "Lufthansa",           type: "standard",      priceMultiplier: 0.98, logo: "🇩🇪" },
  BA: { iata: "BA", name: "British Airways",     type: "standard",      priceMultiplier: 0.98, logo: "🇬🇧" },
  SN: { iata: "SN", name: "Brussels Airlines",   type: "standard",      priceMultiplier: 0.90, logo: "🇧🇪" },
  IB: { iata: "IB", name: "Iberia",              type: "standard",      priceMultiplier: 0.88, logo: "🇪🇸" },
  TP: { iata: "TP", name: "TAP Air Portugal",    type: "standard",      priceMultiplier: 0.85, logo: "🇵🇹" },
  SQ: { iata: "SQ", name: "Singapore Airlines",  type: "haut-de-gamme", priceMultiplier: 1.08, logo: "🇸🇬" },
  CX: { iata: "CX", name: "Cathay Pacific",      type: "haut-de-gamme", priceMultiplier: 1.02, logo: "🇭🇰" },
  TG: { iata: "TG", name: "Thai Airways",        type: "standard",      priceMultiplier: 0.88, logo: "🇹🇭" },
  QF: { iata: "QF", name: "Qantas",              type: "haut-de-gamme", priceMultiplier: 1.05, logo: "🇦🇺" },
  ET: { iata: "ET", name: "Ethiopian Airlines",  type: "standard",      priceMultiplier: 0.80, logo: "🇪🇹" },
  AT: { iata: "AT", name: "Royal Air Maroc",     type: "standard",      priceMultiplier: 0.75, logo: "🇲🇦" },
  KQ: { iata: "KQ", name: "Kenya Airways",       type: "standard",      priceMultiplier: 0.82, logo: "🇰🇪" },
  AC: { iata: "AC", name: "Air Canada",          type: "standard",      priceMultiplier: 0.95, logo: "🇨🇦" },
  DL: { iata: "DL", name: "Delta Air Lines",     type: "standard",      priceMultiplier: 0.98, logo: "🇺🇸" },
  AA: { iata: "AA", name: "American Airlines",   type: "standard",      priceMultiplier: 0.96, logo: "🇺🇸" },
  UA: { iata: "UA", name: "United Airlines",     type: "standard",      priceMultiplier: 0.95, logo: "🇺🇸" },
  LA: { iata: "LA", name: "LATAM Airlines",      type: "standard",      priceMultiplier: 0.88, logo: "🌎" },
  MH: { iata: "MH", name: "Malaysia Airlines",  type: "standard",      priceMultiplier: 0.87, logo: "🇲🇾" },
  GA: { iata: "GA", name: "Garuda Indonesia",    type: "standard",      priceMultiplier: 0.85, logo: "🇮🇩" },
  AI: { iata: "AI", name: "Air India",           type: "standard",      priceMultiplier: 0.78, logo: "🇮🇳" },
  RJ: { iata: "RJ", name: "Royal Jordanian",     type: "standard",      priceMultiplier: 0.82, logo: "🇯🇴" },
  // Low-cost : court/moyen-courrier seulement (maxRangeKm)
  FR: { iata: "FR", name: "Ryanair",    type: "budget", priceMultiplier: 0.52, logo: "🟡", maxRangeKm: 3500 },
  U2: { iata: "U2", name: "easyJet",   type: "budget", priceMultiplier: 0.57, logo: "🟠", maxRangeKm: 3500 },
  VY: { iata: "VY", name: "Vueling",   type: "budget", priceMultiplier: 0.62, logo: "🟡", maxRangeKm: 3500 },
  HV: { iata: "HV", name: "Transavia", type: "budget", priceMultiplier: 0.65, logo: "🟢", maxRangeKm: 3500 },
  W6: { iata: "W6", name: "Wizz Air",  type: "budget", priceMultiplier: 0.55, logo: "💜", maxRangeKm: 3500 },
  G3: { iata: "G3", name: "Gol",       type: "budget", priceMultiplier: 0.75, logo: "🇧🇷", maxRangeKm: 5000 },
};

// ─── Region detection ─────────────────────────────────────────────────────────

type Region =
  | "europe"
  | "middle-east"
  | "africa"
  | "south-asia"
  | "east-asia"
  | "oceania"
  | "north-america"
  | "central-america"
  | "south-america";

function getRegion(lat: number, lon: number): Region {
  if (lat > 35 && lat < 72 && lon > -12 && lon < 45) return "europe";
  if (lat > 12 && lat < 40 && lon > 30 && lon < 65) return "middle-east";
  if (lat > -35 && lat < 38 && lon > -20 && lon < 55) return "africa";
  if (lat > 5 && lat < 38 && lon > 60 && lon < 92) return "south-asia";
  if (lat > -12 && lat < 55 && lon > 92 && lon < 155) return "east-asia";
  if (lat > -50 && lat < 0 && lon > 100 && lon < 180) return "oceania";
  if (lat > 15 && lat < 80 && lon > -170 && lon < -55) return "north-america";
  if (lat > 7 && lat < 22 && lon > -95 && lon < -55) return "central-america";
  if (lat > -60 && lat < 12 && lon > -85 && lon < -35) return "south-america";
  return "europe";
}

// Airlines to suggest per route pair
function pickAirlines(fromRegion: Region, toRegion: Region): string[] {
  const pair = [fromRegion, toRegion].sort().join("|") as string;
  const map: Record<string, string[]> = {
    "europe|europe":             ["FR", "U2", "VY", "HV", "W6", "LH", "AF"],
    "europe|middle-east":        ["EK", "QR", "EY", "TK", "RJ", "AF"],
    "europe|africa":             ["ET", "AT", "KQ", "TK", "AF", "SN"],
    "europe|south-asia":         ["QR", "EK", "TK", "AI", "LH", "AF"],
    "europe|east-asia":          ["QR", "EK", "TK", "SQ", "CX", "AF", "TG"],
    "europe|oceania":            ["QR", "EK", "SQ", "QF", "CX", "TK"],
    "europe|north-america":      ["AF", "BA", "LH", "IB", "TP", "AC", "DL", "AA", "UA"],
    "europe|central-america":    ["AF", "IB", "TP", "TK", "AC"],
    "europe|south-america":      ["AF", "IB", "TP", "LA", "TK"],
    "middle-east|east-asia":     ["EK", "QR", "EY", "SQ", "CX"],
    "middle-east|oceania":       ["EK", "QR", "EY", "QF", "SQ"],
    "middle-east|africa":        ["ET", "QR", "EK", "TK", "KQ"],
    "east-asia|oceania":         ["QF", "SQ", "CX", "GA", "MH"],
    "africa|middle-east":        ["ET", "QR", "EK", "TK", "KQ"],
    "north-america|south-america": ["LA", "AA", "DL", "UA", "G3"],
  };
  const result = map[pair] ?? ["QR", "EK", "TK", "AF", "LH"];
  return result;
}

// ─── Duration calculation ─────────────────────────────────────────────────────

function flightDurationMin(distKm: number, direct: boolean): number {
  const cruiseMin = (distKm / 850) * 60;
  const overhead = 90; // boarding + taxi
  const connection = direct ? 0 : 160; // connection time if indirect
  return Math.round((cruiseMin + overhead + connection) / 15) * 15;
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

// ─── Price estimate ───────────────────────────────────────────────────────────

function basePriceEur(distKm: number, month?: number): number {
  const safe = Math.max(distKm, 80);
  // Calibrated on real economy market prices (one-way equivalent)
  const raw = (35 + 0.092 * Math.pow(safe, 0.94)) * 0.85;
  const seasonal = month && (month === 7 || month === 8 || month === 12) ? 1.10 : 1;
  return raw * seasonal;
}

// Deterministic variation seeded by airline+route
function priceVariation(seed: string): number {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return 0.95 + (h % 11) / 100; // ±5%
}

// ─── Booking URLs ─────────────────────────────────────────────────────────────

function buildDate(month?: number, monthPart?: "debut" | "milieu" | "fin"): string {
  if (!month) return "";
  const day = monthPart === "milieu" ? 14 : monthPart === "fin" ? 24 : 3;
  const now = new Date();
  const d = new Date(now.getFullYear(), month - 1, day);
  if (d < now) d.setFullYear(d.getFullYear() + 1);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`; // YYMMDD for Skyscanner
}

function bookingUrl(
  airline: Airline,
  fromIata: string,
  toIata: string,
  adults: number,
  month?: number,
  monthPart?: "debut" | "milieu" | "fin",
  tripType?: "aller-retour" | "aller-simple"
): string {
  const date = buildDate(month, monthPart);
  const from = fromIata.toLowerCase();
  const to = toIata.toLowerCase();

  // Airline-specific deep links
  switch (airline.iata) {
    case "QR":
      return `https://www.qatarairways.com/en-fr/flights.html?widget=QASF&searchType=F&addTaxesToPrice=true&adults=${adults}&from=${fromIata}&to=${toIata}${date ? `&fromDate=20${date.slice(0,2)}-${date.slice(2,4)}-${date.slice(4,6)}` : ""}&cabinClass=E`;
    case "EK":
      return `https://www.emirates.com/fr/french/book/flights/?fromStation=${fromIata}&toStation=${toIata}&adult=${adults}&child=0&infant=0&cabinType=Y`;
    case "AF":
      return `https://www.airfrance.fr/search/results?pax.ADT=${adults}&cabin=ECONOMY&org0=${fromIata}&dst0=${toIata}`;
    case "LH":
      return `https://www.lufthansa.com/fr/fr/booking?flightType=${tripType === "aller-simple" ? "OW" : "RT"}&adults=${adults}&origin=${fromIata}&destination=${toIata}`;
    case "TK":
      return `https://www.turkishairlines.com/fr-fr/flights/?paxtype=ADULT&cabin=ECONOMY&pax=${adults}&orig=${fromIata}&dest=${toIata}`;
    case "BA":
      return `https://www.britishairways.com/travel/book/public/fr_fr?eId=140015&origin=${fromIata}&destination=${toIata}&outboundDate=${date}&numAdults=${adults}&cabin=M`;
    case "IB":
      return `https://www.iberia.com/fr/flights/?origin=${fromIata}&destination=${toIata}&adults=${adults}`;
    case "FR":
    case "U2":
    case "VY":
    case "HV":
    case "W6":
      // Budget airlines → Skyscanner (easier multi-route support)
      return date
        ? `https://www.skyscanner.fr/transport/vols/${from}/${to}/${date}/?adults=${adults}`
        : `https://www.skyscanner.fr/transport/vols/${from}/${to}/?adults=${adults}`;
    default:
      return date
        ? `https://www.skyscanner.fr/transport/vols/${from}/${to}/${date}/?adults=${adults}`
        : `https://www.skyscanner.fr/transport/vols/${from}/${to}/?adults=${adults}`;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface FlightSuggestionsInput {
  origin: Airport;
  destination: Airport;
  stopovers?: Airport[];
  month?: number;
  monthPart?: "debut" | "milieu" | "fin";
  travelers: number;
  tripType?: "aller-retour" | "aller-simple";
}

export function getFlightSuggestions(input: FlightSuggestionsInput): FlightOption[] {
  const { origin, destination, stopovers = [], month, monthPart, travelers, tripType } = input;
  const isOneWay = tripType === "aller-simple";

  // Build all waypoints: [origin, ...stopovers, destination]
  const waypoints = [origin, ...stopovers, destination];

  // Total distance of all legs
  let totalDistKm = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistKm += haversineKm(waypoints[i], waypoints[i + 1]);
  }

  const fromRegion = getRegion(origin.lat, origin.lon);
  const toRegion = getRegion(destination.lat, destination.lon);
  const airlineCodes = pickAirlines(fromRegion, toRegion).slice(0, 5);

  const options: FlightOption[] = airlineCodes.map((code) => {
    const airline = AIRLINES[code];
    // Exclude low-cost airlines from routes longer than their range
    if (!airline || (airline.maxRangeKm && totalDistKm > airline.maxRangeKm)) return null;

    const variation = priceVariation(code + origin.iata + destination.iata);
    const base = basePriceEur(totalDistKm, month);
    const perPersonOneWay = Math.round((base * airline.priceMultiplier * variation) / 5) * 5;
    const perPerson = isOneWay ? perPersonOneWay : Math.round(perPersonOneWay * 1.62 / 5) * 5;
    const isDirect = totalDistKm < 2500 || ["FR", "U2", "VY", "HV", "W6"].includes(code);
    const duration = flightDurationMin(totalDistKm, isDirect);

    const legs: FlightLeg[] = waypoints.slice(0, -1).map((wp, i) => {
      const next = waypoints[i + 1];
      const legDist = haversineKm(wp, next);
      return {
        from: wp.iata,
        to: next.iata,
        fromCity: wp.city,
        toCity: next.city,
        durationMin: flightDurationMin(legDist, isDirect),
        direct: isDirect,
        via: isDirect ? undefined : getHub(airline.iata),
      };
    });

    const url = bookingUrl(airline, origin.iata, destination.iata, travelers, month, monthPart, tripType);

    return {
      id: `${code}-${origin.iata}-${destination.iata}`,
      airline,
      legs,
      totalDurationMin: duration,
      pricePerPerson: perPerson,
      totalPrice: perPerson * travelers,
      direct: isDirect,
      bookingUrl: url,
    } as FlightOption;
  }).filter(Boolean) as FlightOption[];

  return options.sort((a, b) => a.pricePerPerson - b.pricePerPerson);
}

function getHub(iata: string): string {
  const hubs: Record<string, string> = {
    QR: "Doha", EK: "Dubaï", EY: "Abu Dhabi", TK: "Istanbul",
    AF: "Paris CDG", LH: "Francfort", BA: "Londres Heathrow",
    SQ: "Singapour", CX: "Hong Kong", QF: "Sydney", ET: "Addis-Abeba",
    AC: "Toronto", DL: "Atlanta", AA: "Dallas", UA: "Chicago",
  };
  return hubs[iata] ?? "hub intermédiaire";
}

export { formatDuration };
