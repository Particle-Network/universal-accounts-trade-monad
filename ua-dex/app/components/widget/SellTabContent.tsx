"use client";

import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { useState, useEffect, useCallback } from "react";
import { UniversalAccount } from "@particle-network/universal-account-sdk";
import type { WalletClient } from "viem";
import { AccountInfo } from "../../../lib/types";
import { useTokenBalance } from "../../../hooks/useTokenBalance";

interface SellTabContentProps {
  tokenAddress: string;
  universalAccount: UniversalAccount | null;
  walletClient: WalletClient | null;
  address: string | null;
  accountInfo: AccountInfo | null;
  onTransactionComplete?: () => void;
}

export function SellTabContent({
  tokenAddress,
  universalAccount,
  walletClient,
  address,
  accountInfo,
  onTransactionComplete,
}: SellTabContentProps) {
  const [isSelling, setIsSelling] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
    null
  );
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Use our new token balance hook
  const {
    fetchTokenBalance,
    isLoading: isLoadingBalance,
    tokenBalance,
  } = useTokenBalance();

  // Function to check token balance
  const checkTokenBalance = useCallback(
    async (options?: { expectZero?: boolean; maxRetries?: number }) => {
      await fetchTokenBalance(
        accountInfo?.evmUaAddress, // Use EVM address for Monad
        tokenAddress,
        options
      );
    },
    [fetchTokenBalance, accountInfo?.evmUaAddress, tokenAddress]
  );

  // Initial balance check on mount
  useEffect(() => {
    checkTokenBalance();
  }, [checkTokenBalance]);

  const handleSellToken = async (percentage: number) => {
    if (!universalAccount || !walletClient || !address) {
      console.log("Missing required dependencies:", {
        hasUniversalAccount: !!universalAccount,
        hasWalletClient: !!walletClient,
        hasAddress: !!address,
      });
      return;
    }

    try {
      console.log("Starting sell transaction:", {
        percentage,
        tokenAddress,
        chainId: 143, // Monad mainnet
        userAddress: address,
      });

      setIsSelling(true);
      setSelectedPercentage(percentage);

      if (!tokenBalance) {
        throw new Error("No token balance available");
      }

      // Calculate amount to sell based on token balance and percentage
      const amountToSell = (
        Number(tokenBalance.amount) *
        (percentage / 100)
      ).toFixed(tokenBalance.decimals);
      console.log("Calculating sell amount:", {
        totalBalance: tokenBalance.amount,
        percentage,
        amountToSell,
      });

      const transaction = await universalAccount.createSellTransaction({
        token: { chainId: 143, address: tokenAddress }, // Monad mainnet
        amount: amountToSell,
      });
      console.log("Sell transaction created:", {
        transactionId: transaction.transactionId,
        rootHash: transaction.rootHash,
        amountToSell,
      });

      // Sign the transaction's root hash using connected wallet
      if (!address.startsWith("0x")) {
        throw new Error("Invalid address format");
      }

      console.log("Signing transaction with address:", address);
      const signature = await walletClient.signMessage({
        account: address as `0x${string}`,
        message: { raw: transaction.rootHash as `0x${string}` },
      });
      console.log("Transaction signed successfully");

      // Send the signed transaction
      console.log("Sending signed transaction...");
      const sendResult = await universalAccount.sendTransaction(
        transaction,
        signature
      );
      console.log("Transaction sent successfully:", {
        transactionId: sendResult.transactionId,
        status: sendResult.status,
      });

      setTransactionId(sendResult.transactionId);

      // Transaction completed successfully
      console.log("Sell transaction completed successfully");

      // Check if we sold 100% of the tokens - then we expect zero balance
      if (percentage === 100) {
        console.log(
          "Sold 100% of tokens, polling for balance to update to zero..."
        );
        // Use a longer retry window for post-transaction polling (12 retries = ~12 seconds)
        await checkTokenBalance({ expectZero: true, maxRetries: 12 });
      } else {
        // Otherwise, just update the balance normally
        console.log(`Sold ${percentage}% of tokens, updating balance...`);
        await checkTokenBalance();
      }

      // Call the completion callback if provided
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error("Error selling token:", {
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        percentage,
        tokenAddress,
      });
    } finally {
      setIsSelling(false);
      console.log("Sell transaction process completed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Token Balance Display */}
      <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <Label className="text-sm text-slate-300 font-semibold uppercase tracking-wide">
            Available Balance
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => checkTokenBalance()}
            disabled={isLoadingBalance}
            className="text-xs bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors border border-slate-700 h-8"
          >
            {isLoadingBalance ? "Updating..." : "Refresh"}
          </Button>
        </div>
        {isLoadingBalance ? (
          <div className="h-8 w-40 bg-slate-800 rounded animate-pulse"></div>
        ) : tokenBalance ? (
          <div className="text-white text-2xl font-bold">
            {tokenBalance.amount}
          </div>
        ) : (
          <div className="text-slate-500 text-2xl font-bold">0.0</div>
        )}
      </div>

      {/* Sell Percentage Buttons */}
      <div className="space-y-2">
        <Label className="text-sm text-slate-300 font-semibold uppercase tracking-wide">
          Select amount to sell
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((percentage) => (
            <Button
              key={percentage}
              size="lg"
              variant="outline"
              className={`${
                selectedPercentage === percentage
                  ? "bg-red-600/20 text-red-400 border-red-600/50"
                  : "bg-slate-950/50 text-slate-300 border-slate-700 hover:border-red-600/50 hover:bg-red-600/10 hover:text-red-400"
              } transition-all font-bold py-6`}
              onClick={() => handleSellToken(percentage)}
              disabled={
                isSelling || !tokenBalance || Number(tokenBalance.amount) === 0
              }
            >
              {percentage}%
            </Button>
          ))}
        </div>
      </div>

      {/* Sell All Button */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-lg py-6 shadow-lg shadow-red-600/20"
        onClick={() => handleSellToken(100)}
        disabled={
          isSelling || !tokenBalance || Number(tokenBalance.amount) === 0
        }
      >
        {isSelling ? "Processing..." : "Sell All"}
      </Button>

      {/* Transaction Success Display */}
      {transactionId && (
        <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/50">
          <h4 className="text-green-400 font-bold mb-2 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Transaction Submitted!
          </h4>
          <p className="text-green-300 text-sm mb-3">
            View your transaction on UniversalX:
          </p>
          <a
            href={`https://universalx.app/activity/details?id=${transactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 underline text-sm break-all font-mono"
          >
            {transactionId}
          </a>
        </div>
      )}
    </div>
  );
}
