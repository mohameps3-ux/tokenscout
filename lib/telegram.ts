import { Telegraf } from "telegraf";
import type { Token } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { computeAiScore } from "@/lib/scoring/aiScore";

let _bot: Telegraf | null = null;

export function isTelegramConfigured(): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  return token.length > 10 && !token.includes("placeholder");
}

export function getBot(): Telegraf | null {
  if (!isTelegramConfigured()) return null;
  if (!_bot) {
    _bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  }
  return _bot;
}

function formatUsdCompact(v: number | null): string {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function getDexLink(token: Pick<Token, "chain" | "address" | "pairAddress">): string {
  if (token.chain === "SOLANA") {
    return `https://jup.ag/swap/SOL-${token.address}`;
  }
  if (token.pairAddress) {
    return `https://app.uniswap.org/explore/pools/base/${token.pairAddress}`;
  }
  return `https://app.uniswap.org/swap?outputCurrency=${token.address}&chain=base`;
}

export function buildAlertMessage(
  token: Pick<
    Token,
    "symbol" | "name" | "chain" | "address" | "pairAddress" |
    "totalScore" | "priceUsd" | "liquidity" | "volume24h" | "priceChange24h"
  >
): string {
  const change = token.priceChange24h ?? 0;
  const arrow = change >= 0 ? "📈" : "📉";
  const dexLink = getDexLink(token);
  const chainLabel = token.chain === "SOLANA" ? "Solana" : token.chain;
  const dexLabel = token.chain === "SOLANA" ? "Jupiter" : "Uniswap";
  const aiScore = computeAiScore({ liquidity: token.liquidity, volume24h: token.volume24h, pairCreatedAt: null });

  return [
    `🔥 *New Alpha Alert — Score ${token.totalScore}/100*`,
    ``,
    `*${token.symbol}* (${token.name})`,
    `Chain: ${chainLabel}`,
    `Price: $${token.priceUsd?.toFixed(8) ?? "—"}`,
    `24h: ${arrow} ${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
    `Liquidity: ${formatUsdCompact(token.liquidity)}`,
    `Volume: ${formatUsdCompact(token.volume24h)}`,
    `AI Confidence: ${aiScore.score}% (${aiScore.label})`,
    ``,
    `[Trade on ${dexLabel}](${dexLink})`,
    `[View on TokenScout](${process.env.NEXT_PUBLIC_APP_URL ?? "https://tokenscout-production.up.railway.app"}/token/${token.chain.toLowerCase()}/${token.address})`,
    ``,
    `_TokenScout 2.0 — Not financial advice_`,
  ].join("\n");
}

/**
 * Send a Telegram alert to a specific chat or the configured default chat.
 * Fails silently if Telegram is not configured.
 */
export async function sendTokenAlert(
  token: Parameters<typeof buildAlertMessage>[0],
  chatId?: string
): Promise<boolean> {
  const bot = getBot();
  if (!bot) return false;

  const target = chatId || process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!target) return false;

  try {
    const message = buildAlertMessage(token);
    await bot.telegram.sendMessage(target, message, {
      parse_mode: "Markdown",
      // @ts-ignore — link_preview_options not in older type
      disable_web_page_preview: true,
    });
    return true;
  } catch (err) {
    console.error("[Telegram] Failed to send alert:", err);
    return false;
  }
}

/**
 * Broadcast high-score token alerts to all Pro users who have a telegram chat ID.
 * Called after each scan when tokens score > 80.
 */
export async function broadcastHighScoreAlerts(
  tokens: Parameters<typeof buildAlertMessage>[0][]
): Promise<void> {
  const bot = getBot();
  if (!bot) return;

  // Global alert channel (if configured)
  const globalChat = process.env.TELEGRAM_ALERT_CHAT_ID;

  for (const token of tokens) {
    if (globalChat) {
      await sendTokenAlert(token, globalChat);
      // Small delay to avoid Telegram rate limits
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

/**
 * Check all enabled custom alert rules against a set of new/updated tokens,
 * sending Telegram notifications for matches. Called by the scanner after each batch.
 */
export async function checkAlertRulesAndNotify(
  tokens: Pick<
    Token,
    "symbol" | "name" | "chain" | "address" | "pairAddress" |
    "totalScore" | "priceUsd" | "liquidity" | "volume24h" | "priceChange24h"
  >[]
): Promise<void> {
  if (!isTelegramConfigured() || tokens.length === 0) return;

  const rules = await prisma.alertRule.findMany({ where: { enabled: true } });
  if (rules.length === 0) return;

  const bot = getBot();
  if (!bot) return;

  for (const rule of rules) {
    const matches = tokens.filter((t) => {
      if (t.totalScore < rule.minScore) return false;
      if (rule.chain && t.chain !== rule.chain) return false;
      if (rule.minLiquidity && (t.liquidity ?? 0) < rule.minLiquidity) return false;
      if (rule.minPriceChange && Math.abs(t.priceChange24h ?? 0) < rule.minPriceChange) return false;
      if (rule.minAiScore > 0) {
        const ai = computeAiScore({ liquidity: t.liquidity, volume24h: t.volume24h, pairCreatedAt: null });
        if (ai.score < rule.minAiScore) return false;
      }
      return true;
    });

    for (const token of matches.slice(0, 3)) {
      const ruleLine = rule.label ? `\n📋 Rule: _${rule.label}_` : "";
      const message = buildAlertMessage(token) + ruleLine;
      try {
        await bot.telegram.sendMessage(rule.telegramChatId, message, {
          parse_mode: "Markdown",
          // @ts-ignore
          disable_web_page_preview: true,
        });
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`[Telegram] Alert rule ${rule.id} failed:`, err);
      }
    }
  }
}
