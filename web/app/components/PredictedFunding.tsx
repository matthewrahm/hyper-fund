"use client";

import { useCallback } from "react";
import { getPredicted, getRates, type PredictedCoin } from "@/lib/api";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import SectionHeading from "./SectionHeading";
import NumberCell from "./NumberCell";

const VENUES = ["Hyperliquid", "Binance", "Bybit"];

// The coins we always want to show, in display order
const DISPLAY_COINS = [
  "BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA",
  "LINK", "AVAX", "DOT", "SUI", "APT", "NEAR", "HYPE",
  "ARB", "OP", "UNI", "AAVE", "LTC", "PENDLE",
];

export default function PredictedFunding() {
  const fetchData = useCallback(async () => {
    const [predicted, rates] = await Promise.all([
      getPredicted(),
      getRates(["Hyperliquid"]),
    ]);

    const predictedMap = new Map(predicted.map((p) => [p.coin, p]));

    // Build rows for all display coins, using predicted data when available
    // and falling back to current rate
    const rows: PredictedCoin[] = DISPLAY_COINS.map((coin) => {
      const pred = predictedMap.get(coin);
      if (pred) return pred;

      // Fallback: use current HL rate as "predicted"
      const hlRate = rates.find((r) => r.coin === coin);
      if (hlRate) {
        return {
          coin,
          venues: [{
            venue: "Hyperliquid",
            rate: hlRate.raw_rate,
            interval_hours: 1,
            hourly_rate: hlRate.rate,
            annualized_pct: hlRate.rate * 24 * 365 * 100,
          }],
        };
      }

      return { coin, venues: [] };
    }).filter((p) => p.venues.length > 0);

    return rows;
  }, []);

  const { data: predicted, loading } = useAutoRefresh(fetchData, 30_000);

  return (
    <section className="card p-5 mb-6">
      <SectionHeading>Predicted Funding</SectionHeading>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-full" />
          ))}
        </div>
      ) : !predicted || predicted.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          No predicted funding data
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Coin</th>
                {VENUES.map((v) => (
                  <th key={v} className="table-header text-right">
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {predicted.map((p) => {
                const venueMap = new Map(
                  p.venues.map((v) => [v.venue, v])
                );

                return (
                  <tr key={p.coin} className="table-row">
                    <td className="table-cell font-medium text-primary">
                      {p.coin}
                    </td>
                    {VENUES.map((venueName) => {
                      const venue = venueMap.get(venueName);
                      return (
                        <td
                          key={venueName}
                          className="table-cell text-right"
                        >
                          {venue ? (
                            <NumberCell
                              value={venue.annualized_pct}
                              format="pct"
                              colorize
                            />
                          ) : (
                            <span className="text-muted">--</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="text-xs text-muted leading-relaxed">
          <span className="text-loss">Negative %</span> = perp trading below spot. Shorts pay longs. Good for longing (you earn funding).
          <br />
          <span className="text-profit">Positive %</span> = perp trading above spot. Longs pay shorts. Good for shorting (you earn funding).
          <br />
          Rates shown are annualized from the predicted next hourly settlement.
        </p>
      </div>
    </section>
  );
}
