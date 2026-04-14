import asyncio
import logging
from collections import defaultdict

from hyper_fund.exchanges.hyperliquid import HyperliquidClient
from hyper_fund.exchanges.cex import CexClient
from hyper_fund.models import FundingRate, FundingSpread
from hyper_fund.cache import TTLCache

logger = logging.getLogger(__name__)

# Cache TTLs in seconds
HL_CACHE_TTL = 30
CEX_CACHE_TTL = 60
USER_CACHE_TTL = 15


class FundingAggregator:
    """Aggregates funding rates across Hyperliquid and CEXs."""

    VENUE_MAP = {
        "BinPerp": "Binance",
        "BybitPerp": "Bybit",
        "HlPerp": "Hyperliquid",
    }

    def __init__(self):
        self.hl = HyperliquidClient()
        self.cex_clients = [
            CexClient("okx"),
            CexClient("gate"),
        ]
        self._cache = TTLCache()
        self.failed_exchanges: list[str] = []

    def _get_hl_data(self) -> tuple[list[FundingRate], list[FundingRate]]:
        """Fetch HL rates and predicted cross-venue rates."""
        cached = self._cache.get("hl_data")
        if cached is not None:
            return cached

        try:
            raw = self.hl.get_funding_rates()
        except Exception as e:
            logger.error(f"Hyperliquid rates failed: {e}")
            return [], []

        hl_rates = [
            FundingRate(
                coin=r["coin"],
                exchange="Hyperliquid",
                rate=r["funding_rate"],
                raw_rate=r["funding_rate"],
                interval_hours=1,
                mark_price=r["mark_price"],
                open_interest=r["open_interest"],
                dex=r.get("dex", "Hyperliquid"),
            )
            for r in raw
        ]

        try:
            predicted = self.hl.get_predicted_funding()
        except Exception as e:
            logger.error(f"Hyperliquid predicted funding failed: {e}")
            predicted = []

        predicted_rates = []
        for entry in predicted:
            for v in entry["venues"]:
                venue = v["venue"]
                display = self.VENUE_MAP.get(venue)
                if display and display != "Hyperliquid":
                    hourly = v["rate"] / v["interval_hours"]
                    predicted_rates.append(FundingRate(
                        coin=entry["coin"],
                        exchange=display,
                        rate=hourly,
                        raw_rate=v["rate"],
                        interval_hours=v["interval_hours"],
                    ))

        result = (hl_rates, predicted_rates)
        self._cache.set("hl_data", result, HL_CACHE_TTL)
        return result

    async def _get_cex_rates(self, client: CexClient) -> list[FundingRate]:
        """Fetch rates from a CEX with caching and error handling."""
        cache_key = f"cex_{client.exchange_id}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            rates = await client.get_funding_rates()
            self._cache.set(cache_key, rates, CEX_CACHE_TTL)
            return rates
        except Exception as e:
            logger.error(f"{client.display_name} failed: {e}")
            self.failed_exchanges.append(client.display_name)
            return []

    def get_all_exchanges(self) -> list[str]:
        """Return all exchange names available."""
        return ["Hyperliquid", "Binance", "Bybit", "OKX", "Gate.io"]

    def get_all_dexs(self) -> list[str]:
        """Return all HIP-3 DEX names."""
        return list(self.hl.DEX_NAMES.values())

    async def get_all_rates(self, exchanges: list[str] | None = None) -> list[FundingRate]:
        """Fetch funding rates from all exchanges concurrently."""
        self.failed_exchanges = []

        loop = asyncio.get_event_loop()
        hl_task = loop.run_in_executor(None, self._get_hl_data)
        cex_tasks = [self._get_cex_rates(client) for client in self.cex_clients]

        results = await asyncio.gather(hl_task, *cex_tasks, return_exceptions=True)

        all_rates = []

        if not isinstance(results[0], Exception):
            hl_rates, predicted_rates = results[0]
            all_rates.extend(hl_rates)
            all_rates.extend(predicted_rates)
        else:
            logger.error(f"Hyperliquid failed: {results[0]}")
            self.failed_exchanges.append("Hyperliquid")

        for result in results[1:]:
            if isinstance(result, Exception):
                continue
            all_rates.extend(result)

        # Filter by exchange if specified
        if exchanges:
            exchanges_set = set(exchanges)
            all_rates = [r for r in all_rates if r.exchange in exchanges_set]

        return all_rates

    async def get_top_spreads(self, n: int = 10, exchanges: list[str] | None = None) -> list[FundingSpread]:
        """Find top N funding rate spreads across exchanges."""
        rates = await self.get_all_rates(exchanges)

        by_coin: dict[str, list[FundingRate]] = defaultdict(list)
        for r in rates:
            by_coin[r.coin].append(r)

        spreads = []
        for coin, coin_rates in by_coin.items():
            if len(coin_rates) < 2:
                continue

            coin_rates.sort(key=lambda r: r.rate)
            lowest = coin_rates[0]
            highest = coin_rates[-1]

            spread = highest.rate - lowest.rate
            if spread <= 0:
                continue

            spreads.append(FundingSpread(
                coin=coin,
                long_exchange=lowest.exchange,
                short_exchange=highest.exchange,
                spread=spread,
                long_rate=lowest.rate,
                short_rate=highest.rate,
            ))

        spreads.sort(key=lambda s: s.spread, reverse=True)
        return spreads[:n]

    async def get_coin_detail(self, coin: str) -> list[FundingRate]:
        """Get funding rates for a specific coin across all exchanges."""
        rates = await self.get_all_rates()
        coin_upper = coin.upper()
        return [r for r in rates if r.coin == coin_upper]

    async def close(self):
        for client in self.cex_clients:
            await client.close()
