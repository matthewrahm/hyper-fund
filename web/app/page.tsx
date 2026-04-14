"use client";

import { useState } from "react";
import Header from "./components/Header";
import SpreadTable from "./components/SpreadTable";

export default function Dashboard() {
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />
      <SpreadTable
        onSelectCoin={setSelectedCoin}
        selectedCoin={selectedCoin}
      />

      {/* Predicted Funding - Phase 4 */}
      <section className="card p-5 mb-6">
        <div className="label mb-4">Predicted Funding</div>
        <p className="text-sm text-secondary">Coming soon</p>
      </section>

      {/* Address Lookup - Phase 5 */}
      <section className="card p-5">
        <div className="label mb-4">Funding Cost Calculator</div>
        <p className="text-sm text-secondary">Coming soon</p>
      </section>
    </div>
  );
}
