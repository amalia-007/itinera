"use client";

import { useMemo, useState } from "react";
import SearchForm from "@/components/SearchForm";
import ResultCard from "@/components/ResultCard";
import DealsGuide from "@/components/DealsGuide";
import Flag from "@/components/Flag";
import { discover } from "@/lib/api";
import { euro } from "@/lib/format";
import type { DiscoverRequest, DiscoverResponse } from "@/lib/types";

type SortKey = "score" | "price" | "cost";

export default function Home() {
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("score");
  const [lastReq, setLastReq] = useState<DiscoverRequest | null>(null);

  async function runSearch(req: DiscoverRequest) {
    setLoading(true);
    setError(null);
    setLastReq(req);
    try {
      const res = await discover(req);
      setData(res);
      setSort("score");
      if (typeof window !== "undefined") {
        setTimeout(
          () =>
            document
              .getElementById("results")
              ?.scrollIntoView({ behavior: "smooth", block: "start" }),
          80
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const sorted = useMemo(() => {
    if (!data) return [];
    const arr = [...data.results];
    if (sort === "price")
      arr.sort((a, b) => a.flight.roundTrip - b.flight.roundTrip);
    else if (sort === "cost")
      arr.sort((a, b) => a.costPerDay.mid - b.costPerDay.mid);
    return arr;
  }, [data, sort]);

  const cheapestFlight = useMemo(
    () =>
      data && data.results.length
        ? Math.min(...data.results.map((r) => r.flight.roundTrip))
        : null,
    [data]
  );

  const month = lastReq?.filters.month;
  const travelers = lastReq?.filters.travelers;

  return (
    <main className="flex-1">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-700 text-white">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_30%,white,transparent_40%),radial-gradient(circle_at_80%_10%,white,transparent_35%)]" />
        <div className="relative mx-auto max-w-5xl px-5 pt-14 pb-10 sm:pt-20 sm:pb-14">
          <div className="flex items-center gap-2 text-sm font-medium text-teal-100">
            <span className="text-xl">🧭</span> Itinera
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Votre prochaine destination, choisie pour vous.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-teal-50">
            Donnez votre ville de départ et vos envies. Itinera classe les
            destinations par prix de vol, compare le coût de la vie et vous dit
            quand acheter.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5">
        {/* Search — relative z-10 so the card floats ABOVE the relatively
            positioned hero (otherwise the hero paints over its top edge). */}
        <div className="relative z-10 -mt-8 sm:-mt-10">
          <SearchForm onSearch={runSearch} loading={loading} />
        </div>

        {/* Honesty banner */}
        <p className="mt-4 text-center text-xs text-slate-400">
          Géolocalisation &amp; saisons : données réelles (Open-Meteo). Prix de
          vol : estimations calibrées sur la distance — pas des tarifs live.
        </p>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-slate-200/60"
              />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && data && (
          <section id="results" className="mt-10 scroll-mt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {sorted.length} destination{sorted.length > 1 ? "s" : ""} depuis{" "}
                  <span className="inline-flex items-center gap-2 text-teal-600">
                    <Flag cc={data.origin.cc} /> {data.origin.name}
                  </span>
                </h2>
                {cheapestFlight !== null && (
                  <p className="mt-1 text-sm text-slate-500">
                    À partir de{" "}
                    <span className="font-semibold text-slate-700">
                      {euro(cheapestFlight)}
                    </span>{" "}
                    le vol A/R estimé
                    {data.originCostIndex
                      ? " · coût de la vie comparé à votre départ"
                      : ""}
                    .
                  </p>
                )}
              </div>
              <SortToggle sort={sort} onChange={setSort} />
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((r, i) => (
                <ResultCard
                  key={r.destination.id}
                  rank={r}
                  index={i}
                  month={month}
                  originName={data.origin.name}
                  travelers={travelers}
                />
              ))}
            </div>

            {/* Stops */}
            {data.stops && data.stops.candidates.length > 0 && (
              <div className="mt-12">
                <h2 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
                  Escales possibles vers <Flag cc={data.stops.destination.cc} />
                  {data.stops.destination.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Vous vouliez {data.stops.requested} escale
                  {data.stops.requested > 1 ? "s" : ""} — voici les meilleures
                  villes « sur la route » (
                  {data.stops.directDistanceKm.toLocaleString("fr-FR")} km en
                  direct), classées par détour minimal.
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.stops.candidates.map((r, i) => (
                    <ResultCard
                      key={`stop-${r.destination.id}`}
                      rank={r}
                      index={i}
                      month={month}
                      originName={data.origin.name}
                      travelers={travelers}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Empty state hint */}
        {!loading && !data && !error && <EmptyHint />}

        {/* Deals guide — always available */}
        <DealsGuide />

        {/* Roadmap teaser */}
        <RoadmapTeaser />
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-8 text-sm text-slate-500">
          <p className="font-semibold text-slate-700">Itinera — MVP découverte</p>
          <p className="mt-1">
            Saisons &amp; géocodage : Open-Meteo (réel). Prix de vol &amp; coût de
            la vie : modèles d&apos;estimation transparents. Aucune donnée
            inventée n&apos;est présentée comme un tarif réservable.
          </p>
        </div>
      </footer>
    </main>
  );
}

function SortToggle({
  sort,
  onChange,
}: {
  sort: SortKey;
  onChange: (s: SortKey) => void;
}) {
  const options: { key: SortKey; label: string }[] = [
    { key: "score", label: "Pertinence" },
    { key: "price", label: "Prix vol ↑" },
    { key: "cost", label: "Coût vie ↑" },
  ];
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            sort === o.key
              ? "bg-white text-teal-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      <p className="text-3xl">🌍✈️</p>
      <p className="mt-3 font-medium text-slate-700">
        Indiquez votre ville de départ pour commencer.
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Laissez la ville d&apos;arrivée vide pour découvrir des destinations qui
        collent à vos envies — ou renseignez-la pour planifier des escales.
      </p>
    </div>
  );
}

function RoadmapTeaser() {
  const items = [
    { icon: "🏨", label: "Logements (filtres piscine, hostel, Airbnb…)" },
    { icon: "🎟️", label: "Activités & bons plans avec recherche" },
    { icon: "🧳", label: "Infos pratiques sur place" },
    { icon: "🔌", label: "Branchement vols live (Amadeus)" },
  ];
  return (
    <section className="mt-16 rounded-3xl bg-slate-900 p-7 text-slate-100 sm:p-9">
      <h2 className="text-xl font-bold">Prochaines étapes du voyage A → Z</h2>
      <p className="mt-1 text-sm text-slate-400">
        Le cœur découverte est là. La suite du parcours s&apos;ajoutera dessus,
        avec la même règle : que des données réelles ou des estimations
        clairement annoncées.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-2xl bg-slate-800/70 p-4 ring-1 ring-white/5"
          >
            <span className="text-2xl">{it.icon}</span>
            <p className="mt-2 text-sm text-slate-300">{it.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
