type Segment = { label: string; value: number; color: string };

export default function MiniDonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Segment[];
  centerLabel: string;
  centerValue: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Chưa có dữ liệu.</p>;
  }

  const stops = segments.reduce<{ cumulative: number; parts: string[] }>(
    (acc, s) => {
      const start = (acc.cumulative / total) * 100;
      const nextCumulative = acc.cumulative + s.value;
      const end = (nextCumulative / total) * 100;
      return { cumulative: nextCumulative, parts: [...acc.parts, `${s.color} ${start}% ${end}%`] };
    },
    { cumulative: 0, parts: [] }
  ).parts;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div
        className="relative h-36 w-36 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500">{centerLabel}</span>
          <span className="text-xl font-extrabold text-slate-900">{centerValue}</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="text-slate-400">
              ({s.value} · {total > 0 ? Math.round((s.value / total) * 100) : 0}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
