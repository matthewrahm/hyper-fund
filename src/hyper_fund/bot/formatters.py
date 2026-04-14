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


def format_predicted(predicted: list[dict]) -> str:
    """Format predicted funding rates across venues."""
    if not predicted:
        return "No predicted funding data."

    lines = [
        "PREDICTED FUNDING (next period)",
        "",
    ]

    for entry in predicted[:15]:
        if not entry["venues"]:
            continue

        coin = entry["coin"]
        venue_parts = []
        for v in entry["venues"]:
            hourly = v["rate"] / v["interval_hours"]
            ann = hourly * 24 * 365 * 100
            label = v["venue"].replace("Perp", "")
            venue_parts.append(f"{label}: {ann:+.0f}%")

        lines.append(f"{coin:<8} {' | '.join(venue_parts)}")

    return f"<pre>{chr(10).join(lines)}</pre>"


def format_cost(cost_data: dict) -> str:
    """Format funding cost breakdown for a user's positions."""
    positions = cost_data["positions"]
    if not positions:
        return "No open positions found for this address."

    lines = [
        "FUNDING COST BREAKDOWN",
        "",
        f"Account Value: ${cost_data['account_value']:,.2f}",
        "",
        f"{'Coin':<8} {'Side':<6} {'Size':>10} {'Rate/h':>10} {'$/hr':>10}",
        "-" * 46,
    ]

    for p in sorted(positions, key=lambda x: abs(x["hourly_cost"]), reverse=True):
        lines.append(
            f"{p['coin']:<8} "
            f"{p['side']:<6} "
            f"{p['size']:>10,.2f} "
            f"{p['funding_rate']:>+10.6f} "
            f"{p['hourly_cost']:>+10.2f}"
        )

    lines.append("-" * 46)
    h = cost_data["total_hourly"]
    d = cost_data["total_daily"]
    m = cost_data["total_monthly"]
    lines.append(f"Hourly:  ${h:+,.2f}")
    lines.append(f"Daily:   ${d:+,.2f}")
    lines.append(f"Monthly: ${m:+,.2f}")

    if h > 0:
        lines.append("")
        lines.append("(+) = you are paying  (-) = you are earning")

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
