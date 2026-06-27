"use client";

import { useMemo, useState } from "react";
import type { Airport } from "@/lib/types";
import {
  getFlightSuggestions,
  formatDuration,
  type FlightOption,
} from "@/lib/flightSuggestions";

interface Props {
  origin: Airport;
  destination: Airport;
  stopovers?: Airport[];
  month?: number;
  monthPart?: "debut" | "milieu" | "fin";
  travelers: number;
  tripType?: "aller-retour" | "aller-simple";
}

export default function FlightOptionsPanel({
  origin,
  destination,
  stopovers = [],
  month,
  monthPart,
  travelers,
  tripType,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const options = useMemo(
    () =>
      getFlightSuggestions({ origin, destination, stopovers, month, monthPart, travelers, tripType }),
    [origin.iata, destination.iata, stopovers.map((s) => s.iata).join(), month, monthPart, travelers, tripType]
  );

  const selectedOption = options.find((o) => o.id === selected);

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-3">
        Estimations calibrées sur la distance — sélectionnez une compagnie pour ouvrir la réservation.
      </p>

      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <div key={opt.id}>
            <button
              type="button"
              onClick={() => setSelected(isSelected ? null : opt.id)}
              className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                isSelected
                  ? "border-teal-400 bg-teal-50 ring-1 ring-teal-400"
                  : "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Airline */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg leading-none">{opt.airline.logo}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {opt.airline.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {opt.direct ? "Direct" : `Via ${opt.legs[0]?.via ?? "hub"}`}
                      {" · "}{formatDuration(opt.totalDurationMin)}
                      {" · "}<span className={`font-medium ${
                        opt.airline.type === "budget" ? "text-green-600" :
                        opt.airline.type === "haut-de-gamme" ? "text-purple-600" : "text-slate-600"
                      }`}>
                        {opt.airline.type === "budget" ? "Low-cost" :
                         opt.airline.type === "haut-de-gamme" ? "Haut de gamme" : "Standard"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900 text-base">
                    ~{opt.pricePerPerson.toLocaleString("fr-FR")} €
                  </p>
                  <p className="text-xs text-slate-400">par pers.</p>
                  {travelers > 1 && (
                    <p className="text-xs font-medium text-teal-600">
                      {opt.totalPrice.toLocaleString("fr-FR")} € total
                    </p>
                  )}
                </div>
              </div>
            </button>

            {/* Expanded: booking link */}
            {isSelected && (
              <div className="mx-1 rounded-b-xl border border-t-0 border-teal-300 bg-teal-50 px-4 py-3 space-y-2">
                {/* Legs breakdown */}
                <div className="space-y-1">
                  {opt.legs.map((leg, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="font-mono font-bold text-slate-800">{leg.from}</span>
                      <span>→</span>
                      <span className="font-mono font-bold text-slate-800">{leg.to}</span>
                      <span className="text-slate-400">·</span>
                      <span>{leg.fromCity} → {leg.toCity}</span>
                      <span className="text-slate-400">·</span>
                      <span>{formatDuration(leg.durationMin)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-teal-200">
                  <p className="text-xs text-teal-700">
                    Prix estimé : <span className="font-bold">{opt.pricePerPerson.toLocaleString("fr-FR")} € / pers.</span>
                    {travelers > 1 && <> · <span className="font-bold">{opt.totalPrice.toLocaleString("fr-FR")} €</span> pour {travelers} voyageurs</>}
                  </p>
                  <a
                    href={opt.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition"
                  >
                    Réserver →
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
