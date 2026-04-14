"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getCoinRates, type FundingRate } from "@/lib/api";
import NumberCell from "./NumberCell";
import RateBar from "./RateBar";

export default function CoinDetail({
  coin,
  onClose,
}: {
  coin: string;
  onClose: () => void;
}) {
  const [rates, setRates] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCoinRates(coin)
      .then(setRates)
      .catch(() => setRates([]))
      .finally(() => setLoading(false));
  }, [coin]);

  const sorted = [...rates].sort((a, b) => a.rate - b.rate);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const spread = lowest && highest ? highest.rate - lowest.rate : 0;
  const spreadAnn = spread * 24 * 365 * 100;

  return (
    <div className="card p-5 mb-6 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-md text-muted transition-colors hover:text-primary hover:bg-[rgba(255,255,255,0.06)]"
      >
        <X size={16} />
      </button>

      <div className="label mb-1">Detail</div>
      <h3 className="text-lg font-semibold text-primary mb-4">{coin}</h3>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-full" />
          ))}
        </div>
      ) : rates.length === 0 ? (
        <p className="text-sm text-muted">No data found for {coin}</p>
      ) : (
        <>
          <RateBar rates={rates} />

          <table className="w-full mt-4">
            <thead>
              <tr>
                <th className="table-header text-left">Exchange</th>
                <th className="table-header text-right">Rate/h</th>
                <th className="table-header text-right">Ann. %</th>
                <th className="table-header text-right hidden sm:table-cell">Interval</th>
                <th className="table-header text-right hidden sm:table-cell">Mark Price</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.exchange} className="table-row">
                  <td className="table-cell text-primary font-medium">
                    {r.exchange}
                  </td>
                  <td className="table-cell text-right">
                    <NumberCell value={r.rate} format="rate" colorize />
                  </td>
                  <td className="table-cell text-right">
                    <NumberCell
                      value={r.rate * 24 * 365 * 100}
                      format="pct"
                      colorize
                    />
                  </td>
                  <td className="table-cell text-right hidden sm:table-cell">
                    <span className="num text-muted">{r.interval_hours}h</span>
                  </td>
                  <td className="table-cell text-right hidden sm:table-cell">
                    {r.mark_price > 0 ? (
                      <span className="num text-secondary">
                        ${r.mark_price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    ) : (
                      <span className="text-muted">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {spread > 0 && lowest && highest && (
            <div className="mt-4 rounded-lg p-3" style={{ background: "rgba(99,102,241,0.06)" }}>
              <p className="text-sm text-secondary">
                <span className="text-profit font-medium">Long {lowest.exchange}</span>
                {" / "}
                <span className="text-loss font-medium">Short {highest.exchange}</span>
                {" -- "}
                <span className="num text-primary font-medium">
                  {(spread * 10_000).toFixed(1)}bp
                </span>
                {" ("}
                <span className="num text-profit">{spreadAnn.toFixed(1)}%</span>
                {" ann)"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
