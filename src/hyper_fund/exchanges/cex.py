import ccxt.async_support as ccxt_async

from hyper_fund.models import FundingRate, from_ccxt_symbol


EXCHANGE_NAMES = {
    "binance": "Binance",
    "bybit": "Bybit",
    "okx": "OKX",
    "gate": "Gate.io",
}

# Funding intervals per exchange (in hours)
FUNDING_INTERVALS = {
    "binance": 8,
    "bybit": 8,
    "okx": 8,
    "gate": 8,
}


class CexClient:
    """Client for fetching funding rates from a CEX via ccxt."""

    def __init__(self, exchange_id: str):
        self.exchange_id = exchange_id
        self.display_name = EXCHANGE_NAMES.get(exchange_id, exchange_id)
        self.interval_hours = FUNDING_INTERVALS.get(exchange_id, 8)
        self._exchange = None

    def _get_exchange(self):
        if self._exchange is None:
            exchange_class = getattr(ccxt_async, self.exchange_id)
            self._exchange = exchange_class({"options": {"defaultType": "swap"}})
        return self._exchange

    async def get_funding_rates(self) -> list[FundingRate]:
        """Fetch current funding rates, normalized to hourly."""
        exchange = self._get_exchange()
        try:
            raw = await exchange.fetch_funding_rates()
        except Exception:
            return []

        rates = []
        for symbol, data in raw.items():
            if not symbol.endswith("/USDT:USDT"):
                continue

            raw_rate = data.get("fundingRate")
            if raw_rate is None:
                continue

            coin = from_ccxt_symbol(symbol)
            hourly = raw_rate / self.interval_hours

            rates.append(FundingRate(
                coin=coin,
                exchange=self.display_name,
                rate=hourly,
                raw_rate=raw_rate,
                interval_hours=self.interval_hours,
                mark_price=float(data.get("markPrice") or 0),
            ))

        return rates

    async def close(self):
        if self._exchange is not None:
            await self._exchange.close()
