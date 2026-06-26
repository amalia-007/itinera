import { searchAirports } from "@/data/airports";
// Re-export AirportResult type via API — clients receive the full object including isCountryHub

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json([]);
  return Response.json(searchAirports(q, 8));
}
