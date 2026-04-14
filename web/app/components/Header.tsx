"use client";

import { useEffect, useState } from "react";
import { getHealth, type HealthData } from "@/lib/api";

export default function Header() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => {});
  }, []);

  const allExchanges = ["Hyperliquid", "Binance", "Bybit", "OKX", "Gate.io"];

  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          hyper-fund
        </h1>
        <p className="mt-1 text-sm text-muted">
          Cross-exchange funding rate scanner
        </p>
      </div>
      <div className="flex items-center gap-3">
        {allExchanges.map((ex) => {
          const isUp = health?.exchanges[ex] === "up";
          return (
            <div key={ex} className="flex items-center gap-1.5" title={ex}>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: health
                    ? isUp
                      ? "#22c55e"
                      : "#ef4444"
                    : "#71717a",
                }}
              />
              <span className="hidden text-xs text-muted sm:inline">{ex}</span>
            </div>
          );
        })}
      </div>
    </header>
  );
}
