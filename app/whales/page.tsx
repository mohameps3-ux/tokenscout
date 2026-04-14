import type { Metadata } from "next";
import { WhalesPageClient } from "@/components/whales/WhalesPageClient";

export const metadata: Metadata = {
  title: "Whale Tracker — TokenScout 2.0",
  description: "Track smart money wallets and copy the best traders on Base and Solana.",
};

export default function WhalesPage() {
  return <WhalesPageClient />;
}
