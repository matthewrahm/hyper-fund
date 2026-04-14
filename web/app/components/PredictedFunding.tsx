"use client";

import { useCallback } from "react";
import { getPredicted, type PredictedCoin } from "@/lib/api";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import SectionHeading from "./SectionHeading";
import NumberCell from "./NumberCell";

const VENUES = ["Hyperliquid", "Binance", "Bybit"];

// Only show coins people actually care about
const MAJOR_COINS = new Set([
  "BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "LINK", "AVAX",
  "DOT", "SUI", "APT", "ARB", "OP", "NEAR", "RENDER", "TAO", "INJ",
  "HYPE", "TIA", "JUP", "WIF", "PENDLE", "AAVE", "UNI", "LTC",
  // HIP-3 majors
  "xyz:GOLD", "xyz:SILVER", "xyz:CL", "xyz:BRENTOIL", "xyz:NATGAS",
  "xyz:COPPER", "xyz:SP500", "xyz:TSLA", "xyz:NVDA", "xyz:AAPL",
  "xyz:GOOGL", "xyz:AMZN", "xyz:META", "xyz:MSFT", "xyz:EUR", "xyz:JPY",
  "km:GOLD", "km:SILVER", "km:USOIL", "km:US500", "km:USTECH",
  "flx:GOLD", "flx:OIL", "flx:USA500",
]);

export default function PredictedFunding() {
  const fetchPredicted = useCallback(async () => {
    const all = await getPredicted();
    // Filter to majors, then sort by magnitude
    return all.filter((p) => MAJOR_COINS.has(p.coin));
  }, []);
  const { data: predicted, loading } = useAutoRefresh(fetchPredicted, 30_000);

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
    </section>
  );
}
