type Point = { label: string; value: number };

export default function MiniLineChart({ points, max = 100 }: { points: Point[]; max?: number }) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Chưa có dữ liệu.</p>;
  }

  const width = 600;
  const height = 200;
  const padding = 24;
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (Math.max(0, Math.min(p.value, max)) / max) * (height - padding * 2);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full min-w-[400px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#lineFill)" />
        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#2563eb" />
        ))}
        {coords.map((c, i) => (
          <text key={i} x={c.x} y={height + 18} fontSize="11" fill="#64748b" textAnchor="middle">
            {c.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
