// Self-contained country badge — no network, no external dependency, renders
// identically on every OS (Windows shows regional-indicator emoji as bare
// letters, and external flag CDNs add 50+ requests that can hang the page).
// A styled ISO-code chip looks intentional and always works.
export default function Flag({
  cc,
  className = "",
}: {
  cc?: string;
  className?: string;
}) {
  if (!cc || cc.length !== 2) {
    return (
      <span aria-hidden className={className}>
        🌍
      </span>
    );
  }
  return (
    <span
      title={cc.toUpperCase()}
      className={`inline-flex items-center justify-center rounded-[4px] bg-slate-100 px-1.5 py-[3px] font-mono text-[10px] font-bold uppercase leading-none tracking-wider text-slate-500 ring-1 ring-slate-200 ${className}`}
    >
      {cc.toUpperCase()}
    </span>
  );
}
