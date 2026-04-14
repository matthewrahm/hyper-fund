from dataclasses import dataclass


@dataclass
class FundingRate:
    coin: str
    exchange: str
    rate: float  # hourly rate (normalized)
    raw_rate: float  # original rate from exchange
    interval_hours: int  # funding interval (1h for HL, 4h or 8h for CEXs)
    mark_price: float = 0.0
    open_interest: float = 0.0


@dataclass
class FundingSpread:
    coin: str
    long_exchange: str  # exchange where you go long (lowest rate, you pay least)
    short_exchange: str  # exchange where you go short (highest rate, you earn most)
    spread: float  # hourly spread (short_rate - long_rate)
    long_rate: float  # hourly rate on long side
    short_rate: float  # hourly rate on short side

    @property
    def annualized_pct(self) -> float:
        return self.spread * 24 * 365 * 100

    @property
    def spread_bps(self) -> float:
        return self.spread * 10_000


def to_ccxt_symbol(coin: str) -> str:
    """Convert Hyperliquid coin name to ccxt perp symbol."""
    return f"{coin}/USDT:USDT"


def from_ccxt_symbol(symbol: str) -> str:
    """Convert ccxt perp symbol to bare coin name."""
    return symbol.split("/")[0]
