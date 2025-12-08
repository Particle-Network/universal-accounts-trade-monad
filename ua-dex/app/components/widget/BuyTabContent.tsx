"use client";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { truncateAddress } from "../../../lib/utils";
import { TransactionFeeEstimate } from "../../../lib/types";
import { UniversalAccount } from "@particle-network/universal-account-sdk";
import { useState, useCallback, useEffect } from "react";
import { WalletClient } from "viem";
import { formatUnits } from "ethers";

interface BuyTabContentProps {
  usdAmount: string;
  tokenAddress: string;
  setUsdAmount: (value: string) => void;
  isBuying?: boolean; // Optional now since we manage it internally
  universalAccount: UniversalAccount | null;
  walletClient: WalletClient;
  address: string | null;
  onTransactionComplete?: () => void; // Optional callback for post-transaction actions
}

export function BuyTabContent({
  usdAmount,
  tokenAddress,
  setUsdAmount,
  universalAccount,
  walletClient,
  address,
  onTransactionComplete,
  isBuying: externalIsBuying,
}: BuyTabContentProps) {
  // Local buying state - use external if provided, otherwise manage internally
  const [localIsBuying, setLocalIsBuying] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [feeEstimate, setFeeEstimate] = useState<TransactionFeeEstimate | null>(
    null
  );
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);

  const isBuying =
    externalIsBuying !== undefined ? externalIsBuying : localIsBuying;

  // Function to estimate transaction fees
  const estimateFees = useCallback(
    async (amount: string) => {
      if (!amount || isNaN(parseFloat(amount)) || !universalAccount) {
        setFeeEstimate(null);
        return;
      }

      try {
        setIsEstimatingFee(true);
        console.log("Estimating fees for amount:", amount);
        const transaction = await universalAccount.createBuyTransaction({
          token: { chainId: 143, address: tokenAddress }, // Monad mainnet
          amountInUSD: amount,
        });

        console.log("Buy transaction fee data:", transaction);

        // Extract fee information from the transaction
        if (transaction.feeQuotes && transaction.feeQuotes.length > 0) {
          const feeQuote = transaction.feeQuotes[0];
          const fee = feeQuote.fees.totals;

          console.log(
            // Parse the fee values for easier display
            `Total fee in USD: $${parseFloat(
              formatUnits(fee.feeTokenAmountInUSD, 18)
            ).toFixed(4)}`
          );
          console.log(
            `Gas fee in USD: $${parseFloat(
              formatUnits(fee.gasFeeTokenAmountInUSD, 18)
            ).toFixed(4)}`
          );
          console.log(
            `Service fee in USD: $${parseFloat(
              formatUnits(fee.transactionServiceFeeTokenAmountInUSD, 18)
            ).toFixed(4)}`
          );
          console.log(
            `LP fee in USD: $${parseFloat(
              formatUnits(fee.transactionLPFeeTokenAmountInUSD, 18)
            ).toFixed(4)}`
          );

          // Store the fee estimate with pre-parsed values
          setFeeEstimate({
            fees: {
              totals: feeQuote.fees.totals,
              feeTokens: feeQuote.fees.feeTokens.map((tokenData) => ({
                token: {
                  symbol: tokenData.token.symbol || "",
                  name: tokenData.token.name || "",
                  decimals: tokenData.token.decimals,
                  realDecimals: tokenData.token.realDecimals,
                  chainId: tokenData.token.chainId,
                  address: tokenData.token.address,
                  image: tokenData.token.image,
                },
                amount: tokenData.amount,
                amountInUSD: tokenData.amountInUSD,
              })),
              freeGasFee: feeQuote.fees.freeGasFee,
              freeServiceFee: feeQuote.fees.freeServiceFee,
            },
            // Include pre-parsed values for direct display
            parsedFees: {
              gasFeeInUSD: parseFloat(
                formatUnits(fee.gasFeeTokenAmountInUSD, 18)
              ).toFixed(4),
              serviceFeeInUSD: parseFloat(
                formatUnits(fee.transactionServiceFeeTokenAmountInUSD, 18)
              ).toFixed(4),
              lpFeeInUSD: parseFloat(
                formatUnits(fee.transactionLPFeeTokenAmountInUSD, 18)
              ).toFixed(4),
              totalFeeInUSD: parseFloat(
                formatUnits(fee.feeTokenAmountInUSD, 18)
              ).toFixed(4),
            },
          });
        }
      } catch (error) {
        console.error("Error estimating fees:", error);
        setFeeEstimate(null);
      } finally {
        setIsEstimatingFee(false);
      }
    },
    [universalAccount, tokenAddress]
  );

  // Effect to trigger fee estimation when amount changes
  useEffect(() => {
    if (usdAmount && parseFloat(usdAmount) > 0) {
      estimateFees(usdAmount);
    } else {
      setFeeEstimate(null);
    }
  }, [usdAmount, estimateFees]);

  const handleBuyToken = async (amount: string) => {
    if (
      !amount ||
      isNaN(parseFloat(amount)) ||
      !universalAccount ||
      !walletClient ||
      !address
    )
      return;

    try {
      setLocalIsBuying(true);
      const transaction = await universalAccount.createBuyTransaction({
        token: { chainId: 143, address: tokenAddress }, // Monad mainnet
        amountInUSD: amount,
      });

      console.log("Buy transaction created:", transaction);

      // Sign the transaction's root hash using connected wallet
      const signature = await walletClient.signMessage({
        account: address as `0x${string}`,
        message: { raw: transaction.rootHash as `0x${string}` },
      });

      // Send the signed transaction via Universal Account SDK
      const sendResult = await universalAccount.sendTransaction(
        transaction,
        signature
      );

      setTransactionId(sendResult.transactionId);

      // Call the completion callback if provided
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error("Error creating buy transaction:", error);
    } finally {
      setLocalIsBuying(false);
    }
  };
  return (
    <div className="space-y-4">
      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[10, 25, 50, 100].map((amount) => (
          <button
            key={amount}
            onClick={() => setUsdAmount(amount.toString())}
            className="px-3 py-2 bg-slate-950/50 border border-slate-700 hover:border-green-600/50 hover:bg-green-600/10 text-slate-300 hover:text-green-400 rounded-lg transition-all text-sm font-semibold"
          >
            ${amount}
          </button>
        ))}
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label
          htmlFor="buy-amount"
          className="text-sm text-slate-300 font-semibold uppercase tracking-wide"
        >
          Amount (USD)
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">
              $
            </span>
            <Input
              id="buy-amount"
              type="number"
              placeholder="0.00"
              className="bg-slate-950 border-slate-700 text-white text-lg pl-8 pr-4 py-6 focus:border-green-600 focus:ring-green-600/20"
              value={usdAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsdAmount(e.target.value)
              }
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-12 w-12 p-0 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors rounded-lg border border-slate-700"
            onClick={(e) => {
              e.preventDefault();
              setUsdAmount("");
            }}
            disabled={!usdAmount}
            title="Clear amount"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Buy Button */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg py-6 shadow-lg shadow-green-600/20"
        onClick={() => handleBuyToken(usdAmount)}
        disabled={
          isBuying ||
          !usdAmount ||
          isNaN(parseFloat(usdAmount)) ||
          !universalAccount
        }
      >
        {isBuying ? "Processing..." : "Buy Token"}
      </Button>

      {tokenAddress && (
        <div className="text-xs text-slate-500 font-mono bg-slate-950/50 p-3 rounded-lg border border-slate-800">
          <p>Token: {truncateAddress(tokenAddress)}</p>
        </div>
      )}

      {/* Fee Estimate or Transaction Success Display */}
      <div className="mt-4">
        {transactionId ? (
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
        ) : isEstimatingFee ? (
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Calculating fees...
            </p>
          </div>
        ) : feeEstimate ? (
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 space-y-2">
            <h4 className="text-slate-300 font-bold text-sm uppercase tracking-wide mb-3">
              Estimated Fees
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Gas Fee</span>
                <span className="text-white font-mono">
                  ${feeEstimate.parsedFees?.gasFeeInUSD || "0.0000"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Service Fee</span>
                <span className="text-white font-mono">
                  ${feeEstimate.parsedFees?.serviceFeeInUSD || "0.0000"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">LP Fee</span>
                <span className="text-white font-mono">
                  ${feeEstimate.parsedFees?.lpFeeInUSD || "0.0000"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-700">
                <span className="text-slate-200 font-semibold">Total Fee</span>
                <span className="text-white font-bold font-mono">
                  ${feeEstimate.parsedFees?.totalFeeInUSD || "0.0000"}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
