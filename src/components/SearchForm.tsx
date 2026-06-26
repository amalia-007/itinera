"use client";

import { useEffect, useState } from "react";
import type {
  Airport,
  DiscoverRequest,
  MonthPart,
  StopoverSejour,
  TouristicWish,
  TripType,
  Vibe,
  WeatherWish,
} from "@/lib/types";
import { MONTHS_FR, VIBE_EMOJI, VIBE_LABELS } from "@/lib/format";
import { googleFlightsDeepUrl, kiwiUrl, skyscannerUrl } from "@/lib/deeplinks";
import type { FlightRoute } from "@/lib/deeplinks";
import CityAutocomplete from "./CityAutocomplete";

const WEATHER_OPTIONS: { value: WeatherWish; label: string; icon: string }[] = [
  { value: "chaud", label: "Chaud", icon: "☀️" },
  { value: "doux", label: "Doux", icon: "🌤️" },
  { value: "tempere", label: "Tempéré", icon: "⛅" },
  { value: "frais", label: "Frais", icon: "🍂" },
  { value: "froid", label: "Froid / neige", icon: "❄️" },
  { value: "peu_importe", label: "Peu importe", icon: "🌍" },
];

const TOURISTIC_OPTIONS: { value: TouristicWish; label: string; icon: string }[] =
  [
    { value: "calme", label: "Hors des foules", icon: "🧘" },
    { value: "equilibre", label: "Équilibré", icon: "⚖️" },
    { value: "anime", label: "Animé", icon: "🎡" },
    { value: "peu_importe", label: "Peu importe", icon: "🌍" },
  ];

const MONTH_PARTS: { value: MonthPart; label: string }[] = [
  { value: "debut", label: "Début" },
  { value: "milieu", label: "Milieu" },
  { value: "fin", label: "Fin" },
];

const ALL_VIBES = Object.keys(VIBE_LABELS) as Vibe[];

// Ratio one-way / round-trip (model constant from flights.ts)
const OW_RATIO = 0.62;

