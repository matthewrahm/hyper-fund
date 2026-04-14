export default function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            hyper-fund
          </h1>
          <p className="mt-1 text-sm text-muted">
            Cross-exchange funding rate scanner
          </p>
        </div>
      </header>

      {/* Spread Leaderboard */}
      <section className="card p-5 mb-6">
        <div className="label mb-4">Funding Rate Spreads</div>
        <p className="text-sm text-secondary">Loading spreads...</p>
      </section>

      {/* Predicted Funding */}
      <section className="card p-5 mb-6">
        <div className="label mb-4">Predicted Funding</div>
        <p className="text-sm text-secondary">Loading predicted rates...</p>
      </section>

      {/* Address Lookup */}
      <section className="card p-5">
        <div className="label mb-4">Funding Cost Calculator</div>
        <p className="text-sm text-secondary">
          Enter a Hyperliquid address to view funding costs
        </p>
      </section>
    </div>
  );
}
