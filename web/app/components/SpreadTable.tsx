"use client";

import { useEffect, useState } from "react";
import { getSpreads, type FundingSpread } from "@/lib/api";
import ExchangeBadge from "./ExchangeBadge";
import NumberCell from "./NumberCell";

export default function SpreadTable({
  onSelectCoin,
  selectedCoin,
}: {
  onSelectCoin: (coin: string | null) => void;
  selectedCoin: string | null;
}) {
  const [spreads, setSpreads] = useState<FundingSpread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpreads(20)
      .then(setSpreads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card p-5 mb-6">
      <div className="label mb-4">Funding Rate Spreads</div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : spreads.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No spread data available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left w-8">#</th>
                <th className="table-header text-left">Coin</th>
                <th className="table-header text-left">Long</th>
                <th className="table-header text-left">Short</th>
                <th className="table-header text-right">Spread</th>
                <th className="table-header text-right">Ann. %</th>
                <th className="table-header text-right hidden sm:table-cell">Long Rate</th>
                <th className="table-header text-right hidden sm:table-cell">Short Rate</th>
              </tr>
            </thead>
            <tbody>
              {spreads.map((s, i) => {
                const isSelected = selectedCoin === s.coin;
                return (
                  <tr
                    key={s.coin}
                    className="table-row cursor-pointer transition-colors"
                    style={{
                      background: isSelected
                        ? "rgba(99, 102, 241, 0.08)"
                        : undefined,
                    }}
                    onClick={() =>
                      onSelectCoin(isSelected ? null : s.coin)
                    }
                  >
                    <td className="table-cell text-muted text-xs">{i + 1}</td>
                    <td className="table-cell font-medium text-primary">
                      {s.coin}
                    </td>
                    <td className="table-cell">
                      <ExchangeBadge name={s.long_exchange} />
                    </td>
                    <td className="table-cell">
                      <ExchangeBadge name={s.short_exchange} />
                    </td>
                    <td className="table-cell text-right">
                      <NumberCell value={s.spread_bps} format="bps" colorize />
                    </td>
                    <td className="table-cell text-right">
                      <NumberCell value={s.annualized_pct} format="pct" colorize />
                    </td>
                    <td className="table-cell text-right hidden sm:table-cell">
                      <NumberCell value={s.long_rate} format="rate" colorize />
                    </td>
                    <td className="table-cell text-right hidden sm:table-cell">
                      <NumberCell value={s.short_rate} format="rate" colorize />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
