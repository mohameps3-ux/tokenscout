import { Telegraf } from "telegraf";
import type { Token } from "@/app/generated/prisma/client";

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
  const chainLabel = token.chain === "SOLANA" ? "Solana" : "Base";
  const dexLabel = token.chain === "SOLANA" ? "Jupiter" : "Uniswap";

  return [
    `🔥 *New Alpha Alert — Score ${token.totalScore}/100*`,
    ``,
    `*${token.symbol}* (${token.name})`,
    `Chain: ${chainLabel}`,
    `Price: $${token.priceUsd?.toFixed(8) ?? "—"}`,
    `24h: ${arrow} ${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
    `Liquidity: ${formatUsdCompact(token.liquidity)}`,
    `Volume: ${formatUsdCompact(token.volume24h)}`,
    ``,
    `[Trade on ${dexLabel}](${dexLink})`,
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
