export function MetricCard({ label, value, tone = "default" }) {
  const toneClass =
    tone === "rose"
      ? "border-rose/30 bg-rose/5 text-rose"
      : tone === "amber"
        ? "border-amber/30 bg-amber/5 text-amber"
        : tone === "teal"
          ? "border-teal/30 bg-teal/5 text-teal"
          : "border-line bg-white text-ink";

  return (
    <div className={`rounded-lg border p-5 ${toneClass}`}>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
}
