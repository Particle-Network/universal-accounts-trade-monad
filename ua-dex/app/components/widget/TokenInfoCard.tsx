"use client";

import { Coins } from "lucide-react";
import { PriceChart } from "./PriceChart";

interface TokenInfo {
  name: string;
  symbol: string;
  price: number;
  logo: string;
  mint: string;
}

interface TokenInfoCardProps {
  tokenInfo: TokenInfo;
  isTokenLoading: boolean;
}

export function TokenInfoCard({
  tokenInfo,
  isTokenLoading,
}: TokenInfoCardProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Token Info Header */}
      <div className="p-5 bg-slate-950/50 rounded-lg border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            {isTokenLoading ? (
              <div className="animate-pulse w-14 h-14 bg-slate-800 rounded-full"></div>
            ) : tokenInfo.logo ? (
              <div className="relative w-14 h-14">
                <img
                  src={tokenInfo.logo}
                  alt={tokenInfo.symbol}
                  className="w-14 h-14 rounded-full border-2 border-slate-700"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center bg-slate-800 rounded-full border-2 border-slate-700">
                  <Coins className="w-7 h-7 text-slate-400" />
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 flex items-center justify-center bg-slate-800 rounded-full border-2 border-slate-700">
                <Coins className="w-7 h-7 text-slate-400" />
              </div>
            )}
          </div>

          <div className="flex-1">
            {isTokenLoading ? (
              <>
                <div className="w-32 h-5 bg-slate-800 rounded animate-pulse mb-2"></div>
                <div className="w-20 h-4 bg-slate-800 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white">
                  {tokenInfo.name}
                </h3>
                <p className="text-sm text-slate-400 font-mono">
                  {tokenInfo.symbol}
                </p>
              </>
            )}
          </div>

          <div className="text-right">
            {isTokenLoading ? (
              <>
                <div className="w-24 h-6 bg-slate-800 rounded animate-pulse mb-1"></div>
                <div className="w-16 h-4 bg-slate-800 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                  Price
                </p>
                <p className="text-2xl font-bold text-white">
                  ${tokenInfo.price.toFixed(6)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Price Chart */}
      {!isTokenLoading && tokenInfo.mint && (
        <PriceChart
          tokenAddress={tokenInfo.mint}
          currentPrice={tokenInfo.price}
        />
      )}
    </div>
  );
}
