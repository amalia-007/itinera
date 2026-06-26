"use client";

import { useEffect, useRef, useState } from "react";
import type { Airport } from "@/lib/types";
import type { AirportResult } from "@/data/airports";

interface Props {
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder?: string;
  required?: boolean;
  allowEmpty?: boolean;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = "ex. Bruxelles ou Belgique",
  required,
  allowEmpty,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AirportResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // position for fixed dropdown
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setQuery(`${value.city} (${value.iata})`);
  }, [value]);

  function calcPos() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  }

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
        const data: AirportResult[] = await res.json();
        setResults(data);
        if (data.length > 0) { calcPos(); setOpen(true); }
        else setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  function select(airport: AirportResult) {
    onChange(airport);
    setQuery(`${airport.city} (${airport.iata})`);
    setOpen(false);
    setResults([]);
  }

  function handleBlur() {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        if (!value) setQuery("");
      }
    }, 150);
  }

  function handleFocus() {
    if (results.length > 0) { calcPos(); setOpen(true); }
  }

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const update = () => calcPos();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <div ref={containerRef} onBlur={handleBlur}>
      <div className="relative">
        <input
          ref={inputRef}
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

      {/* Fixed-position dropdown — escapes any stacking context */}
      {open && results.length > 0 && dropPos && (
        <ul
          style={{
            position: "fixed",
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 9999,
          }}
          className="rounded-xl border border-slate-200 bg-white shadow-xl max-h-64 overflow-y-auto"
        >
          {results.map((airport) => (
            <li key={airport.iata}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(airport)}
                className="w-full text-left px-4 py-3 hover:bg-teal-50 transition flex items-center justify-between gap-3 border-b border-slate-100 last:border-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {airport.isCountryHub && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-teal-600 text-white rounded px-1.5 py-0.5 shrink-0">
                        Hub
                      </span>
                    )}
                    <span className="font-semibold text-slate-800 truncate">
                      {airport.city}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 truncate block">
                    {airport.name} · {airport.country}
                  </span>
                  {airport.isCountryHub && (
                    <span className="text-[10px] text-teal-600">
                      Aéroport principal sélectionné automatiquement
                    </span>
                  )}
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
