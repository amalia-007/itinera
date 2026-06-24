"use client";

import { useState } from "react";
import type { Destination } from "@/lib/types";
import { activityEstimates } from "@/lib/activities";
import { euro } from "@/lib/format";
import { getYourGuideUrl, viatorUrl, googleThingsToDo } from "@/lib/deeplinks";
import { SectionHead, PlatformLink } from "@/components/sejour/Lodging";

export default function Activities({
  destination,
}: {
  destination: Destination;
}) {
  const [query, setQuery] = useState("");
  const results = activityEstimates(destination, query);
  const searchTerm = query.trim()
    ? `${query.trim()} ${destination.city}`
    : `activités ${destination.city}`;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7">
      <SectionHead
        icon="🎟️"
        title="Activités"
        subtitle="Cherchez un type d'activité. Prix indicatifs ajustés au coût local ; réservation sur les vraies plateformes."
      />

      {/* Search bar */}
      <div className="mt-5 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ex. plongée, food tour, musée, randonnée…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-500 hover:bg-slate-200"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">
          Aucune catégorie ne correspond à « {query} ». Essayez un autre mot, ou
          cherchez directement sur les plateformes ci-dessous.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => (
            <a
              key={a.key}
              href={getYourGuideUrl(`${a.label} ${destination.city}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-slate-100 p-4 transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>
                  {a.icon}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {a.price ? `${euro(a.price[0])}–${euro(a.price[1])}` : "Gratuit"}
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-slate-900 group-hover:text-teal-700">
                {a.label}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{a.blurb}</p>
              <p className="mt-2 text-xs font-medium text-teal-600">
                Voir les offres ↗
              </p>
            </a>
          ))}
        </div>
      )}

      {/* Platform deep links for the current search */}
      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-slate-700">
          Rechercher « {searchTerm} » sur :
        </p>
        <div className="flex flex-wrap gap-2">
          <PlatformLink href={getYourGuideUrl(searchTerm)}>
            GetYourGuide
          </PlatformLink>
          <PlatformLink href={viatorUrl(searchTerm)}>Viator</PlatformLink>
          <PlatformLink href={googleThingsToDo(`${searchTerm} à faire`)}>
            Google
          </PlatformLink>
        </div>
      </div>
    </section>
  );
}
