import httpx
from hyperliquid.info import Info
from hyperliquid.utils import constants


class HyperliquidClient:
    """Client for fetching funding rate data from Hyperliquid."""

    API_URL = constants.MAINNET_API_URL

    def __init__(self):
        self.info = Info(self.API_URL, skip_ws=True)
        self._http = httpx.Client(timeout=10)

    def get_funding_rates(self) -> list[dict]:
        """Fetch current funding rates for all perps.

        Returns list of {coin, funding_rate, mark_price, open_interest}
        sorted by absolute funding rate descending.
        """
        data = self.info.meta_and_asset_ctxs()
        universe = data[0]["universe"]
        contexts = data[1]

        rates = []
        for asset, ctx in zip(universe, contexts):
            funding = float(ctx.get("funding", "0"))
            rates.append({
                "coin": asset["name"],
                "funding_rate": funding,
                "mark_price": float(ctx.get("markPx", "0")),
                "open_interest": float(ctx.get("openInterest", "0")),
            })

        rates.sort(key=lambda r: abs(r["funding_rate"]), reverse=True)
        return rates

    def get_predicted_funding(self) -> list[dict]:
        """Fetch predicted next funding rates.

        Uses raw REST call since the SDK doesn't expose this endpoint.
        Response format: [[coin, [[venue, {fundingRate, nextFundingTime, fundingIntervalHours}], ...]], ...]

        Returns list of {coin, venues: [{venue, rate, interval_hours}]}.
        """
        resp = self._http.post(
            f"{self.API_URL}/info",
            json={"type": "predictedFundings"},
        )
        resp.raise_for_status()
        raw = resp.json()

        results = []
        for entry in raw:
            coin = entry[0]
            venues = []
            for venue_pair in entry[1]:
                venue_name, venue_data = venue_pair
                if venue_data is None:
                    continue
                venues.append({
                    "venue": venue_name,
                    "rate": float(venue_data["fundingRate"]),
                    "interval_hours": venue_data.get("fundingIntervalHours", 1),
                })
            results.append({"coin": coin, "venues": venues})

        return results

    def get_funding_history(self, coin: str, start_time: int, end_time: int | None = None) -> list[dict]:
        """Fetch historical funding rates for a coin.

        Args:
            coin: Asset name (e.g. "ETH")
            start_time: Start timestamp in ms
            end_time: Optional end timestamp in ms
        """
        return self.info.funding_history(coin, start_time, end_time)
