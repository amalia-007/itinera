// Real, functional deep links into the booking/activity platforms, pre-filtered
// with the traveller's parameters. This is the honest way to be useful without
// their (paid / ToS-restricted) APIs: we show price ESTIMATES, and the button
// opens the real site where the live price lives.

export function bookingUrl(
  city: string,
  opts: { adults?: number; pets?: boolean } = {}
): string {
  const p = new URLSearchParams({
    ss: city,
    group_adults: String(opts.adults ?? 2),
    no_rooms: "1",
    group_children: "0",
  });
  if (opts.pets) p.set("nflt", "hotelfacility=4"); // "Pets allowed" facility filter
  return `https://www.booking.com/searchresults.html?${p.toString()}`;
}

export function airbnbUrl(city: string, opts: { adults?: number } = {}): string {
  const p = new URLSearchParams({ adults: String(opts.adults ?? 2) });
  return `https://www.airbnb.com/s/${encodeURIComponent(city)}/homes?${p.toString()}`;
}

export function hostelworldUrl(city: string): string {
  return `https://www.hostelworld.com/search?search_keywords=${encodeURIComponent(
    city
  )}`;
}

export function petSittingUrl(city: string): string {
  // Pet-sitting (free stays in exchange for caring for pets).
  return `https://www.trustedhousesitters.com/house-and-pet-sitting-assignments/?location=${encodeURIComponent(
    city
  )}`;
}

export function getYourGuideUrl(query: string): string {
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(query)}`;
}

export function viatorUrl(query: string): string {
  return `https://www.viator.com/search/${encodeURIComponent(query)}`;
}

export function googleThingsToDo(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function googleFlightsUrl(from: string, to: string): string {
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `vols ${from} ${to}`
  )}`;
}

// ─── Flight search deeplinks ─────────────────────────────────────────────────

export interface FlightRoute {
  originIata: string;
  destinationIata: string;
  stopovers?: string[]; // IATA codes of stopover airports (in order)
  month?: number; // 1-12
  monthPart?: "debut" | "milieu" | "fin";
  travelers?: number;
  tripType?: "aller-retour" | "aller-simple";
}

function routeDate(month: number, part?: "debut" | "milieu" | "fin"): Date {
  const day = part === "milieu" ? 14 : part === "fin" ? 24 : 3;
  const now = new Date();
  const d = new Date(now.getFullYear(), month - 1, day);
  // If that date is in the past, shift to next year
  if (d < now) d.setFullYear(d.getFullYear() + 1);
  return d;
}

function skyscannerDate(d: Date): string {
  // YYMMDD
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

/** Skyscanner — simple A→B or A→B with multi-city legs */
export function skyscannerUrl(route: FlightRoute): string {
  const { originIata, destinationIata, stopovers = [], month, monthPart, travelers = 1, tripType } = route;
  const base = "https://www.skyscanner.fr/transport/vols";
  const from = originIata.toLowerCase();
  const to = destinationIata.toLowerCase();
  const adults = `?adults=${travelers}`;

  if (stopovers.length === 0) {
    if (!month) {
      return `${base}/${from}/${to}/${adults}`;
    }
    const outDate = skyscannerDate(routeDate(month, monthPart));
    if (tripType === "aller-simple") {
      return `${base}/${from}/${to}/${outDate}/${adults}`;
    }
    // Round trip — return ~3 weeks later
    const ret = routeDate(month, monthPart);
    ret.setDate(ret.getDate() + 21);
    return `${base}/${from}/${to}/${outDate}/${skyscannerDate(ret)}/${adults}`;
  }

  // Multi-city via Skyscanner multi-destination
  // Format: /transport/vols-multidestinations/?segments=FROTODYYMMDD|FROTODYYMMDD&adults=N
  const allLegs = [originIata, ...stopovers, destinationIata];
  const outDate = month ? routeDate(month, monthPart) : new Date();
  const segments = allLegs.slice(0, -1).map((iata, i) => {
    const leg = new Date(outDate);
    leg.setDate(leg.getDate() + i * 7); // rough spacing of 7 days per leg
    return `${iata}${allLegs[i + 1]}${skyscannerDate(leg)}`;
  });
  return `https://www.skyscanner.fr/transport/vols-multidestinations/?segments=${segments.join("|")}&adults=${travelers}`;
}

/** Google Flights — works for simple and multi-city via text query */
export function googleFlightsDeepUrl(route: FlightRoute): string {
  const { originIata, destinationIata, stopovers = [], travelers = 1 } = route;
  const all = [originIata, ...stopovers, destinationIata].join(" → ");
  const q = encodeURIComponent(`vols ${all} ${travelers} voyageur${travelers > 1 ? "s" : ""}`);
  return `https://www.google.com/travel/flights?hl=fr&gl=FR&q=${q}`;
}

/** Kiwi.com — good for complex multi-city routes */
export function kiwiUrl(route: FlightRoute): string {
  const { originIata, destinationIata, stopovers = [], travelers = 1, month, monthPart } = route;
  const allLegs = [originIata, ...stopovers, destinationIata];
  const outDate = month ? routeDate(month, monthPart) : null;
  const dateStr = outDate ? `${outDate.getDate().toString().padStart(2, "0")}%2F${(outDate.getMonth() + 1).toString().padStart(2, "0")}%2F${outDate.getFullYear()}` : "";
  const legs = allLegs.slice(0, -1).map((f, i) =>
    `flyFrom=${f}&to=${allLegs[i + 1]}`
  ).join("&");
  return `https://www.kiwi.com/fr/search#results?${legs}&adults=${travelers}${dateStr ? `&dateFrom=${dateStr}` : ""}`;
}
