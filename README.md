# hyper-fund

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![Hyperliquid](https://img.shields.io/badge/Hyperliquid-API-00C853)
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
Telegram Bot
    |
    v
Command Handlers ---- FundingAggregator ---- TTLCache
    |                    /    |    \
    v                   v     v     v
AlertManager     HyperliquidClient  CexClient (OKX, Gate.io)
    |                   |               |
    v                   v               v
~/.hyper-fund/     api.hyperliquid.xyz   ccxt async
alerts.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.11+ |
| Package Manager | uv |
| Hyperliquid API | hyperliquid-python-sdk + httpx |
| CEX APIs | ccxt (async) |
| Telegram | python-telegram-bot v22 |
| Caching | In-memory TTL cache (30-60s) |
| Persistence | JSON file for alerts |

## Getting Started

### Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) package manager
- Telegram bot token from [@BotFather](https://t.me/BotFather)

### Install

```bash
git clone https://github.com/yourusername/hyper-fund.git
cd hyper-fund
cp .env.example .env
```

### Configure

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Token from @BotFather |

Edit `.env` with your bot token.

### Run

```bash
uv run hyper-fund
```

## Commands

| Command | Description |
|---------|-------------|
| `/funding` | Top 15 cross-exchange funding spreads |
| `/funding SOL` | Detailed rates for a coin across all exchanges |
| `/predicted` | Predicted next funding rates, sorted by magnitude |
| `/cost 0x...` | Hourly/daily/monthly funding cost for a Hyperliquid address |
| `/alert SOL 4.0` | Alert when SOL spread exceeds 4.0 basis points |
| `/alert list` | View active alerts |
| `/alert remove SOL` | Remove an alert |
| `/help` | Command reference |

## Project Structure

```
hyper-fund/
  pyproject.toml            # Dependencies and project metadata
  .env.example              # Environment variable template
  scripts/
    test_hl.py              # Standalone Hyperliquid test
    test_cex.py             # Cross-exchange aggregation test
  src/hyper_fund/
    main.py                 # Bot entry point
    models.py               # FundingRate, FundingSpread dataclasses
    core.py                 # FundingAggregator (merges all exchanges)
    cache.py                # TTL cache for API responses
    alerts.py               # Alert manager with JSON persistence
    exchanges/
      hyperliquid.py        # Hyperliquid client (SDK + raw REST)
      cex.py                # CEX client via ccxt async
    bot/
      handlers.py           # Telegram command handlers
      formatters.py         # Message formatting
```

## License

MIT
