import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DESTINATIONS } from "@/data/destinations";
import SejourView from "@/components/sejour/SejourView";

type RouteParams = Promise<{ id: string }>;
type RouteSearch = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { id } = await params;
  const d = DESTINATIONS.find((x) => x.id === id);
  return {
    title: d ? `${d.city} — préparer le séjour · Itinera` : "Itinera",
  };
}

export default async function SejourPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: RouteSearch;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const destination = DESTINATIONS.find((d) => d.id === id);
  if (!destination) notFound();

  const from = typeof sp.from === "string" ? sp.from : undefined;
  const month =
    typeof sp.month === "string" ? Number(sp.month) || undefined : undefined;
  const travelers =
    typeof sp.travelers === "string"
      ? Math.max(1, Math.min(12, Number(sp.travelers) || 2))
      : 2;

  return (
    <SejourView
      destination={destination}
      from={from}
      month={month}
      travelers={travelers}
    />
  );
}