interface Props {
  onSearch: (req: DiscoverRequest) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: Props) {
  const [originAirport, setOriginAirport] = useState<Airport | null>(null);
  const [destAirport, setDestAirport] = useState<Airport | null>(null);

  // Stopover séjours: 0 = sans escale, 1..4 = number of stopovers
  const [stopoverCount, setStopoverCount] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [stopovers, setStopovers] = useState<StopoverSejour[]>([]);

  const [month, setMonth] = useState<number | "">("");
  const [monthPart, setMonthPart] = useState<MonthPart | "">("");
  const [tripType, setTripType] = useState<TripType>("aller-retour");
  const [budgetMax, setBudgetMax] = useState<number | "">("");
  const [weathers, setWeathers] = useState<WeatherWish[]>([]);
  const [touristic, setTouristic] = useState<TouristicWish>("peu_importe");
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [travelers, setTravelers] = useState(1);

  const hasDestination = destAirport !== null;

  // Sync stopovers array length when count changes
  useEffect(() => {
    setStopovers((prev) => {
      const next: StopoverSejour[] = Array.from({ length: stopoverCount }, (_, i) => ({
        airport: prev[i]?.airport,
        durationNights: prev[i]?.durationNights ?? 7,
      }));
      return next;
    });
  }, [stopoverCount]);

  // Auto-adjust budget when switching trip type
  function switchTripType(t: TripType) {
    if (t === tripType) return;
    setBudgetMax((prev) => {
      if (prev === "") return "";
      if (t === "aller-simple") return Math.round((prev * OW_RATIO) / 5) * 5;
      return Math.round((prev / OW_RATIO) / 5) * 5;
    });
    setTripType(t);
  }

  function updateStopover(index: number, patch: Partial<StopoverSejour>) {
    setStopovers((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }

  function toggleVibe(v: Vibe) {
    setVibes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!originAirport) return;
    onSearch({
      originQuery: originAirport.city,
      originAirport,
      destinationQuery: destAirport?.city,
      destinationAirport: destAirport ?? undefined,
      stopoversSejour: hasDestination && stopoverCount > 0 ? stopovers : undefined,
      filters: {
        month: month === "" ? undefined : month,
        monthPart: month !== "" && monthPart !== "" ? monthPart : undefined,
        tripType,
        budgetMax: budgetMax === "" ? undefined : budgetMax,
        weather: weathers.length ? weathers : undefined,
        touristic,
        vibes: vibes.length ? vibes : undefined,
        travelers,
      },
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 p-6 sm:p-8 space-y-7"
    >
      {/* Departure + Arrival */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ville de départ" required>
          <CityAutocomplete
            value={originAirport}
            onChange={setOriginAirport}
            placeholder="ex. Bruxelles (BRU)"
            required
          />
        </Field>
        <Field
          label="Ville d'arrivée"
          hint="Optionnel — laissez vide pour explorer"
        >
          <CityAutocomplete
            value={destAirport}
            onChange={(a) => {
              setDestAirport(a);
              if (!a) setStopoverCount(0);
            }}
            placeholder="ex. Sydney (SYD)"
          />
        </Field>
      </div>

      {/* Escales séjours — only visible when arrival is set */}
      {hasDestination && (
        <div className="animate-fade-up space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Escales séjours{" "}
              <span className="font-normal text-slate-400 text-xs">
                · villes où vous souhaitez passer du temps
              </span>
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setStopoverCount(0)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  stopoverCount === 0
                    ? "bg-teal-600 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Sans escale séjour
              </button>
              {([1, 2, 3, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStopoverCount(n)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    stopoverCount === n
                      ? "bg-teal-600 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {n} escale{n > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Per-stopover config */}
          {stopovers.map((stop, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
            >
              <p className="text-sm font-semibold text-slate-700">
                Escale séjour {i + 1}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Ville"
                  hint="Optionnel — laissez vide pour des suggestions"
                >
                  <CityAutocomplete
                    value={stop.airport ?? null}
                    onChange={(a) => updateStopover(i, { airport: a ?? undefined })}
                    placeholder="Laisser vide = suggestions"
                    allowEmpty
                  />
                </Field>
                <Field label="Durée du séjour">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={stop.durationNights}
                      onChange={(e) =>
                        updateStopover(i, {
                          durationNights: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className={inputClass}
                    />
                    <span className="text-sm text-slate-500 whitespace-nowrap">
                      nuit{stop.durationNights > 1 ? "s" : ""}
                    </span>
                  </div>
                </Field>
              </div>
              {!stop.airport && (
                <p className="text-xs text-teal-600">
                  🗺️ Itinera proposera 5 villes pour cette escale et toutes les combinaisons possibles.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* When + budget + travelers */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Month */}
          <Field label="Quand ?">
            <select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value === "" ? "" : Number(e.target.value));
                setMonthPart("");
              }}
              className={inputClass}
            >
              <option value="">Indifférent</option>
              {MONTHS_FR.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          {/* Budget */}
          <Field label={`Budget total vols${tripType === "aller-retour" ? " A/R" : " aller simple"} — par personne (€)${stopoverCount > 0 ? " · escales incluses" : ""}`}>
            <input
              type="number"
              min={0}
              step={50}
              value={budgetMax}
              onChange={(e) =>
                setBudgetMax(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="ex. 400"
              className={inputClass}
            />
          </Field>

          {/* Travelers */}
          <Field label="Voyageurs">
            <input
              type="number"
              min={1}
              max={12}
              value={travelers}
              onChange={(e) => setTravelers(Math.max(1, Number(e.target.value)))}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Month part — sub-selection when month chosen */}
        {month !== "" && (
          <div className="animate-fade-up">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Période du mois de{" "}
              {MONTHS_FR[Number(month) - 1]}
            </p>
            <div className="flex gap-2">
              {MONTH_PARTS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() =>
                    setMonthPart((prev) => (prev === p.value ? "" : p.value))
                  }
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                    monthPart === p.value
                      ? "bg-teal-600 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trip type toggle */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Type de vol</p>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1">
            {(["aller-retour", "aller-simple"] as TripType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTripType(t)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tripType === t
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t === "aller-retour" ? "✈️ Aller-retour" : "→ Aller simple"}
              </button>
            ))}
          </div>
          {tripType === "aller-simple" && (
            <p className="mt-1.5 text-xs text-slate-500">
              Les prix affichés seront pour un seul trajet, par personne.
            </p>
          )}
        </div>
      </div>

      {/* Weather — multi-select */}
      <Group label="Météo souhaitée sur place (plusieurs possibles)">
        {WEATHER_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            active={
              o.value === "peu_importe"
                ? weathers.length === 0
                : weathers.includes(o.value)
            }
            onClick={() => {
              if (o.value === "peu_importe") {
                setWeathers([]);
              } else {
                setWeathers((prev) =>
                  prev.includes(o.value)
                    ? prev.filter((w) => w !== o.value)
                    : [...prev.filter((w) => w !== "peu_importe"), o.value]
                );
              }
            }}
          >
            <span aria-hidden>{o.icon}</span> {o.label}
          </Chip>
        ))}
      </Group>

      {/* Touristic */}
      <Group label="Ambiance">
        {TOURISTIC_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            active={touristic === o.value}
            onClick={() => setTouristic(o.value)}
          >
            <span aria-hidden>{o.icon}</span> {o.label}
          </Chip>
        ))}
      </Group>

      {/* Vibes */}
      <Group label="Envies (plusieurs possibles)">
        {ALL_VIBES.map((v) => (
          <Chip key={v} active={vibes.includes(v)} onClick={() => toggleVibe(v)}>
            <span aria-hidden>{VIBE_EMOJI[v]}</span> {VIBE_LABELS[v]}
          </Chip>
        ))}
      </Group>

      <button
        type="submit"
        disabled={loading || !originAirport}
        className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 py-4 text-base font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:from-teal-600 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Recherche en cours…" : "Trouver mes destinations →"}
      </button>

      {/* "Trouver mes vols" — appears when origin + destination + all stopovers are filled */}
      {(() => {
        const allStopoversFilled =
          stopovers.length === 0 || stopovers.every((s) => s.airport);
        const ready = originAirport && destAirport && allStopoversFilled;
        if (!ready) return null;

        const route: FlightRoute = {
          originIata: originAirport.iata,
          destinationIata: destAirport.iata,
          stopovers: stopovers.map((s) => s.airport!.iata),
          month: month === "" ? undefined : month,
          monthPart: monthPart === "" ? undefined : monthPart,
          travelers,
          tripType,
        };

        return (
          <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/60 p-5 space-y-3">
            <div>
              <p className="text-sm font-bold text-teal-800">✈️ Prêt à réserver ?</p>
              <p className="text-xs text-teal-600 mt-0.5">
                {originAirport.city} ({originAirport.iata})
                {stopovers.map((s) => ` → ${s.airport!.city} (${s.airport!.iata})`).join("")}
                {" "}→ {destAirport.city} ({destAirport.iata})
                {" · "}{tripType === "aller-simple" ? "Aller simple" : "Aller-retour"}
                {" · "}{travelers} voyageur{travelers > 1 ? "s" : ""}
                {month !== "" && ` · ${MONTHS_FR[Number(month) - 1]}${monthPart ? ` (${monthPart})` : ""}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={skyscannerUrl(route)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0770E3] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.17 2.06A13.1 13.1 0 0 0 19 1.87a13 13 0 0 0-9.46 4.07L7.5 8H4a1 1 0 0 0-.78.37L.44 11.55a1 1 0 0 0 .34 1.54l3.2 1.62.09.09 5.91 5.91.1.1 1.6 3.19a1 1 0 0 0 .71.54 1 1 0 0 0 .83-.2l3.18-2.78A1 1 0 0 0 16 21v-3.5l2.06-2a13 13 0 0 0 3.76-12.24 1 1 0 0 0-.65-.2z"/></svg>
                Skyscanner
              </a>
              <a
                href={googleFlightsDeepUrl(route)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google Flights
              </a>
              <a
                href={kiwiUrl(route)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00B2A9] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                🥝 Kiwi.com
              </a>
            </div>
            <p className="text-[10px] text-teal-500">
              Ces liens ouvrent les comparateurs avec vos paramètres pré-remplis pour trouver le vrai prix du marché.
            </p>
          </div>
        );
      })()}
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-teal-600"> *</span>}
        {hint && (
          <span className="ml-1 font-normal text-slate-400 text-xs">· {hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
        active
          ? "bg-teal-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
