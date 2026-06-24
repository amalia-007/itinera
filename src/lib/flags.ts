/** ISO 3166-1 alpha-2 country code → flag emoji (regional indicator pair). */
export function flagEmoji(cc?: string): string {
  if (!cc || cc.length !== 2) return "🌍";
  const A = "A".charCodeAt(0);
  const RI = 0x1f1e6;
  const codes = cc
    .toUpperCase()
    .split("")
    .map((ch) => RI + (ch.charCodeAt(0) - A));
  if (codes.some((n) => n < RI || n > RI + 25)) return "🌍";
  return String.fromCodePoint(...codes);
}
