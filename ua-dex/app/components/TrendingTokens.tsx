"use client";

import { useEffect, useState } from "react";
import { TokenData } from "../../lib/types";

interface TrendingToken {
  tokenAddress: string;
  name: string;
  symbol: string;
  logo: string | null;
  usdPrice: number;
  pricePercentChange: {
    "24h": number;
  };
  totalVolume: {
    "24h": number;
  };
  marketCap: number;
}

interface TrendingTokensProps {
  onSelectToken: (token: TokenData) => void;
  selectedToken: string | null;
}

export function TrendingTokens({
  onSelectToken,
  selectedToken,
}: TrendingTokensProps) {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/token/trending?limit=15");
        if (!response.ok) {
          throw new Error("Failed to fetch trending tokens");
        }
        const data = await response.json();
        setTokens(data.tokens || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTokens();
  }, []);

  const formatPrice = (price: number) => {
    if (price < 0.0001) return `$${price.toExponential(2)}`;
    if (price < 1) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
    if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const formatChange = (change: number) => {
    const percent = (change * 100).toFixed(2);
    return change >= 0 ? `+${percent}%` : `${percent}%`;
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">
          🔥 Trending Tokens
        </h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-slate-800/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">
          🔥 Trending Tokens
        </h2>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
      <h2 className="text-lg font-bold text-white mb-4">
        🔥 Trending on Monad
      </h2>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {tokens.map((token) => (
          <button
            key={token.tokenAddress}
            onClick={() =>
              onSelectToken({
                address: token.tokenAddress,
                name: token.name,
                symbol: token.symbol,
                logo: token.logo,
                price: token.usdPrice,
                priceChange24h: token.pricePercentChange["24h"],
              })
            }
            className={`w-full p-3 rounded-lg border transition-all text-left ${
              selectedToken === token.tokenAddress
                ? "bg-purple-600/20 border-purple-500"
                : "bg-slate-950/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Token Logo */}
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {token.logo ? (
                  <img
                    src={token.logo}
                    alt={token.symbol}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-white text-xs font-bold">
                    {token.symbol.slice(0, 2)}
                  </span>
                )}
              </div>

              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold truncate">
                    {token.symbol}
                  </span>
                  <span className="text-white text-sm font-mono">
                    {formatPrice(token.usdPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-400 text-xs truncate">
                    {token.name}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      token.pricePercentChange["24h"] >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatChange(token.pricePercentChange["24h"])}
                  </span>
                </div>
              </div>
            </div>

            {/* Volume */}
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>24h Vol</span>
              <span className="font-mono">
                {formatVolume(token.totalVolume["24h"])}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TrendingTokens;
