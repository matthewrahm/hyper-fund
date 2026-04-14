import type { CostData } from "@/lib/api";
import { formatSignedCurrency, formatCurrency } from "@/lib/utils";
import NumberCell from "./NumberCell";

function StatCard({
  label,
  value,
  colorize = false,
}: {
  label: string;
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
      <div className="label mb-1">{label}</div>
      <div className={`num text-lg font-semibold ${color}`}>
        {colorize ? formatSignedCurrency(value) : formatCurrency(value)}
      </div>
    </div>
  );
}

export default function CostBreakdown({ data }: { data: CostData }) {
  const sortedPositions = [...data.positions].sort(
    (a, b) => Math.abs(b.hourly_cost) - Math.abs(a.hourly_cost)
  );

  return (
    <div>
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-4">
        <StatCard label="Account Value" value={data.account_value} />
        <StatCard label="Hourly" value={data.total_hourly} colorize />
        <StatCard label="Daily" value={data.total_daily} colorize />
        <StatCard label="Monthly" value={data.total_monthly} colorize />
      </div>

      {/* Position table */}
      {sortedPositions.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">Coin</th>
                  <th className="table-header text-left">Side</th>
                  <th className="table-header text-right">Size</th>
                  <th className="table-header text-right hidden sm:table-cell">Mark Price</th>
                  <th className="table-header text-right">Rate/h</th>
                  <th className="table-header text-right">Cost/h</th>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map((p) => (
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
                        {p.size.toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}
                      </span>
                    </td>
                    <td className="table-cell text-right hidden sm:table-cell">
                      <span className="num text-secondary">
                        ${p.mark_price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <NumberCell value={p.funding_rate} format="rate" colorize />
                    </td>
                    <td className="table-cell text-right">
                      <span
                        className={`num font-medium ${
                          p.hourly_cost > 0
                            ? "text-loss"
                            : p.hourly_cost < 0
                              ? "text-profit"
                              : "text-secondary"
                        }`}
                      >
                        {formatSignedCurrency(p.hourly_cost)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            (+) = you are paying &nbsp; (-) = you are earning
          </p>
        </>
      ) : (
        <p className="py-4 text-center text-sm text-muted">
          No open positions found
        </p>
      )}
    </div>
  );
}
