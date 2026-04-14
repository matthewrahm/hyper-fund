import SectionHeading from "./SectionHeading";

export default function FundingGuide() {
  return (
    <section className="card p-5">
      <SectionHeading>How Funding Rates Work</SectionHeading>

      <div className="space-y-5 text-sm text-secondary leading-relaxed">
        <div>
          <h3 className="text-primary font-medium mb-1">What are funding rates?</h3>
          <p>
            Perpetual futures never expire, so there needs to be a mechanism to keep
            the perp price anchored to the real spot price. That mechanism is funding.
            Every hour on Hyperliquid (every 8 hours on most centralized exchanges),
            one side of the market pays the other.
          </p>
        </div>

        <div>
          <h3 className="text-primary font-medium mb-1">Who pays who?</h3>
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header text-left">Scenario</th>
                  <th className="table-header text-left">What it means</th>
                  <th className="table-header text-left">Who pays</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-row">
                  <td className="table-cell">
                    <span className="text-profit font-medium">Positive funding</span>
                  </td>
                  <td className="table-cell text-muted">
                    Perp price is above spot (too many longs)
                  </td>
                  <td className="table-cell">Longs pay shorts</td>
                </tr>
                <tr className="table-row">
                  <td className="table-cell">
                    <span className="text-loss font-medium">Negative funding</span>
                  </td>
                  <td className="table-cell text-muted">
                    Perp price is below spot (too many shorts)
                  </td>
                  <td className="table-cell">Shorts pay longs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-primary font-medium mb-1">How the cost is calculated</h3>
          <div className="rounded-lg p-3 font-mono text-xs text-muted" style={{ background: "rgba(255,255,255,0.03)" }}>
            hourly cost = position size x mark price x funding rate
          </div>
          <p className="mt-2">
            A 10 ETH long at $3,000 with a +0.01% hourly rate costs $3.00/hour in funding.
            That&apos;s $72/day silently eating into PnL. Flip the rate negative and
            you&apos;d be earning $3.00/hour instead.
          </p>
        </div>

        <div>
          <h3 className="text-primary font-medium mb-1">Why rates differ between exchanges</h3>
          <p>
            Each exchange has its own traders, leverage dynamics, and liquidation
            engines. When retail piles into longs on Binance but Hyperliquid stays
            balanced, Binance funding spikes while Hyperliquid stays flat. These
            divergences create arbitrage opportunities where you can go long on the
            cheaper exchange and short on the expensive one, capturing the spread
            with zero directional risk.
          </p>
        </div>

        <div>
          <h3 className="text-primary font-medium mb-1">Funding rate arbitrage</h3>
          <p>
            When funding rates diverge between exchanges, you can profit by taking
            opposite positions. Go long where funding is lowest (or most negative)
            and short where it&apos;s highest. Your positions cancel out directionally,
            but you pocket the funding spread. The spread table above surfaces
            these opportunities ranked by annualized return.
          </p>
        </div>

        <div>
          <h3 className="text-primary font-medium mb-1">Key things to know</h3>
          <ul className="list-disc list-inside space-y-1 text-muted">
            <li>Hyperliquid settles funding every hour. Most CEXs settle every 4-8 hours.</li>
            <li>Rates change constantly based on market conditions.</li>
            <li>All rates on this dashboard are normalized to hourly for fair comparison.</li>
            <li>Annualized % assumes the current rate holds for a full year (it won&apos;t, but it&apos;s useful for comparing).</li>
            <li>Funding is peer-to-peer on Hyperliquid. The protocol takes no cut.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
