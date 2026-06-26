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
  const [weather, setWeather] = useState<WeatherWish>("peu_importe");
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
        weather,
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
          <Field label={`Budget vol max${tripType === "aller-retour" ? " A/R" : " aller simple"} — par personne (€)`}>
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

      {/* Weather */}
      <Group label="Météo souhaitée sur place">
        {WEATHER_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            active={weather === o.value}
            onClick={() => setWeather(o.value)}
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
