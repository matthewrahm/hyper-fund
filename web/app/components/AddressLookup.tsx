"use client";

import { useState } from "react";
import { getCost, type CostData } from "@/lib/api";
import SectionHeading from "./SectionHeading";
import CostBreakdown from "./CostBreakdown";

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

export default function AddressLookup() {
  const [address, setAddress] = useState("");
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCostData(null);

    if (!ADDRESS_REGEX.test(address)) {
      setError("Invalid address. Expected 0x + 40 hex characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await getCost(address);
      setCostData(data);
    } catch {
      setError("Failed to fetch funding costs. Check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card p-5">
      <SectionHeading>Position Funding Tracker</SectionHeading>

      {!costData && (
        <p className="text-sm text-secondary mb-4">
          Paste any Hyperliquid wallet address to see how much funding is costing
          or earning across all open positions. Funding is a hidden cost that
          compounds over time on leveraged trades.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3 mb-5">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Hyperliquid wallet address (0x...)"
          className="flex-1 rounded-lg border border-[rgba(255,255,255,0.10)] bg-transparent px-3 py-2 font-mono text-sm text-primary placeholder:text-[#555] transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] hover:border-[rgba(255,255,255,0.20)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Look up"}
        </button>
      </form>

      {error && (
        <p className="mb-4 text-sm text-loss">{error}</p>
      )}

      {costData && <CostBreakdown data={costData} />}
    </section>
  );
}
