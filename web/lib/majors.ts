// Major assets worth showing in curated views
export const MAJORS = new Set([
  // Crypto L1s
  "BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "AVAX", "DOT", "SUI",
  "APT", "NEAR", "TON", "HYPE", "TIA", "SEI",
  // DeFi / Infrastructure
  "LINK", "UNI", "AAVE", "PENDLE", "INJ", "RENDER", "ARB", "OP",
  // Large caps
  "DOGE", "LTC", "XLM",
  // HIP-3: Commodities
  "xyz:GOLD", "xyz:SILVER", "xyz:CL", "xyz:BRENTOIL", "xyz:NATGAS",
  "xyz:COPPER", "xyz:PLATINUM", "xyz:PALLADIUM",
  "km:GOLD", "km:SILVER", "km:USOIL",
  "flx:GOLD", "flx:OIL",
  // HIP-3: Indices
  "xyz:SP500", "xyz:JP225", "xyz:KR200",
  "km:US500", "km:USTECH", "km:SMALL2000",
  "flx:USA500", "flx:USA100",
  "cash:USA500",
  // HIP-3: Stocks
  "xyz:TSLA", "xyz:NVDA", "xyz:AAPL", "xyz:GOOGL", "xyz:AMZN",
  "xyz:META", "xyz:MSFT", "xyz:PLTR", "xyz:COIN",
  "km:TSLA", "km:NVDA", "km:AAPL", "km:GOOGL",
  "cash:TSLA", "cash:NVDA",
  // HIP-3: FX
  "xyz:EUR", "xyz:JPY",
]);

export function isMajor(coin: string): boolean {
  return MAJORS.has(coin);
}
