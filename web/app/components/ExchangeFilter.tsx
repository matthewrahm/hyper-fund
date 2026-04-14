"use client";

const ALL_EXCHANGES = ["Hyperliquid", "Binance", "Bybit", "OKX", "Gate.io"];

const EXCHANGE_COLORS: Record<string, string> = {
  Hyperliquid: "#00C853",
  Binance: "#F0B90B",
  Bybit: "#F7A600",
  OKX: "#FFFFFF",
  "Gate.io": "#2354E6",
};

export default function ExchangeFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (exchanges: string[]) => void;
}) {
  const allSelected = selected.length === 0;

  const toggle = (exchange: string) => {
    if (allSelected) {
      // From "all" mode, select only this one
      onChange([exchange]);
    } else if (selected.includes(exchange)) {
      const next = selected.filter((e) => e !== exchange);
      onChange(next.length === 0 ? [] : next); // empty = all
    } else {
      const next = [...selected, exchange];
      // If all are selected, clear to "all" mode
      onChange(next.length === ALL_EXCHANGES.length ? [] : next);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="label mr-1">Exchanges</span>
      {ALL_EXCHANGES.map((ex) => {
        const isActive = allSelected || selected.includes(ex);
        const color = EXCHANGE_COLORS[ex] || "#a1a1aa";
        return (
          <button
            key={ex}
            onClick={() => toggle(ex)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
            style={{
              background: isActive
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.02)",
              color: isActive ? "#fafafa" : "#71717a",
              border: `1px solid ${
                isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"
              }`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: isActive ? color : "#555",
              }}
            />
            {ex}
          </button>
        );
      })}
    </div>
  );
}
