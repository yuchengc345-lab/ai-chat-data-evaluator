export function ScoreBadge({ value, kind = "neutral" }) {
  const color =
    kind === "good"
      ? "bg-teal/10 text-teal"
      : kind === "bad"
        ? "bg-rose/10 text-rose"
        : "bg-slate-100 text-slate-700";

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${color}`}>{value}</span>;
}
