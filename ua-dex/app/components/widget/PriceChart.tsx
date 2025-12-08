"use client";

import { useEffect, useState } from "react";

interface OHLCVData {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface PriceChartProps {
  tokenAddress: string;
  currentPrice: number;
}

export function PriceChart({ tokenAddress, currentPrice }: PriceChartProps) {
  const [priceData, setPriceData] = useState<OHLCVData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (!tokenAddress) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/token/price-history?address=${tokenAddress}`
        );
        if (response.ok) {
          const data = await response.json();
          setPriceData(data);
        }
      } catch (error) {
        console.error("Failed to fetch price history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [tokenAddress]);

  if (isLoading) {
    return (
      <div className="h-32 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading chart...</div>
      </div>
    );
  }

  if (!priceData || priceData.length === 0) {
    return null;
  }

  // Calculate min and max for scaling
  const allPrices = priceData.flatMap((d) => [
    parseFloat(d.high),
    parseFloat(d.low),
  ]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;

  // Chart dimensions
  const width = 100; // percentage
  const height = 120; // pixels
  const padding = 10;

  // Calculate if price is up or down
  const firstPrice = parseFloat(priceData[0].close);
  const lastPrice = parseFloat(priceData[priceData.length - 1].close);
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  const isPositive = priceChange >= 0;

  return (
    <div className="bg-slate-950/50 rounded-lg border border-slate-800 p-3">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
          24H Chart
        </span>
        <span
          className={`text-xs font-bold ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {priceChange.toFixed(2)}%
        </span>
      </div>

      {/* SVG Chart */}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${priceData.length * 10} ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Grid lines */}
        <line
          x1="0"
          y1={height / 2}
          x2={priceData.length * 10}
          y2={height / 2}
          stroke="#334155"
          strokeWidth="0.5"
          opacity="0.3"
        />

        {/* Candlesticks */}
        {priceData.map((candle, index) => {
          const x = index * 10 + 5;
          const open = parseFloat(candle.open);
          const close = parseFloat(candle.close);
          const high = parseFloat(candle.high);
          const low = parseFloat(candle.low);

          const isBullish = close >= open;

          // Scale prices to chart height
          const scaleY = (price: number) => {
            return (
              height -
              padding -
              ((price - minPrice) / priceRange) * (height - 2 * padding)
            );
          };

          const yHigh = scaleY(high);
          const yLow = scaleY(low);
          const yOpen = scaleY(open);
          const yClose = scaleY(close);

          const color = isBullish ? "#10b981" : "#ef4444"; // green or red

          return (
            <g key={index}>
              {/* Wick (high-low line) */}
              <line
                x1={x}
                y1={yHigh}
                x2={x}
                y2={yLow}
                stroke={color}
                strokeWidth="1"
                opacity="0.8"
              />
              {/* Body (open-close rectangle) */}
              <rect
                x={x - 2}
                y={Math.min(yOpen, yClose)}
                width="4"
                height={Math.max(Math.abs(yClose - yOpen), 1)}
                fill={color}
                opacity="0.9"
              />
            </g>
          );
        })}

        {/* Current price line */}
        {currentPrice > 0 && (
          <line
            x1="0"
            y1={
              height -
              padding -
              ((currentPrice - minPrice) / priceRange) * (height - 2 * padding)
            }
            x2={priceData.length * 10}
            y2={
              height -
              padding -
              ((currentPrice - minPrice) / priceRange) * (height - 2 * padding)
            }
            stroke="#a855f7"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.6"
          />
        )}
      </svg>
    </div>
  );
}
