# hyper-fund

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![Hyperliquid](https://img.shields.io/badge/Hyperliquid-API-00C853)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

Cross-exchange funding rate scanner for Hyperliquid perpetuals.

Perpetual futures use funding rates to keep prices anchored to spot. These rates diverge between exchanges constantly -- when Hyperliquid funding is +0.05% and Binance is -0.01%, there's a delta-neutral arbitrage opportunity. This bot aggregates funding rates across 5 exchanges, surfaces the best spreads, and alerts you when opportunities appear.

<!-- ![Demo](demo.gif) -->

## Features

### Cross-Exchange Spread Detection

Scans funding rates across Hyperliquid, Binance, Bybit, OKX, and Gate.io simultaneously. Identifies the highest-spread coins where you can go long on one exchange and short on another to capture the funding differential with zero directional risk. All rates normalized to hourly for fair comparison across different funding intervals.

### Predicted Funding Rates

Hyperliquid exposes predicted next funding rates -- data no CEX makes public. The bot surfaces these predictions alongside Binance and Bybit predicted rates (pulled from Hyperliquid's cross-venue feed), letting you position before the next settlement.

### Funding Cost Calculator

Enter any Hyperliquid address to see exactly how much funding is costing (or earning) per hour, day, and month across all open positions. Most traders don't track this -- it silently eats into PnL on leveraged positions.

### Threshold Alerts

Set alerts for specific coins when the cross-exchange funding spread exceeds your threshold. Background polling every 60 seconds with a 30-minute cooldown to prevent spam. Alerts persist across bot restarts via JSON storage.

## How It Works

The aggregator pulls data from multiple sources concurrently:

| Source | Data | Method |
|--------|------|--------|
| Hyperliquid | Current funding rates, mark prices, OI | REST API via SDK |
| Hyperliquid | Predicted funding (HL, Binance, Bybit) | Raw REST POST |
| OKX | Current funding rates | ccxt async |
| Gate.io | Current funding rates | ccxt async |

All rates are normalized to a per-hour basis. Hyperliquid settles hourly, while most CEXs settle every 4-8 hours. The spread is computed as `max_rate - min_rate` for each coin available on 2+ exchanges, then annualized.

Annualized return formula: `spread_per_hour * 24 * 365`

## Architecture

```
Web Dashboard (Next.js)          Telegram Bot
         |                            |
         v                            v
    FastAPI REST ---- FundingAggregator ---- TTLCache
                        /    |    \
                       v     v     v
                HyperliquidClient  CexClient (OKX, Gate.io)
                       |               |
                       v               v
                api.hyperliquid.xyz   ccxt async
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind v4 |
| API | FastAPI, uvicorn |
| Data Layer | Python 3.11+ |
| Hyperliquid API | hyperliquid-python-sdk + httpx |
| CEX APIs | ccxt (async) |
| Telegram | python-telegram-bot v22 |
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

### Run (Web Dashboard)

```bash
# Option 1: Both servers at once
./scripts/dev.sh

# Option 2: Separately
uv run uvicorn api.main:app --reload --port 8000
cd web && npm run dev
```

Open http://localhost:3000

### Run (Telegram Bot)

```bash
cp .env.example .env
# Add your TELEGRAM_BOT_TOKEN to .env
uv run hyper-fund
```

### Configure

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | For Telegram bot | Token from @BotFather |
| `NEXT_PUBLIC_API_URL` | Optional | FastAPI URL (default: http://localhost:8000) |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/spreads?limit=20` | Top funding rate spreads |
| `GET /api/rates` | All rates across exchanges |
| `GET /api/rates/{coin}` | Rates for a specific coin |
| `GET /api/predicted` | Predicted next funding rates |
| `GET /api/cost/{address}` | Funding cost for HL address |
| `GET /api/health` | Exchange connectivity status |

## Telegram Commands

| Command | Description |
|---------|-------------|
| `/funding` | Top 15 cross-exchange funding spreads |
| `/funding SOL` | Detailed rates for a coin |
| `/predicted` | Predicted next funding rates |
| `/cost 0x...` | Funding cost for a Hyperliquid address |
| `/alert SOL 4.0` | Alert when spread exceeds threshold |
| `/alert list` | View active alerts |
| `/alert remove SOL` | Remove an alert |

## Project Structure

```
hyper-fund/
  pyproject.toml              # Python dependencies
  api/                        # FastAPI backend
    main.py                   # App setup, CORS, lifespan
    routes.py                 # REST endpoint handlers
    schemas.py                # Pydantic response models
  src/hyper_fund/             # Core data layer
    core.py                   # FundingAggregator
    models.py                 # FundingRate, FundingSpread
    cache.py                  # TTL cache
    alerts.py                 # Alert manager
    exchanges/
      hyperliquid.py          # Hyperliquid client
      cex.py                  # CEX client (ccxt)
    bot/
      handlers.py             # Telegram handlers
      formatters.py           # Message formatting
  web/                        # Next.js frontend
    app/
      page.tsx                # Dashboard page
      globals.css             # Design system tokens
      components/             # UI components
      hooks/                  # useAutoRefresh
    lib/
      api.ts                  # Typed API client
      utils.ts                # Formatters, helpers
  scripts/
    dev.sh                    # Run both servers
    test_hl.py                # Hyperliquid test
    test_cex.py               # Cross-exchange test
```

## License

MIT
