"use client";

import { useState } from "react";
import Header from "./components/Header";
import ExchangeFilter from "./components/ExchangeFilter";
import SpreadTable from "./components/SpreadTable";
import CoinDetail from "./components/CoinDetail";
import PredictedFunding from "./components/PredictedFunding";
import AddressLookup from "./components/AddressLookup";

export default function Dashboard() {
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <div className="mb-5">
        <ExchangeFilter
          selected={selectedExchanges}
          onChange={setSelectedExchanges}
        />
      </div>

      <SpreadTable
        onSelectCoin={setSelectedCoin}
        selectedCoin={selectedCoin}
        exchanges={selectedExchanges}
      />

      {selectedCoin && (
        <CoinDetail
          coin={selectedCoin}
          onClose={() => setSelectedCoin(null)}
        />
      )}

      <PredictedFunding />
      <AddressLookup />
    </div>
  );
}
