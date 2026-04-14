import type { CostData } from "@/lib/api";
import { formatSignedCurrency, formatCurrency } from "@/lib/utils";

function StatCard({
  label,
  sublabel,
  value,
  colorize = false,
}: {
  label: string;
  sublabel?: string;
  value: number;
  colorize?: boolean;
}) {
  const color = colorize
    ? value > 0
      ? "text-loss"
      : value < 0
        ? "text-profit"
        : "text-secondary"
    : "text-primary";

  return (
    <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="label mb-0.5">{label}</div>
      {sublabel && (
        <div className="text-[10px] text-muted mb-1">{sublabel}</div>
      )}
      <div className={`num text-lg font-semibold ${color}`}>
        {colorize ? formatSignedCurrency(value) : formatCurrency(value)}
      </div>
    </div>
  );
}

function costLabel(value: number): string {
  if (value > 0) return "paying";
  if (value < 0) return "earning";
  return "neutral";
}

export default function CostBreakdown({ data }: { data: CostData }) {
  const sortedPositions = [...data.positions].sort(
    (a, b) => Math.abs(b.hourly_cost) - Math.abs(a.hourly_cost)
  );

  const isPaying = data.total_daily > 0;
  const isEarning = data.total_daily < 0;
  const hasPositions = sortedPositions.length > 0;

  return (
    <div>
      {/* Headline summary */}
      {hasPositions && (
        <div
          className="rounded-lg p-4 mb-5"
          style={{
            background: isPaying
              ? "rgba(239, 68, 68, 0.06)"
              : isEarning
                ? "rgba(34, 197, 94, 0.06)"
                : "rgba(255,255,255,0.03)",
            borderLeft: `3px solid ${
              isPaying ? "#ef4444" : isEarning ? "#22c55e" : "#71717a"
            }`,
          }}
        >
          <p className="text-sm text-primary">
            {isPaying ? (
              <>
                This wallet is <span className="font-semibold text-loss">paying {formatCurrency(Math.abs(data.total_daily))}/day</span> in
                funding across {sortedPositions.length} position{sortedPositions.length > 1 ? "s" : ""}.
                That adds up to <span className="font-semibold text-loss">{formatCurrency(Math.abs(data.total_monthly))}/month</span> eating
                into PnL.
              </>
            ) : isEarning ? (
              <>
                This wallet is <span className="font-semibold text-profit">earning {formatCurrency(Math.abs(data.total_daily))}/day</span> from
                funding across {sortedPositions.length} position{sortedPositions.length > 1 ? "s" : ""}.
                That compounds to <span className="font-semibold text-profit">{formatCurrency(Math.abs(data.total_monthly))}/month</span> in
                passive income.
              </>
            ) : (
              <>Funding is neutral across all positions.</>
            )}
          </p>
        </div>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-4">
        <StatCard label="Account Value" value={data.account_value} />
        <StatCard
          label="Per Hour"
          sublabel={costLabel(data.total_hourly)}
          value={data.total_hourly}
          colorize
        />
        <StatCard
          label="Per Day"
          sublabel={costLabel(data.total_daily)}
          value={data.total_daily}
          colorize
        />
        <StatCard
          label="Per Month"
          sublabel={costLabel(data.total_monthly)}
          value={data.total_monthly}
          colorize
        />
      </div>

      {/* Position table */}
      {hasPositions ? (
        <>
          <div className="label mb-3">Position Breakdown</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">Coin</th>
                  <th className="table-header text-left">Direction</th>
                  <th className="table-header text-right">Position Value</th>
                  <th className="table-header text-right">Funding Rate</th>
                  <th className="table-header text-right">Daily Cost</th>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map((p) => {
                  const positionValue = p.size * p.mark_price;
                  const dailyCost = p.hourly_cost * 24;
                  const dailyColor = dailyCost > 0
                    ? "text-loss"
                    : dailyCost < 0
                      ? "text-profit"
                      : "text-secondary";

                  return (
                    <tr key={p.coin} className="table-row">
                      <td className="table-cell font-medium text-primary">
                        {p.coin}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`text-xs font-semibold ${
                            p.side === "LONG" ? "text-profit" : "text-loss"
                          }`}
                        >
                          {p.side}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <span className="num text-secondary">
                          {formatCurrency(positionValue)}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <span className="num text-muted">
                          {(p.funding_rate * 100).toFixed(4)}%/h
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <span className={`num font-medium ${dailyColor}`}>
                          {formatSignedCurrency(dailyCost)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-xs text-muted leading-relaxed">
              <span className="text-loss">Red values</span> = this position is costing you money in funding fees.
              <span className="text-profit"> Green values</span> = this position is earning you funding.
              <br />
              Funding is charged every hour on Hyperliquid. When more traders are long than short, longs pay shorts (and vice versa).
              The rate adjusts based on how far the perpetual price deviates from spot.
            </p>
          </div>
        </>
      ) : (
        <p className="py-4 text-center text-sm text-muted">
          No open positions found for this address
        </p>
      )}
    </div>
  );
}
