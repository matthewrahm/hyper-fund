"use client";

import { useCallback } from "react";
import { getSpreads, getRates, type FundingSpread, type FundingRate } from "@/lib/api";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import { isMajor } from "@/lib/majors";
import ExchangeBadge from "./ExchangeBadge";
import NumberCell from "./NumberCell";

type TableData =
  | { mode: "spreads"; data: FundingSpread[] }
  | { mode: "rates"; data: FundingRate[] };

export default function SpreadTable({
  onSelectCoin,
  selectedCoin,
  exchanges,
}: {
  onSelectCoin: (coin: string | null) => void;
  selectedCoin: string | null;
  exchanges: string[];
}) {
  const singleExchange = exchanges.length === 1;

  const fetchData = useCallback(async (): Promise<TableData> => {
    if (singleExchange) {
      const rates = await getRates(exchanges);
      const sorted = rates
        .filter((r) => isMajor(r.coin))
        .sort((a, b) => Math.abs(b.rate) - Math.abs(a.rate))
        .slice(0, 20);
      return { mode: "rates", data: sorted };
    }
    const spreads = await getSpreads(20, exchanges.length > 0 ? exchanges : undefined);
    return { mode: "spreads", data: spreads };
  }, [exchanges, singleExchange]);

  const { data: tableData, loading } = useAutoRefresh(fetchData, 30_000);

  const title = singleExchange
    ? `${exchanges[0]} Funding Rates`
    : "Funding Rate Spreads";

  return (
    <section className="card p-5 mb-6">
      <div className="label mb-4">{title}</div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : !tableData || tableData.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No data available</p>
      ) : tableData.mode === "rates" ? (
        <RatesView
          rates={tableData.data}
          onSelectCoin={onSelectCoin}
          selectedCoin={selectedCoin}
        />
      ) : (
        <SpreadsView
          spreads={tableData.data}
          onSelectCoin={onSelectCoin}
          selectedCoin={selectedCoin}
        />
      )}
    </section>
  );
}

function SpreadsView({
  spreads,
  onSelectCoin,
  selectedCoin,
}: {
  spreads: FundingSpread[];
  onSelectCoin: (coin: string | null) => void;
  selectedCoin: string | null;
}) {
  return (
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
                  background: isSelected ? "rgba(99, 102, 241, 0.08)" : undefined,
                }}
                onClick={() => onSelectCoin(isSelected ? null : s.coin)}
              >
                <td className="table-cell text-muted text-xs">{i + 1}</td>
                <td className="table-cell font-medium text-primary">{s.coin}</td>
                <td className="table-cell"><ExchangeBadge name={s.long_exchange} /></td>
                <td className="table-cell"><ExchangeBadge name={s.short_exchange} /></td>
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
  );
}

function RatesView({
  rates,
  onSelectCoin,
  selectedCoin,
}: {
  rates: FundingRate[];
  onSelectCoin: (coin: string | null) => void;
  selectedCoin: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-header text-left w-8">#</th>
            <th className="table-header text-left">Coin</th>
            <th className="table-header text-right">Rate/h</th>
            <th className="table-header text-right">Ann. %</th>
            <th className="table-header text-right hidden sm:table-cell">Mark Price</th>
            <th className="table-header text-right hidden sm:table-cell">Open Interest</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((r, i) => {
            const ann = r.rate * 24 * 365 * 100;
            const isSelected = selectedCoin === r.coin;
            return (
              <tr
                key={r.coin}
                className="table-row cursor-pointer transition-colors"
                style={{
                  background: isSelected ? "rgba(99, 102, 241, 0.08)" : undefined,
                }}
                onClick={() => onSelectCoin(isSelected ? null : r.coin)}
              >
                <td className="table-cell text-muted text-xs">{i + 1}</td>
                <td className="table-cell font-medium text-primary">{r.coin}</td>
                <td className="table-cell text-right">
                  <NumberCell value={r.rate} format="rate" colorize />
                </td>
                <td className="table-cell text-right">
                  <NumberCell value={ann} format="pct" colorize />
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
                <td className="table-cell text-right hidden sm:table-cell">
                  {r.open_interest > 0 ? (
                    <span className="num text-secondary">
                      {r.open_interest.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  ) : (
                    <span className="text-muted">--</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
