"use client";

import { useState } from "react";
import type { Destination } from "@/lib/types";
import { lodgingEstimates, type LodgingKey } from "@/lib/lodging";
import { euro } from "@/lib/format";
import {
  airbnbUrl,
  bookingUrl,
  hostelworldUrl,
  petSittingUrl,
} from "@/lib/deeplinks";

const ALL_TYPES: LodgingKey[] = ["hostel", "appartement", "hotel", "resort"];

export default function Lodging({
  destination,
  initialTravelers,
}: {
  destination: Destination;
  initialTravelers: number;
}) {
  const [travelers, setTravelers] = useState(initialTravelers);
  const [nights, setNights] = useState(7);
  const [pool, setPool] = useState(false);
  const [pets, setPets] = useState(false);
  const [types, setTypes] = useState<Set<LodgingKey>>(new Set(ALL_TYPES));

  const estimates = lodgingEstimates(destination, { travelers, pool }).filter(
    (e) => types.has(e.key)
  );

  function toggleType(k: LodgingKey) {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next.size ? next : new Set(ALL_TYPES);
    });
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7">
      <SectionHead
        icon="🏨"
        title="Logements"
        subtitle="Fourchettes estimées par nuit (groupe). Les boutons ouvrent les vraies plateformes, pré-filtrées."
      />

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Stepper label="Voyageurs" value={travelers} set={setTravelers} min={1} max={12} />
        <Stepper label="Nuits" value={nights} set={setNights} min={1} max={60} />
        <Toggle active={pool} onClick={() => setPool(!pool)} icon="🏊">
          Piscine
        </Toggle>
        <Toggle active={pets} onClick={() => setPets(!pets)} icon="🐾">
          Animaux
        </Toggle>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ALL_TYPES.map((k) => (
          <TypeChip key={k} active={types.has(k)} onClick={() => toggleType(k)}>
            {LABELS[k]}
          </TypeChip>
        ))}
      </div>

      {/* Estimates */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {estimates.map((e) => (
          <div key={e.key} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                <span aria-hidden>{e.icon}</span> {e.label}
              </h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                estim.
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {euro(e.perNight[0])} – {euro(e.perNight[1])}
              <span className="text-sm font-normal text-slate-500"> / nuit</span>
            </p>
            <p className="text-xs text-slate-500">
              ≈ {euro(e.perNight[0] * nights)} – {euro(e.perNight[1] * nights)} pour{" "}
              {nights} nuit{nights > 1 ? "s" : ""}
            </p>
            <p className="mt-2 text-xs text-slate-500">{e.note}</p>
          </div>
        ))}
      </div>

      {/* Real deep links */}
      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-slate-700">
          Voir les disponibilités réelles :
        </p>
        <div className="flex flex-wrap gap-2">
          <PlatformLink href={bookingUrl(destination.city, { adults: travelers, pets })}>
            Booking.com
          </PlatformLink>
          <PlatformLink href={airbnbUrl(destination.city, { adults: travelers })}>
            Airbnb
          </PlatformLink>
          <PlatformLink href={hostelworldUrl(destination.city)}>
            Hostelworld
          </PlatformLink>
          {pets && (
            <PlatformLink href={petSittingUrl(destination.city)}>
              Pet-sitting (TrustedHousesitters)
            </PlatformLink>
          )}
        </div>
      </div>
    </section>
  );
}

const LABELS: Record<LodgingKey, string> = {
  hostel: "Hostel",
  appartement: "Appart / Airbnb",
  hotel: "Hôtel",
  resort: "Resort",
};

export function SectionHead({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
        <span aria-hidden>{icon}</span> {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Stepper({
  label,
  value,
  set,
  min,
  max,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <button
        type="button"
        onClick={() => set(Math.max(min, value - 1))}
        className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm"
        aria-label={`${label} moins`}
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-bold text-slate-800">
        {value}
      </span>
      <button
        type="button"
        onClick={() => set(Math.min(max, value + 1))}
        className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm"
        aria-label={`${label} plus`}
      >
        +
      </button>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-teal-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      <span aria-hidden>{icon}</span>
      {children}
    </button>
  );
}

function TypeChip({
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
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export function PlatformLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-teal-600 hover:to-cyan-700"
    >
      {children}
      <span aria-hidden>↗</span>
    </a>
  );
}
