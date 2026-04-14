from hyper_fund.models import FundingRate, FundingSpread


def format_spread_table(spreads: list[FundingSpread]) -> str:
    """Format top funding spreads as a monospace table for Telegram."""
    if not spreads:
        return "No spreads found."

    lines = [
        "FUNDING RATE SPREADS",
        "",
    ]

    for i, s in enumerate(spreads, 1):
        lines.append(
            f"{i:>2}. {s.coin:<8} "
            f"{s.spread_bps:>6.1f}bp  "
            f"{s.annualized_pct:>7.1f}%"
        )
        lines.append(
            f"    Long {s.long_exchange:<12} "
            f"Short {s.short_exchange}"
        )

    return f"<pre>{chr(10).join(lines)}</pre>"


def format_coin_detail(coin: str, rates: list[FundingRate]) -> str:
    """Format detailed funding view for a single coin."""
    if not rates:
        return f"No funding data found for {coin.upper()}."

    rates_sorted = sorted(rates, key=lambda r: r.rate)

    lines = [
        f"FUNDING: {coin.upper()}",
        "",
        f"{'Exchange':<14} {'Rate/h':>10} {'Ann. %':>10}",
        "-" * 36,
    ]

    for r in rates_sorted:
        ann = r.rate * 24 * 365 * 100
        lines.append(
            f"{r.exchange:<14} "
            f"{r.rate:>+10.6f} "
            f"{ann:>+9.1f}%"
        )

    # Spread summary
    if len(rates_sorted) >= 2:
        lowest = rates_sorted[0]
        highest = rates_sorted[-1]
        spread = highest.rate - lowest.rate
        spread_ann = spread * 24 * 365 * 100
        lines.append("")
        lines.append(f"Spread: {spread * 10_000:.1f}bp ({spread_ann:.1f}% ann)")
        lines.append(f"Long {lowest.exchange} / Short {highest.exchange}")

    return f"<pre>{chr(10).join(lines)}</pre>"


def format_help() -> str:
    """Format the help message."""
    return (
        "<b>Hyper-Fund</b> - Funding Rate Scanner\n"
        "\n"
        "<b>Commands:</b>\n"
        "/funding - Top 15 cross-exchange spreads\n"
        "/funding SOL - Detail for a specific coin\n"
        "/predicted - Predicted next funding rates\n"
        "/cost 0x... - Your hourly funding cost\n"
        "/alert SOL 0.04 - Alert when spread > threshold\n"
        "/alert list - View active alerts\n"
        "/alert remove SOL - Remove an alert\n"
        "/help - This message\n"
        "\n"
        "<i>Exchanges: Hyperliquid, Binance, Bybit, OKX, Gate.io</i>"
    )
