"""Test script for Hyperliquid funding rate client."""

import sys
sys.path.insert(0, "src")

from hyper_fund.exchanges.hyperliquid import HyperliquidClient


def main():
    client = HyperliquidClient()

    # Current funding rates
    print("=" * 70)
    print("HYPERLIQUID FUNDING RATES (Top 20 by magnitude)")
    print("=" * 70)
    print(f"{'Coin':<10} {'Rate':>12} {'Ann. %':>10} {'Mark Price':>14} {'OI':>14}")
    print("-" * 70)

    rates = client.get_funding_rates()
    for r in rates[:20]:
        rate = r["funding_rate"]
        # Annualize: rate is per-hour, so * 24 * 365
        annualized = rate * 24 * 365 * 100
        print(
            f"{r['coin']:<10} "
            f"{rate:>12.6f} "
            f"{annualized:>9.1f}% "
            f"{r['mark_price']:>14,.2f} "
            f"{r['open_interest']:>14,.2f}"
        )

    # Predicted funding
    print()
    print("=" * 70)
    print("PREDICTED NEXT FUNDING (rates normalized to hourly)")
    print("=" * 70)

    predicted = client.get_predicted_funding()

    def hourly_rate(venue):
        """Normalize rate to hourly (HL is 1h, Bin/Bybit can be 4h or 8h)."""
        return venue["rate"] / venue["interval_hours"]

    # Sort by max absolute hourly rate across venues
    def max_abs_hourly(entry):
        if not entry["venues"]:
            return 0
        return max(abs(hourly_rate(v)) for v in entry["venues"])

    predicted.sort(key=max_abs_hourly, reverse=True)

    for entry in predicted[:15]:
        if not entry["venues"]:
            continue
        coin = entry["coin"]
        venue_strs = []
        for v in entry["venues"]:
            hr = hourly_rate(v)
            ann = hr * 24 * 365 * 100
            venue_strs.append(f"{v['venue']}: {hr:+.6f}/h ({ann:+.1f}%)")
        print(f"{coin:<10} {' | '.join(venue_strs)}")

    print()
    print("Done.")


if __name__ == "__main__":
    main()
