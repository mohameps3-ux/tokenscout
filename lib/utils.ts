import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(value: number | null | undefined, compact = false): string {
  if (value == null || isNaN(value)) return "—";
  if (compact) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  }
  let maximumFractionDigits = 2;
  if (value > 0 && value < 1) {
    if (value < 0.01) {
      const leadingZeros = Math.max(0, Math.floor(-Math.log10(value)));
      maximumFractionDigits = Math.min(leadingZeros + 4, 20);
    } else {
      maximumFractionDigits = 4;
    }
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatAge(date: Date | null | undefined): string {
  if (!date) return "Unknown";
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
