import type { DiscoverRequest, DiscoverResponse } from "./types";

export async function discover(
  req: DiscoverRequest
): Promise<DiscoverResponse> {
  const res = await fetch("/api/discover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Erreur lors de la recherche.");
  }
  return res.json();
}
