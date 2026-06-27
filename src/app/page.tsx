"use client";

import { useMemo, useState } from "react";
import SearchForm from "@/components/SearchForm";
import ResultCard from "@/components/ResultCard";
import DealsGuide from "@/components/DealsGuide";
import Flag from "@/components/Flag";
import { discover } from "@/lib/api";
import { euro } from "@/lib/format";
import type {
  DiscoverRequest,
  DiscoverResponse,
  ItineraryCombination,
  TripType,
} from "@/lib/types";

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

  const tripType: TripType = lastReq?.filters.tripType ?? "aller-retour";
  const month = lastReq?.filters.month;
  const travelers = lastReq?.filters.travelers ?? 1;

  const sorted = useMemo(() => {
    if (!data) return [];
    const arr = [...data.results];
    if (sort === "price") {
      arr.sort((a, b) =>
        tripType === "aller-simple"
          ? a.flight.oneWay - b.flight.oneWay
          : a.flight.roundTrip - b.flight.roundTrip
      );
    } else if (sort === "cost") {
      arr.sort((a, b) => a.costPerDay.mid - b.costPerDay.mid);
    }
    return arr;
  }, [data, sort, tripType]);

  const cheapestFlight = useMemo(() => {
    if (!data?.results.length) return null;
    return Math.min(
      ...data.results.map((r) =>
        tripType === "aller-simple" ? r.flight.oneWay : r.flight.roundTrip
      )
    );
  }, [data, tripType]);

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
        <div className="relative z-10 -mt-8 sm:-mt-10">
          <SearchForm onSearch={runSearch} loading={loading} />
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Géolocalisation &amp; saisons : données réelles (Open-Meteo). Prix de
          vol : estimations calibrées sur la distance — pas des tarifs live.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200/60" />
            ))}
          </div>
        )}

        {!loading && data && (
          <section id="results" className="mt-10 scroll-mt-6 space-y-14">
            {/* Destination results — only when no fixed arrival */}
            {sorted.length > 0 && (
              <div>
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
                        {tripType === "aller-simple" ? "l'aller simple estimé" : "le vol A/R estimé"}
                        {" "}· par personne
                        {data.originCostIndex ? " · coût de la vie comparé à votre départ" : ""}
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
                      tripType={tripType}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary combinations — when stopovers have empty slots */}
            {data.combinations && data.combinations.length > 0 && (
              <CombinationsSection
                combinations={data.combinations}
                originName={data.origin.name}
                destName={lastReq?.destinationQuery ?? "destination"}
                tripType={tripType}
                travelers={travelers}
                onReset={() => { setData(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            )}

            {/* Legacy stops section */}
            {data.stops && data.stops.candidates.length > 0 && !data.combinations && (
              <div>
                <h2 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
                  Escales possibles vers <Flag cc={data.stops.destination.cc} />
                  {data.stops.destination.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Meilleures villes sur la route (
                  {data.stops.directDistanceKm.toLocaleString("fr-FR")} km en direct),
                  classées par détour minimal.
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
                      tripType={tripType}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {!loading && !data && !error && <EmptyHint />}

        <DealsGuide />
        <RoadmapTeaser />
      </div>

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

// ─── Combinations Section ────────────────────────────────────────────────────

type ComboSort = "cheapest" | "expensive";

function CombinationsSection({
  combinations,
  originName,
  destName,
  tripType,
  travelers,
  onReset,
}: {
  combinations: ItineraryCombination[];
  originName: string;
  destName: string;
  tripType: TripType;
  travelers: number;
  onReset?: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comboSort, setComboSort] = useState<ComboSort>("cheapest");
  const isOneWay = tripType === "aller-simple";

  const sorted = [...combinations].sort((a, b) => {
    const pa = isOneWay ? a.totalOneWayPrice : a.totalRoundTripPrice;
    const pb = isOneWay ? b.totalOneWayPrice : b.totalRoundTripPrice;
    return comboSort === "cheapest" ? pa - pb : pb - pa;
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          {combinations.length} itinéraire{combinations.length > 1 ? "s" : ""} comparés
        </p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            ✎ Changer la recherche
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {originName} → escales séjours → {destName} · prix{" "}
          {isOneWay ? "aller simple" : "A/R"}, par personne.
          {travelers > 1 && (
            <span className="font-medium text-slate-600">
              {" "}× {travelers} = total ci-dessous.
            </span>
          )}
        </p>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 shrink-0">
          {(["cheapest", "expensive"] as ComboSort[]).map((s) => (
            <button
              key={s}
              onClick={() => setComboSort(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                comboSort === s
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {s === "cheapest" ? "Prix ↑ Moins cher" : "Prix ↓ Plus cher"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {sorted.map((combo) => {
          const pricePerPerson = isOneWay
            ? combo.totalOneWayPrice
            : combo.totalRoundTripPrice;
          const totalPrice = pricePerPerson * travelers;
          const isOpen = expanded === combo.id;

          return (
            <div
              key={combo.id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
            >
              {/* Summary row */}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : combo.id)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-sm font-medium text-slate-500">{originName}</span>
                  {combo.stopovers.map((s, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-slate-300">→</span>
                      <span className="font-semibold text-slate-800">{s.airport.city}</span>
                      <span className="text-xs text-slate-400">
                        ({s.durationNights}n)
                      </span>
                    </span>
                  ))}
                  <span className="text-slate-300">→</span>
                  <span className="text-sm font-medium text-slate-500">{destName}</span>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-teal-600">
                    {euro(pricePerPerson)}
                    <span className="text-xs font-normal text-slate-400">/pers.</span>
                  </p>
                  {travelers > 1 && (
                    <p className="text-xs text-slate-500">{euro(totalPrice)} total</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isOneWay ? "aller simple" : "A/R"} · {isOpen ? "▲" : "▼"}
                  </p>
                </div>
              </button>

              {/* Expanded leg detail */}
              {isOpen && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/60">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Détail des vols (estimations)
                  </p>
                  <div className="space-y-2">
                    {combo.legs.map((leg, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-slate-700">
                          ✈️ {leg.fromName} → {leg.toName}
                          <span className="text-xs text-slate-400 ml-1">
                            ({leg.distanceKm.toLocaleString("fr-FR")} km)
                          </span>
                        </span>
                        <span className="font-semibold text-slate-800 shrink-0">
                          {euro(leg.price)}
                        </span>
                      </div>
                    ))}
                    {!isOneWay && (
                      <div className="flex items-center justify-between gap-3 text-sm border-t border-slate-200 pt-2 mt-2">
                        <span className="text-slate-500">↩️ Retour {destName} → {originName}</span>
                        <span className="font-semibold text-slate-600">
                          {euro(combo.totalRoundTripPrice - combo.totalOneWayPrice)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between font-semibold text-slate-800">
                    <span>Total par personne</span>
                    <span className="text-teal-600">{euro(pricePerPerson)}</span>
                  </div>
                  {travelers > 1 && (
                    <div className="flex justify-between text-sm text-slate-500 mt-1">
                      <span>Total × {travelers} voyageurs</span>
                      <span>{euro(totalPrice)}</span>
                    </div>
                  )}

                  {/* Stopover stays */}
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Séjours inclus
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {combo.stopovers.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-teal-100 text-teal-700 text-xs px-3 py-1 font-medium"
                        >
                          {s.airport.city} · {s.durationNights} nuit{s.durationNights > 1 ? "s" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sort toggle ─────────────────────────────────────────────────────────────

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
        Laissez la ville d&apos;arrivée vide pour explorer des destinations — ou
        renseignez-la pour planifier des escales séjours.
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
