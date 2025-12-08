"use client";

import { RefreshCw, Wallet } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

interface WidgetHeaderProps {
  title: string;
  isConnected: boolean;
  balanceLoading: boolean;
  isRefreshing: boolean;
  totalBalanceUSD: number | null;
  fetchBalance: (isManualRefresh: boolean) => void;
  onBalanceClick?: () => void;
}

export function WidgetHeader({
  title,
  isConnected,
  balanceLoading,
  isRefreshing,
  totalBalanceUSD,
  fetchBalance,
  onBalanceClick,
}: WidgetHeaderProps) {
  return (
    <div className="border-b border-slate-800 pb-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
            <Wallet className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-200">{title}</h2>
        </div>

        {isConnected && (
          <button
            onClick={() => fetchBalance(true)}
            disabled={isRefreshing}
            className={`p-2 rounded-lg hover:bg-slate-800 transition-colors ${
              isRefreshing ? "animate-spin" : ""
            }`}
            title="Refresh balance"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isRefreshing
                  ? "opacity-70 text-purple-400"
                  : "text-slate-400 hover:text-white"
              }`}
            />
          </button>
        )}
      </div>

      {isConnected && (
        <button
          onClick={onBalanceClick}
          className="w-full bg-slate-950/50 rounded-lg p-4 border border-slate-800 hover:border-slate-600 hover:bg-slate-900/50 transition-all text-left cursor-pointer group"
        >
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-2">
            Total Balance
            <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
              Click to view assets
            </span>
          </p>
          {balanceLoading && !isRefreshing ? (
            <div className="h-8 w-32 bg-slate-800 rounded animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-white">
              {formatCurrency(totalBalanceUSD)}
            </p>
          )}
        </button>
      )}
    </div>
  );
}
