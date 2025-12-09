"use client";

import UniversalAccountsWidget from "./components/Widget";
import TrendingTokens from "./components/TrendingTokens";
import { useState } from "react";
import { TokenData } from "../lib/types";

export default function Home() {
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Monad Trading Terminal
          </h1>
          <p className="text-slate-400 text-sm">
            Powered by Particle Universal Accounts
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Trending Tokens */}
          <div>
            <TrendingTokens
              onSelectToken={setSelectedToken}
              selectedToken={selectedToken?.address || null}
            />
          </div>

          {/* Right: Trading Widget */}
          <div>
            {selectedToken ? (
              <UniversalAccountsWidget
                projectId={process.env.NEXT_PUBLIC_UA_PROJECT_ID}
                title="Universal Swap"
                tokenAddress={selectedToken.address}
                tokenData={selectedToken}
              />
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm text-center">
                <div className="text-6xl mb-4">👈</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Select a Token
                </h3>
                <p className="text-slate-400 text-sm">
                  Choose a trending token from the list to start trading
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
