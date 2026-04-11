import { Navbar } from "@/components/Navbar";
import { TokenDetailClient } from "@/components/token/TokenDetailClient";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ chain: string; address: string }>;
  searchParams: Promise<{ timeframe?: string }>;
}

async function getTokenData(chain: string, address: string, timeframe: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(
      `${baseUrl}/api/token/${chain}/${address}?timeframe=${timeframe}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function TokenDetailPage({ params, searchParams }: PageProps) {
  const { chain, address } = await params;
  const { timeframe = "1h" } = await searchParams;

  const chainUpper = chain.toUpperCase();
  if (!["BASE", "SOLANA"].includes(chainUpper)) notFound();

  const data = await getTokenData(chain, address, timeframe);
  if (!data) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scanner
          </Link>
        </div>

        <TokenDetailClient data={data} currentTimeframe={timeframe} />
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { chain, address } = await params;
  const data = await getTokenData(chain, address, "1h");
  if (!data) return { title: "Token | TokenScout" };
  return {
    title: `${data.symbol} (${data.name}) | TokenScout`,
    description: `Real-time data for ${data.name} on ${chain.toUpperCase()}. Price: $${data.priceUsd?.toFixed(6) ?? "N/A"}`,
  };
}
