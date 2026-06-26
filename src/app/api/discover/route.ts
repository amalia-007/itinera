import type {
  Airport,
  DiscoverRequest,
  DiscoverResponse,
  FlightLeg,
  GeoPoint,
  ItineraryCombination,
  StopoverSejour,
} from "@/lib/types";
import { geocodeCity } from "@/lib/geocode";
import { DESTINATIONS, findDestinationByName } from "@/data/destinations";
import { rankDestinations } from "@/lib/scoring";
import { suggestStops } from "@/lib/stops";
import { countryCostIndex } from "@/lib/costOfLiving";
import { haversineKm } from "@/lib/geo";
import { estimateFlightAtoB } from "@/lib/flights";

export async function POST(request: Request): Promise<Response> {
  let body: DiscoverRequest;
  try {
    body = (await request.json()) as DiscoverRequest;
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const originQuery = (body.originQuery ?? "").trim();
  if (!originQuery) {
    return Response.json({ error: "Indiquez une ville de départ." }, { status: 400 });
  }

  // Use airport coords if provided, otherwise geocode
  const originGeo: GeoPoint | null = body.originAirport
    ? {
        name: body.originAirport.city,
        country: body.originAirport.country,
        lat: body.originAirport.lat,
        lon: body.originAirport.lon,
      }
    : await geocodeCity(originQuery);

  if (!originGeo) {
    return Response.json(
      { error: `Ville de départ introuvable : « ${originQuery} ».` },
      { status: 404 }
    );
  }

  const destQuery = (body.destinationQuery ?? "").trim();
  const destGeo: GeoPoint | null = body.destinationAirport
    ? {
        name: body.destinationAirport.city,
        country: body.destinationAirport.country,
        lat: body.destinationAirport.lat,
        lon: body.destinationAirport.lon,
      }
    : destQuery
    ? await geocodeCity(destQuery)
    : null;

  const filters = body.filters ?? {};

  const knownOrigin =
    findDestinationByName(originGeo.name) ?? findDestinationByName(originQuery);
  const originCostIndex = knownOrigin?.costIndex ?? countryCostIndex(originGeo.cc);

  const candidates = DESTINATIONS.filter(
    (d) => d.city.toLowerCase() !== originGeo.name.toLowerCase()
  );

  const results = rankDestinations(
    originGeo,
    candidates,
    filters,
    originCostIndex
  ).slice(0, 24);

  let stops: DiscoverResponse["stops"];
  let combinations: DiscoverResponse["combinations"];

  if (destGeo) {
    const stopoversSejour = body.stopoversSejour ?? [];

    if (stopoversSejour.length === 0) {
      // No stopovers: legacy stop suggestion mode (repurposed as "best route cities")
      stops = suggestStops(
        originGeo,
        destGeo,
        DESTINATIONS,
        filters,
        1,
        originCostIndex
      );
    } else {
      // Stopover séjours mode
      const hasEmptySlots = stopoversSejour.some((s) => !s.airport);

      if (hasEmptySlots) {
        combinations = buildCombinations(
          originGeo,
          destGeo,
          stopoversSejour,
          filters.month
        );
      }
      // (if all slots have airports, prices are shown on the result cards)
    }
  }

  const response: DiscoverResponse = {
    origin: originGeo,
    originCostIndex,
    results,
    stops,
    combinations,
    generatedAt: new Date().toISOString(),
  };
  return Response.json(response);
}

// Build all possible itinerary combinations for empty stopover slots.
// For each empty slot we pick the 5 geographically best candidates;
// filled slots use the chosen airport directly.
function buildCombinations(
  origin: GeoPoint,
  destination: GeoPoint,
  stopovers: StopoverSejour[],
  month?: number
): ItineraryCombination[] {
  const n = stopovers.length;
  const direct = haversineKm(origin, destination);

  // For each slot: either a fixed airport, or 5 candidates
  const slots: Airport[][] = stopovers.map((stop, slotIndex) => {
    if (stop.airport) return [stop.airport];

    // Geographic progress range for this slot: divide journey evenly
    const progMin = slotIndex / n - 0.15;
    const progMax = (slotIndex + 1) / n + 0.15;

    const candidates = DESTINATIONS.map((d) => {
      const leg1 = haversineKm(origin, d);
      const progress = leg1 / direct;
      return { d, progress };
    })
      .filter(
        (x) =>
          x.progress >= Math.max(0.05, progMin) &&
          x.progress <= Math.min(0.95, progMax) &&
          haversineKm(x.d, origin) > 100 &&
          haversineKm(x.d, destination) > 100
      )
      .sort((a, b) => {
        // Prefer low detour
        const detourA =
          (haversineKm(origin, a.d) + haversineKm(a.d, destination)) / direct;
        const detourB =
          (haversineKm(origin, b.d) + haversineKm(b.d, destination)) / direct;
        return detourA - detourB;
      })
      .slice(0, 5)
      .map(
        (x): Airport => ({
          iata: x.d.cc + "-" + x.d.city.slice(0, 3).toUpperCase(),
          name: x.d.city,
          city: x.d.city,
          country: x.d.country,
          lat: x.d.lat,
          lon: x.d.lon,
        })
      );

    return candidates;
  });

  // Cartesian product of slots
  const combos = cartesian(slots);

  const result: ItineraryCombination[] = combos.map((combo, idx) => {
    // Build waypoints: origin → stop1 → stop2 → ... → destination
    const waypoints: Array<{ name: string; lat: number; lon: number }> = [
      { name: origin.name, lat: origin.lat, lon: origin.lon },
      ...combo.map((a) => ({ name: a.city, lat: a.lat, lon: a.lon })),
      { name: destination.name, lat: destination.lat, lon: destination.lon },
    ];

    const legs: FlightLeg[] = [];
    let totalOneWay = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      const est = estimateFlightAtoB(from, to, month);
      legs.push({
        fromName: from.name,
        toName: to.name,
        distanceKm: est.distanceKm,
        price: est.oneWay,
      });
      totalOneWay += est.oneWay;
    }

    // Return leg: destination → origin
    const returnEst = estimateFlightAtoB(
      { lat: destination.lat, lon: destination.lon },
      { lat: origin.lat, lon: origin.lon },
      month
    );

    return {
      id: `combo-${idx}`,
      stopovers: combo.map((airport, si) => ({
        airport,
        durationNights: stopovers[si].durationNights,
      })),
      legs,
      totalOneWayPrice: totalOneWay,
      totalRoundTripPrice: totalOneWay + returnEst.oneWay,
    };
  });

  // Sort by one-way total price
  result.sort((a, b) => a.totalOneWayPrice - b.totalOneWayPrice);

  // Cap at 50 combos to keep response size sane
  return result.slice(0, 50);
}

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]]
  );
}
