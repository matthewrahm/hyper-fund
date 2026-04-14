import asyncio
import re

from fastapi import APIRouter, HTTPException, Query, Request

from api.schemas import (
    FundingRateResponse,
    FundingSpreadResponse,
    PredictedVenue,
    PredictedCoin,
    CostResponse,
    CostPosition,
    HealthResponse,
)
from hyper_fund.core import FundingAggregator

router = APIRouter(prefix="/api")

VENUE_DISPLAY = {
    "BinPerp": "Binance",
    "BybitPerp": "Bybit",
    "HlPerp": "Hyperliquid",
}


def _get_agg(request: Request) -> FundingAggregator:
    return request.app.state.aggregator


@router.get("/exchanges")
async def get_exchanges(request: Request):
    agg = _get_agg(request)
    return {
        "exchanges": agg.get_all_exchanges(),
        "dexs": agg.get_all_dexs(),
    }


@router.get("/spreads", response_model=list[FundingSpreadResponse])
async def get_spreads(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    exchanges: str = Query(default="", description="Comma-separated exchange names to filter"),
):
    agg = _get_agg(request)
    ex_filter = [e.strip() for e in exchanges.split(",") if e.strip()] or None
    spreads = await agg.get_top_spreads(limit, ex_filter)
    return [
        FundingSpreadResponse(
            coin=s.coin,
            long_exchange=s.long_exchange,
            short_exchange=s.short_exchange,
            spread=s.spread,
            long_rate=s.long_rate,
            short_rate=s.short_rate,
            annualized_pct=s.annualized_pct,
            spread_bps=s.spread_bps,
        )
        for s in spreads
    ]


@router.get("/rates", response_model=list[FundingRateResponse])
async def get_rates(request: Request):
    agg = _get_agg(request)
    rates = await agg.get_all_rates()
    return [
        FundingRateResponse(
            coin=r.coin,
            exchange=r.exchange,
            rate=r.rate,
            raw_rate=r.raw_rate,
            interval_hours=r.interval_hours,
            mark_price=r.mark_price,
            open_interest=r.open_interest,
            dex=r.dex,
        )
        for r in rates
    ]


@router.get("/rates/{coin}", response_model=list[FundingRateResponse])
async def get_coin_rates(request: Request, coin: str):
    agg = _get_agg(request)
    rates = await agg.get_coin_detail(coin)
    if not rates:
        raise HTTPException(status_code=404, detail=f"No data found for {coin.upper()}")
    return [
        FundingRateResponse(
            coin=r.coin,
            exchange=r.exchange,
            rate=r.rate,
            raw_rate=r.raw_rate,
            interval_hours=r.interval_hours,
            mark_price=r.mark_price,
            open_interest=r.open_interest,
            dex=r.dex,
        )
        for r in rates
    ]


@router.get("/predicted", response_model=list[PredictedCoin])
async def get_predicted(request: Request):
    agg = _get_agg(request)
    loop = asyncio.get_event_loop()
    predicted = await loop.run_in_executor(None, agg.hl.get_predicted_funding)

    results = []
    for entry in predicted:
        venues = []
        for v in entry["venues"]:
            hourly = v["rate"] / v["interval_hours"]
            venues.append(PredictedVenue(
                venue=VENUE_DISPLAY.get(v["venue"], v["venue"]),
                rate=v["rate"],
                interval_hours=v["interval_hours"],
                hourly_rate=hourly,
                annualized_pct=hourly * 24 * 365 * 100,
            ))
        results.append(PredictedCoin(coin=entry["coin"], venues=venues))

    def max_abs_hourly(entry: PredictedCoin) -> float:
        if not entry.venues:
            return 0
        return max(abs(v.hourly_rate) for v in entry.venues)

    results.sort(key=max_abs_hourly, reverse=True)
    return results[:30]


@router.get("/cost/{address}", response_model=CostResponse)
async def get_cost(request: Request, address: str):
    if not re.match(r"^0x[0-9a-fA-F]{40}$", address):
        raise HTTPException(status_code=400, detail="Invalid address. Expected 0x + 40 hex characters.")

    agg = _get_agg(request)
    loop = asyncio.get_event_loop()
    cost_data = await loop.run_in_executor(None, agg.hl.get_user_funding_cost, address)

    return CostResponse(
        positions=[CostPosition(**p) for p in cost_data["positions"]],
        total_hourly=cost_data["total_hourly"],
        total_daily=cost_data["total_daily"],
        total_monthly=cost_data["total_monthly"],
        account_value=cost_data["account_value"],
    )


@router.get("/health", response_model=HealthResponse)
async def get_health(request: Request):
    agg = _get_agg(request)
    # Trigger a fetch to populate failed_exchanges
    await agg.get_all_rates()

    all_exchanges = ["Hyperliquid", "Binance", "Bybit", "OKX", "Gate.io"]
    exchanges = {}
    for ex in all_exchanges:
        exchanges[ex] = "down" if ex in agg.failed_exchanges else "up"

    return HealthResponse(
        ok=len(agg.failed_exchanges) == 0,
        exchanges=exchanges,
        failed=agg.failed_exchanges,
    )
