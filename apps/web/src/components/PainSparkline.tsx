type Point = { value: number; label?: string };

type Props = {
  points: Point[];
  width?: number;
  height?: number;
  stroke?: string;
};

/** Minimal inline SVG sparkline for pain levels (0–10). */
export function PainSparkline({ points, width = 120, height = 32, stroke = 'var(--accent)' }: Props) {
  if (points.length < 2) return null;

  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const max = 10;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * innerW;
    const y = padding + innerH - (p.value / max) * innerH;
    return { x, y };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  return (
    <svg width={width} height={height} aria-hidden style={{ display: 'block' }}>
      <path d={pathD} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={2} fill={stroke} />
      ))}
    </svg>
  );
}
