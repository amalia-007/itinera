"use client";

import { useEffect, useRef, useState } from "react";
import type { Airport } from "@/lib/types";

interface Props {
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder?: string;
  required?: boolean;
  allowEmpty?: boolean; // true = "laisser vide" is a valid choice (for stopover séjours)
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = "ex. Bruxelles",
  required,
  allowEmpty,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep input text in sync with selected value
  useEffect(() => {
    if (value) {
      setQuery(`${value.city} (${value.iata})`);
    }
  }, [value]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (!q) {
      onChange(null);
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (q.length < 2) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/airports?q=${encodeURIComponent(q)}`);
        const data: Airport[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  function select(airport: Airport) {
    onChange(airport);
    setQuery(`${airport.city} (${airport.iata})`);
    setOpen(false);
    setResults([]);
  }

  function handleBlur(e: React.FocusEvent) {
    // Delay closing so clicks on options register
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        // If the user typed something but didn't select, clear if no value
        if (!value) setQuery("");
      }
    }, 150);
  }

  function handleFocus() {
    if (results.length > 0) setOpen(true);
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <input
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required && !allowEmpty}
          autoComplete="off"
          className={`w-full rounded-xl border px-4 py-3 text-slate-800 outline-none transition pr-9 focus:ring-2 focus:ring-teal-100 ${
            value
              ? "border-teal-400 bg-white"
              : "border-slate-200 bg-slate-50/60 focus:border-teal-400 focus:bg-white"
          }`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs animate-pulse">
            ⏳
          </span>
        )}
        {value && !loading && (
          <button
            type="button"
            onClick={() => { onChange(null); setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
            aria-label="Effacer"
          >
            ✕
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-60 overflow-y-auto">
          {results.map((airport) => (
            <li key={airport.iata}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(airport)}
                className="w-full text-left px-4 py-3 hover:bg-teal-50 transition flex items-center justify-between gap-3 border-b border-slate-100 last:border-0"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800 block truncate">
                    {airport.city}
                  </span>
                  <span className="text-xs text-slate-500 truncate block">
                    {airport.name} · {airport.country}
                  </span>
                </div>
                <span className="shrink-0 rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700 font-mono">
                  {airport.iata}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
