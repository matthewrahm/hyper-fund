const EXCHANGE_COLORS: Record<string, string> = {
  Hyperliquid: "#00C853",
  Binance: "#F0B90B",
  Bybit: "#F7A600",
  OKX: "#FFFFFF",
  "Gate.io": "#2354E6",
};

export default function ExchangeBadge({ name }: { name: string }) {
  const color = EXCHANGE_COLORS[name] || "#a1a1aa";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium text-secondary"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}
