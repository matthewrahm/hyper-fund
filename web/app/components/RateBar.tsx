import type { FundingRate } from "@/lib/api";

export default function RateBar({ rates }: { rates: FundingRate[] }) {
  if (rates.length === 0) return null;

  const sorted = [...rates].sort((a, b) => a.rate - b.rate);
  const maxAbs = Math.max(...sorted.map((r) => Math.abs(r.rate)), 1e-8);
  const barHeight = 24;
  const labelWidth = 90;
  const valueWidth = 80;
  const chartWidth = 200;
  const centerX = labelWidth + chartWidth / 2;
  const totalWidth = labelWidth + chartWidth + valueWidth;
  const totalHeight = sorted.length * barHeight;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="mt-3"
    >
      {/* Zero line */}
      <line
        x1={centerX}
        y1={0}
        x2={centerX}
        y2={totalHeight}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />

      {sorted.map((r, i) => {
        const y = i * barHeight;
        const barWidth = (Math.abs(r.rate) / maxAbs) * (chartWidth / 2 - 4);
        const isPositive = r.rate >= 0;
        const barX = isPositive ? centerX : centerX - barWidth;
        const color = isPositive ? "#22c55e" : "#ef4444";
        const ann = r.rate * 24 * 365 * 100;

        return (
          <g key={r.exchange}>
            {/* Exchange label */}
            <text
              x={labelWidth - 8}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              fill="#a1a1aa"
              fontSize={11}
              fontFamily="var(--font-mono)"
            >
              {r.exchange}
            </text>

            {/* Bar */}
            <rect
              x={barX}
              y={y + 4}
              width={Math.max(barWidth, 1)}
              height={barHeight - 8}
              rx={3}
              fill={color}
              opacity={0.7}
            />

            {/* Value */}
            <text
              x={labelWidth + chartWidth + 4}
              y={y + barHeight / 2 + 4}
              fill={color}
              fontSize={11}
              fontFamily="var(--font-mono)"
            >
              {ann >= 0 ? "+" : ""}
              {ann.toFixed(1)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
