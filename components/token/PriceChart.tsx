"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  IChartApi,
} from "lightweight-charts";

interface PriceChartProps {
  ohlcv: [number, number, number, number, number, number][];
}

function fmtPrice(v: number): string {
  if (v >= 1) return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v < 0.01) {
    const zeros = Math.max(0, Math.floor(-Math.log10(v)));
    return "$" + v.toFixed(Math.min(zeros + 4, 20));
  }
  return "$" + v.toFixed(4);
}

function fmtVol(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function fmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export function PriceChart({ ohlcv }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !ohlcv?.length) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const sorted = [...ohlcv]
      .map(([ts, o, h, l, c, v]) => ({
        time: Math.floor(ts / 1000) as number,
        open: o, high: h, low: l, close: c, volume: v,
      }))
      .sort((a, b) => a.time - b.time);

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#71717a",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      crosshair: {
        vertLine: { color: "#52525b", labelBackgroundColor: "#27272a" },
        horzLine: { color: "#52525b", labelBackgroundColor: "#27272a" },
      },
      rightPriceScale: { borderColor: "#27272a", minimumWidth: 80 },
      timeScale: { borderColor: "#27272a", timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height: 380,
    });
    chartRef.current = chart;

    // Volume histogram (bottom 15%)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const volSeries = chart.addSeries(HistogramSeries as any, {
      priceScaleId: "vol",
      priceFormat: { type: "volume" },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (volSeries as any).priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    volSeries.setData(
      sorted.map(({ time, open, close, volume }) => ({
        time,
        value: volume,
        color: close >= open ? "rgba(16,185,129,0.45)" : "rgba(239,68,68,0.45)",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any
    );

    // Price series — line if sparse, candles otherwise
    const useLine = sorted.length < 10;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let priceSeries: any;

    if (useLine) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      priceSeries = chart.addSeries(LineSeries as any, {
        color: "#3b82f6",
        lineWidth: 2,
        priceScaleId: "right",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (priceSeries as any).priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.2 } });
      priceSeries.setData(sorted.map(({ time, close }) => ({ time, value: close })));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      priceSeries = chart.addSeries(CandlestickSeries as any, {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
        priceScaleId: "right",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (priceSeries as any).priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.2 } });
      priceSeries.setData(sorted.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
    }

    chart.timeScale().fitContent();

    // Crosshair tooltip
    chart.subscribeCrosshairMove((param) => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        tooltip.style.display = "none";
        return;
      }

      const priceData = param.seriesData.get(priceSeries);
      const volData   = param.seriesData.get(volSeries) as { value?: number } | undefined;
      if (!priceData) { tooltip.style.display = "none"; return; }

      const vol = volData?.value ?? 0;
      const ts  = typeof param.time === "number" ? param.time : 0;

      let html = `<div style="color:#a1a1aa;font-size:10px;margin-bottom:4px">${fmtTime(ts)}</div>`;

      if (useLine) {
        const v = (priceData as { value: number }).value;
        html += `<div style="font-size:11px"><span style="color:#71717a">Price </span><span style="color:#fff;font-family:monospace">${fmtPrice(v)}</span></div>`;
      } else {
        const c = priceData as { open: number; high: number; low: number; close: number };
        const up = c.close >= c.open;
        const clr = up ? "#10b981" : "#ef4444";
        html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;font-size:11px">`;
        html += `<span style="color:#71717a">O</span><span style="color:${clr};font-family:monospace">${fmtPrice(c.open)}</span>`;
        html += `<span style="color:#71717a">H</span><span style="color:#10b981;font-family:monospace">${fmtPrice(c.high)}</span>`;
        html += `<span style="color:#71717a">L</span><span style="color:#ef4444;font-family:monospace">${fmtPrice(c.low)}</span>`;
        html += `<span style="color:#71717a">C</span><span style="color:${clr};font-family:monospace">${fmtPrice(c.close)}</span>`;
        html += `</div>`;
      }
      html += `<div style="margin-top:4px;font-size:10px"><span style="color:#71717a">Vol </span><span style="color:#a1a1aa;font-family:monospace">${fmtVol(vol)}</span></div>`;

      tooltip.innerHTML = html;
      tooltip.style.display = "block";

      const w = containerRef.current?.clientWidth ?? 400;
      let left = param.point.x + 16;
      if (left + 160 > w) left = param.point.x - 172;
      tooltip.style.left = `${Math.max(0, left)}px`;
      tooltip.style.top = "8px";
    });

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [ohlcv]);

  return (
    <div className="relative w-full" style={{ height: 380 }}>
      <div ref={containerRef} className="w-full h-full" />
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "absolute",
          zIndex: 10,
          background: "#18181b",
          border: "1px solid #3f3f46",
          borderRadius: 8,
          padding: "8px 10px",
          pointerEvents: "none",
          minWidth: 148,
        }}
      />
    </div>
  );
}
