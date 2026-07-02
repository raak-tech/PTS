type Point = { date: string; value: number };

export function BarChart({
  data,
  label,
  formatValue,
  height = 120,
}: {
  data: Point[];
  label: string;
  formatValue?: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const width = Math.max(data.length * 28, 280);
  const barW = Math.min(20, width / Math.max(data.length, 1) - 4);

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <svg width="100%" viewBox={`0 0 ${width} ${height + 24}`} style={{ maxWidth: '100%' }}>
        {data.map((d, i) => {
          const barH = (d.value / max) * height;
          const x = i * (barW + 8) + 4;
          const y = height - barH;
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={barH} fill="#111" rx={2} />
              <title>
                {d.date}: {formatValue ? formatValue(d.value) : d.value}
              </title>
            </g>
          );
        })}
        <text x={0} y={height + 16} fontSize={10} fill="#888">
          {data[0]?.date ?? ''}
        </text>
        <text x={width - 48} y={height + 16} fontSize={10} fill="#888" textAnchor="end">
          {data[data.length - 1]?.date ?? ''}
        </text>
      </svg>
    </div>
  );
}

export function LineChart({
  data,
  label,
  formatValue,
  height = 120,
}: {
  data: Point[];
  label: string;
  formatValue?: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 0.0001);
  const width = Math.max(data.length * 12, 280);
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const points = data
    .map((d, i) => {
      const x = i * step;
      const y = height - (d.value / max) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <svg width="100%" viewBox={`0 0 ${width} ${height + 24}`} style={{ maxWidth: '100%' }}>
        <polyline fill="none" stroke="#111" strokeWidth={2} points={points} />
        {data.map((d, i) => {
          const x = i * step;
          const y = height - (d.value / max) * height;
          return (
            <circle key={d.date} cx={x} cy={y} r={3} fill="#111">
              <title>
                {d.date}: {formatValue ? formatValue(d.value) : d.value}
              </title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

export function StatGrid({ items }: { items: { label: string; value: string | number; sub?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{ border: '1px solid #eee', borderRadius: 12, padding: 14, background: 'white' }}
        >
          <div style={{ fontSize: 12, color: '#888' }}>{item.label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{item.value}</div>
          {item.sub ? <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{item.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}
