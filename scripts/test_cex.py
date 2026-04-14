"""Test script for cross-exchange funding rate aggregation."""

import asyncio
import sys
sys.path.insert(0, "src")

from hyper_fund.core import FundingAggregator


async def main():
    agg = FundingAggregator()

    try:
        # Fetch all rates
        print("Fetching funding rates from all exchanges...")
        rates = await agg.get_all_rates()

        # Count per exchange
        exchanges = {}
        for r in rates:
            exchanges[r.exchange] = exchanges.get(r.exchange, 0) + 1

        print(f"\nLoaded {len(rates)} rates:")
        for ex, count in sorted(exchanges.items()):
            print(f"  {ex}: {count} pairs")

        # Top spreads
        print()
        print("=" * 80)
        print("TOP 15 FUNDING RATE SPREADS")
        print("=" * 80)
        print(f"{'Coin':<10} {'Long On':<14} {'Short On':<14} {'Spread':>10} {'Ann. %':>10}")
        print("-" * 80)

        spreads = await agg.get_top_spreads(15)
        for s in spreads:
            print(
                f"{s.coin:<10} "
                f"{s.long_exchange:<14} "
                f"{s.short_exchange:<14} "
                f"{s.spread_bps:>8.1f}bp "
                f"{s.annualized_pct:>9.1f}%"
            )

        # Detail for top spread coin
        if spreads:
            top_coin = spreads[0].coin
            print()
            print(f"Detail for {top_coin}:")
            detail = await agg.get_coin_detail(top_coin)
            for r in sorted(detail, key=lambda r: r.rate):
                ann = r.rate * 24 * 365 * 100
                print(f"  {r.exchange:<14} {r.rate:+.6f}/h  ({ann:+.1f}% ann)")

    finally:
        await agg.close()

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
