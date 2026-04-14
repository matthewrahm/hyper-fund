import httpx
from hyperliquid.info import Info
from hyperliquid.utils import constants


class HyperliquidClient:
    """Client for fetching funding rate data from Hyperliquid."""

    API_URL = constants.MAINNET_API_URL

    def __init__(self):
        self.info = Info(self.API_URL, skip_ws=True)
        self._http = httpx.Client(timeout=10)

    # HIP-3 DEX prefix to display name mapping
    DEX_NAMES = {
        "xyz": "Trade[XYZ]",
        "flx": "Flexidex",
        "vntl": "Vantol",
        "hyna": "Hyena",
        "km": "KM",
        "cash": "Cash",
        "para": "Para",
    }

    def get_funding_rates(self, include_hip3: bool = True) -> list[dict]:
        """Fetch current funding rates for all perps.

        Returns list of {coin, funding_rate, mark_price, open_interest, dex}
        sorted by absolute funding rate descending.
        """
        rates = []

        # Default DEX (DEX 0)
        data = self.info.meta_and_asset_ctxs()
        universe = data[0]["universe"]
        contexts = data[1]

        for asset, ctx in zip(universe, contexts):
            if asset.get("isDelisted"):
                continue
            funding = float(ctx.get("funding", "0"))
            rates.append({
                "coin": asset["name"],
                "funding_rate": funding,
                "mark_price": float(ctx.get("markPx", "0")),
                "open_interest": float(ctx.get("openInterest", "0")),
                "dex": "Hyperliquid",
            })

        # HIP-3 DEXs
        if include_hip3:
            # Get list of deployers
            resp = self._http.post(
                f"{self.API_URL}/info",
                json={"type": "perpDexs"},
            )
            resp.raise_for_status()
            dex_list = resp.json()

            for dex_info in dex_list:
                if dex_info is None:
                    continue
                dex_name = dex_info["name"]
                dex_display = self.DEX_NAMES.get(dex_name, dex_name)

                try:
                    ctx_resp = self._http.post(
                        f"{self.API_URL}/info",
                        json={"type": "metaAndAssetCtxs", "dex": dex_name},
                    )
                    ctx_resp.raise_for_status()
                    ctx_data = ctx_resp.json()
                    universe = ctx_data[0].get("universe", [])
                    contexts = ctx_data[1] if len(ctx_data) > 1 else []
                except Exception:
                    continue

                for asset, ctx in zip(universe, contexts):
                    if asset.get("isDelisted"):
                        continue
                    funding = float(ctx.get("funding", "0"))
                    rates.append({
                        "coin": asset["name"],
                        "funding_rate": funding,
                        "mark_price": float(ctx.get("markPx", "0")),
                        "open_interest": float(ctx.get("openInterest", "0")),
                        "dex": dex_display,
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

    def get_user_state(self, address: str) -> dict:
        """Fetch clearinghouse state for a user address.

        Returns positions, margin, equity, etc.
        """
        return self.info.user_state(address)

    def get_user_funding_cost(self, address: str) -> dict:
        """Calculate current hourly funding cost for a user's positions.

        Returns {positions: [{coin, size, side, mark_price, funding_rate, hourly_cost}],
                 total_hourly, total_daily, total_monthly}.
        """
        state = self.get_user_state(address)
        rates_list = self.get_funding_rates()
        rates_map = {r["coin"]: r for r in rates_list}

        positions = []
        total_hourly = 0.0

        for pos in state.get("assetPositions", []):
            p = pos.get("position", {})
            coin = p.get("coin", "")
            size = float(p.get("szi", "0"))

            rate_info = rates_map.get(coin)
            if size == 0 or rate_info is None:
                continue

            mark_px = rate_info["mark_price"]
            if mark_px == 0:
                continue

            funding_rate = rate_info["funding_rate"]
            # Funding payment = size * oracle_price * funding_rate
            # Positive funding + long position = you pay
            # Positive funding + short position = you earn
            hourly_cost = size * mark_px * funding_rate

            positions.append({
                "coin": coin,
                "size": abs(size),
                "side": "LONG" if size > 0 else "SHORT",
                "mark_price": mark_px,
                "funding_rate": funding_rate,
                "hourly_cost": hourly_cost,
            })

            total_hourly += hourly_cost

        return {
            "positions": positions,
            "total_hourly": total_hourly,
            "total_daily": total_hourly * 24,
            "total_monthly": total_hourly * 24 * 30,
            "account_value": float(state.get("marginSummary", {}).get("accountValue", "0")),
        }
