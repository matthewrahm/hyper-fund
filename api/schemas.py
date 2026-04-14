from pydantic import BaseModel


class FundingRateResponse(BaseModel):
    coin: str
    exchange: str
    rate: float
    raw_rate: float
    interval_hours: int
    mark_price: float
    open_interest: float


class FundingSpreadResponse(BaseModel):
    coin: str
    long_exchange: str
    short_exchange: str
    spread: float
    long_rate: float
    short_rate: float
    annualized_pct: float
    spread_bps: float


class PredictedVenue(BaseModel):
    venue: str
    rate: float
    interval_hours: int
    hourly_rate: float
    annualized_pct: float


class PredictedCoin(BaseModel):
    coin: str
    venues: list[PredictedVenue]


class CostPosition(BaseModel):
    coin: str
    size: float
    side: str
    mark_price: float
    funding_rate: float
    hourly_cost: float


class CostResponse(BaseModel):
    positions: list[CostPosition]
    total_hourly: float
    total_daily: float
    total_monthly: float
    account_value: float


class HealthResponse(BaseModel):
    ok: bool
    exchanges: dict[str, str]
    failed: list[str]
