"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface Asset {
  tokenType: string;
  amount: number;
  amountInUSD: number;
  chain?: string;
  symbol?: string;
  image?: string;
}

interface AssetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  totalAmountInUSD: number;
  isLoading: boolean;
}

export function AssetsDialog({
  open,
  onOpenChange,
  assets,
  totalAmountInUSD,
  isLoading,
}: AssetsDialogProps) {
  const formatAmount = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (num < 0.0001) return num.toExponential(2);
    if (num < 1) return num.toFixed(6);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const formatUSD = (amount: number) => {
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            💰 Assets Breakdown
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-slate-800/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p>No assets found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto py-2">
            {assets
              .filter((asset) => asset.amountInUSD > 0.01) // Hide zero/dust balances
              .map((asset, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {/* Asset Icon */}
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                      {asset.image ? (
                        <img
                          src={asset.image}
                          alt={asset.symbol || asset.tokenType}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {(asset.symbol || asset.tokenType).slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {asset.symbol || asset.tokenType}
                      </p>
                      {asset.chain && (
                        <p className="text-slate-400 text-xs">{asset.chain}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-mono text-sm">
                      {formatAmount(asset.amount)}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {formatUSD(asset.amountInUSD)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Total */}
        <div className="pt-4 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-semibold">Total Balance</span>
            <span className="text-2xl font-bold text-white">
              {formatUSD(totalAmountInUSD)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AssetsDialog;
