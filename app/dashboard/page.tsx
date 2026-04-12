export const runtime = 'nodejs';



import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { Leaderboard } from "@/components/predictions/Leaderboard";
import { MyStats } from "@/components/predictions/MyStats";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUsd, formatPercent, formatAge, formatNumber, truncateAddress } from "@/lib/utils";
import { getScoreLabel } from "@/lib/scoring/scorer";
import { getCurrentWeekStart } from "@/lib/elo";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Activity, Trophy, Target, Bot } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

async function getDashboardData() {
  const [topTokens, recentTokens, honeypotCount, jobLogs, chainBreakdown, scoreDistribution] =
    await Promise.all([
      prisma.token.findMany({
        orderBy: { totalScore: "desc" },
        take: 10,
        select: {
          id: true, address: true, chain: true, name: true, symbol: true,
          priceUsd: true, liquidity: true, marketCap: true, volume24h: true,
          priceChange24h: true, totalScore: true, liquidityScore: true,
          holderScore: true, ageScore: true, volumeScore: true,
          suspicionScore: true, isHoneypot: true, hasBundledBuys: true,
          listedAt: true, pairAddress: true,
