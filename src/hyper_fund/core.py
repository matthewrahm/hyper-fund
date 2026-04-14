import asyncio
from collections import defaultdict

from hyper_fund.exchanges.hyperliquid import HyperliquidClient
from hyper_fund.exchanges.cex import CexClient
from hyper_fund.models import FundingRate, FundingSpread


class FundingAggregator:
    """Aggregates funding rates across Hyperliquid and CEXs."""

    # Map predictedFundings venue names to display names
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

    def _get_hl_data(self) -> tuple[list[FundingRate], list[FundingRate]]:
        """Fetch HL rates and predicted cross-venue rates.

        Returns (hl_rates, predicted_rates) where predicted_rates
        includes BinPerp/BybitPerp data from HL's predictedFundings.
        """
        raw = self.hl.get_funding_rates()
        hl_rates = [
            FundingRate(
                coin=r["coin"],
                exchange="Hyperliquid",
                rate=r["funding_rate"],
                raw_rate=r["funding_rate"],
                interval_hours=1,
                mark_price=r["mark_price"],
                open_interest=r["open_interest"],
            )
            for r in raw
        ]

        # Predicted funding includes BinPerp and BybitPerp rates
        predicted = self.hl.get_predicted_funding()
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

        return hl_rates, predicted_rates

    async def get_all_rates(self) -> list[FundingRate]:
        """Fetch funding rates from all exchanges concurrently.

        Uses direct API for Hyperliquid, OKX, Gate.io.
        Uses HL's predictedFundings for Binance/Bybit rates.
        """
        loop = asyncio.get_event_loop()
        hl_task = loop.run_in_executor(None, self._get_hl_data)

        cex_tasks = [client.get_funding_rates() for client in self.cex_clients]

        results = await asyncio.gather(hl_task, *cex_tasks, return_exceptions=True)

        all_rates = []

        # HL data (tuple of hl_rates, predicted_rates)
        if not isinstance(results[0], Exception):
            hl_rates, predicted_rates = results[0]
            all_rates.extend(hl_rates)
            all_rates.extend(predicted_rates)

        # CEX data
        for result in results[1:]:
            if isinstance(result, Exception):
                continue
            all_rates.extend(result)

        return all_rates

    async def get_top_spreads(self, n: int = 10) -> list[FundingSpread]:
        """Find top N funding rate spreads across exchanges.

        For each coin available on 2+ exchanges, computes the spread
        between the highest and lowest funding rate.
        """
        rates = await self.get_all_rates()

        # Group by coin
        by_coin: dict[str, list[FundingRate]] = defaultdict(list)
        for r in rates:
            by_coin[r.coin].append(r)

        spreads = []
        for coin, coin_rates in by_coin.items():
            if len(coin_rates) < 2:
                continue

            # Sort by hourly rate
            coin_rates.sort(key=lambda r: r.rate)
            lowest = coin_rates[0]   # best to go long (pay least / earn most)
            highest = coin_rates[-1]  # best to go short (earn most)

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
