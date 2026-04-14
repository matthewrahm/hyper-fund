# hyper-fund

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![Hyperliquid](https://img.shields.io/badge/Hyperliquid-API-00C853)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

Cross-exchange funding rate scanner for Hyperliquid perpetuals.

Perpetual futures use funding rates to keep prices anchored to spot. These rates diverge between exchanges constantly -- when Hyperliquid funding is +0.05% and Binance is -0.01%, there's a delta-neutral arbitrage opportunity. This tool aggregates funding rates across 5 exchanges and 8 HIP-3 deployers, surfaces the best spreads, and shows you exactly how much funding is costing or earning on any wallet.

<!-- ![Demo](demo.gif) -->

## Features

### Position Funding Tracker

Enter any Hyperliquid wallet address to see how much funding is costing or earning across all open positions. Shows a plain-English summary ("This wallet is paying $47/day"), stat cards for hourly/daily/monthly impact, and a per-position breakdown. Most traders don't track this -- funding silently compounds into PnL on leveraged positions.

### Cross-Exchange Spread Detection

Scans funding rates across Hyperliquid, Binance, Bybit, OKX, and Gate.io simultaneously. Identifies the highest-spread coins where you can go long on one exchange and short on another to capture the funding differential with zero directional risk. All rates normalized to hourly for fair comparison across different settlement intervals.

### Exchange Filter

Toggle individual exchanges on or off to compare specific venues. Single-exchange mode shows that exchange's funding rates for major assets ranked by magnitude. Multi-exchange mode shows cross-exchange spread opportunities.

### HIP-3 Markets

Fetches all HIP-3 deployer DEXs (Trade[XYZ], Flexidex, Vantol, Hyena, KM, Cash, Para) bringing in 130+ additional assets: commodities (GOLD, SILVER, OIL, NATGAS, COPPER), stock indices (S&P 500, NASDAQ, Nikkei), individual stocks (TSLA, NVDA, AAPL, GOOGL), and forex (EUR, JPY). Multiple deployers listing the same underlying creates intra-Hyperliquid funding spreads.

### Predicted Funding Rates

Hyperliquid exposes predicted next funding rates -- data no CEX makes public. Shows predictions for major crypto assets (BTC, ETH, SOL, and top 20 coins) alongside Binance and Bybit predicted rates pulled from Hyperliquid's cross-venue feed. Falls back to current rates when predicted data is unavailable.

### Funding Rate Guide

Built-in educational section explaining how funding rates work, who pays who, the cost formula with worked examples, why rates differ between exchanges, and how funding rate arbitrage works. Designed for traders who are new to perpetuals.

## How It Works

The aggregator pulls data from multiple sources concurrently:

| Source | Data | Method |
|--------|------|--------|
| Hyperliquid (Default DEX) | Current funding rates, mark prices, OI | REST API via SDK |
| Hyperliquid (HIP-3 DEXs) | Commodities, stocks, forex rates | REST via `perpDexs` + `metaAndAssetCtxs` |
| Hyperliquid | Predicted funding (HL, Binance, Bybit) | Raw REST POST (`predictedFundings`) |
| OKX | Current funding rates | ccxt async |
| Gate.io | Current funding rates | ccxt async |

Binance and Bybit rates come from Hyperliquid's `predictedFundings` endpoint which includes cross-venue data, bypassing geo-blocking restrictions.

All rates are normalized to a per-hour basis. Hyperliquid settles hourly, while most CEXs settle every 4-8 hours. The spread is computed as `max_rate - min_rate` for each coin available on 2+ exchanges, then annualized.

## Architecture

```
Web Dashboard (Next.js)
         |
         v
    FastAPI REST ---- FundingAggregator ---- TTLCache
                        /    |    \
                       v     v     v
              HyperliquidClient  CexClient (OKX, Gate.io)
                 |         |               |
                 v         v               v
            Default DEX  HIP-3 DEXs    ccxt async
              (190)     (8 deployers)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind v4, Geist fonts |
| API | FastAPI, uvicorn |
| Data Layer | Python 3.11+ |
| Hyperliquid API | hyperliquid-python-sdk + httpx |
| CEX APIs | ccxt (async) |
| Caching | In-memory TTL cache (30-60s) |

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) package manager

### Install

```bash
git clone https://github.com/matthewrahm/hyper-fund.git
cd hyper-fund
cd web && npm install && cd ..
```

### Run

```bash
# Both servers at once
./scripts/dev.sh

# Or separately
uv run uvicorn api.main:app --reload --port 8000
cd web && npm run dev
```

Open http://localhost:3000

### Configure

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Optional | FastAPI URL (default: http://localhost:8000) |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/spreads?limit=20&exchanges=` | Top funding rate spreads, filterable by exchange |
| `GET /api/rates?exchanges=` | All rates, filterable by exchange |
| `GET /api/rates/{coin}` | Rates for a specific coin across all exchanges |
| `GET /api/predicted` | Predicted next funding rates sorted by magnitude |
| `GET /api/cost/{address}` | Funding cost breakdown for a Hyperliquid address |
| `GET /api/health` | Exchange connectivity status |
| `GET /api/exchanges` | List of available exchanges and HIP-3 DEXs |

## Project Structure

```
hyper-fund/
  pyproject.toml              # Python dependencies
  api/                        # FastAPI backend
    main.py                   # App, CORS, lifespan
    routes.py                 # REST endpoints
    schemas.py                # Pydantic response models
  src/hyper_fund/             # Core data layer
    core.py                   # FundingAggregator
    models.py                 # FundingRate, FundingSpread
    cache.py                  # TTL cache
    alerts.py                 # Alert manager (Telegram)
    exchanges/
      hyperliquid.py          # HL client (default + HIP-3 DEXs)
      cex.py                  # CEX client (ccxt async)
    bot/                      # Telegram bot (optional)
      handlers.py
      formatters.py
  web/                        # Next.js dashboard
    app/
      page.tsx                # Dashboard layout
      globals.css             # Design system tokens
      components/
        Header.tsx            # Branding + exchange health
        AddressLookup.tsx     # Wallet input + cost results
        CostBreakdown.tsx     # Position funding breakdown
        ExchangeFilter.tsx    # Exchange toggle buttons
        SpreadTable.tsx       # Spread leaderboard / rate table
        CoinDetail.tsx        # Expandable coin detail + SVG bars
        PredictedFunding.tsx  # Predicted rates for majors
        FundingGuide.tsx      # Educational explainer
        ExchangeBadge.tsx     # Branded exchange badges
        NumberCell.tsx        # Formatted monospace numbers
        SectionHeading.tsx    # Reusable section label
        RateBar.tsx           # SVG horizontal bar chart
      hooks/
        useAutoRefresh.ts     # 30s interval refresh
    lib/
      api.ts                  # Typed fetch wrappers
      utils.ts                # Formatters, cn()
      majors.ts               # Curated major asset list
  scripts/
    dev.sh                    # Run both servers
    test_hl.py                # Hyperliquid test
    test_cex.py               # Cross-exchange test
```

## License

MIT
