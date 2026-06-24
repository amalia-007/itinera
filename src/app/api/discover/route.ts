import type { DiscoverRequest, DiscoverResponse } from "@/lib/types";
import { geocodeCity } from "@/lib/geocode";
import { DESTINATIONS, findDestinationByName } from "@/data/destinations";
import { rankDestinations } from "@/lib/scoring";
import { suggestStops } from "@/lib/stops";
import { countryCostIndex } from "@/lib/costOfLiving";

// POST /api/discover — the discovery core. Geocodes the departure city, then
// ranks the catalogue against the traveller's filters. If an arrival city is
// given, also suggests stop-over options along the corridor.
export async function POST(request: Request): Promise<Response> {
  let body: DiscoverRequest;
  try {
    body = (await request.json()) as DiscoverRequest;
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const originQuery = (body.originQuery ?? "").trim();
  if (!originQuery) {
    return Response.json(
      { error: "Indiquez une ville de départ." },
      { status: 400 }
    );
  }

  // Geocode departure (and arrival, if given) in parallel — saves a round-trip.
  const destQuery = (body.destinationQuery ?? "").trim();
  const [origin, destination] = await Promise.all([
    geocodeCity(originQuery),
    destQuery ? geocodeCity(destQuery) : Promise.resolve(null),
  ]);

  if (!origin) {
    return Response.json(
      { error: `Ville de départ introuvable : « ${originQuery} ».` },
      { status: 404 }
    );
  }

  const filters = body.filters ?? {};

  // Resolve the departure city's own cost-of-living index for comparison.
  const knownOrigin =
    findDestinationByName(origin.name) ?? findDestinationByName(originQuery);
  const originCostIndex = knownOrigin?.costIndex ?? countryCostIndex(origin.cc);

  // Don't propose the departure city itself as a destination.
  const candidates = DESTINATIONS.filter(
    (d) => d.city.toLowerCase() !== origin.name.toLowerCase()
  );

  const results = rankDestinations(
    origin,
    candidates,
    filters,
    originCostIndex
  ).slice(0, 24);

  // Arrival given → stop-over suggestion mode.
  let stops: DiscoverResponse["stops"];
  if (destination) {
    stops = suggestStops(
      origin,
      destination,
      DESTINATIONS,
      filters,
      body.stops ?? 1,
      originCostIndex
    );
  }

  const response: DiscoverResponse = {
    origin,
    originCostIndex,
    results,
    stops,
    generatedAt: new Date().toISOString(),
  };
  return Response.json(response);
}
