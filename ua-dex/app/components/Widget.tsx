"use client";

import {
  useDisconnect,
  useWallets,
  useAccount,
} from "@particle-network/connectkit";
import { UniversalAccount } from "@particle-network/universal-account-sdk";
import { useEffect, useState, useCallback } from "react";
import { UniversalAccountsWidgetProps, AccountInfo } from "../../lib/types";

// Import new components
import { WidgetHeader } from "./widget/WidgetHeader";
import { ConnectSection } from "./widget/ConnectSection";
import { TradingInterface } from "./widget/TradingInterface";
import { LoadingIndicator } from "./widget/LoadingIndicator";
import { AssetsDialog } from "./widget/AssetsDialog";
import { truncateAddress } from "../../lib/utils";

export function UniversalAccountsWidget({
  title = "Instant Swap",
  tokenAddress = "",
  tokenData,
}: UniversalAccountsWidgetProps) {
  // Get wallet from Particle Connect
  const [primaryWallet] = useWallets();
  const walletClient = primaryWallet?.getWalletClient();

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assetsDialogOpen, setAssetsDialogOpen] = useState(false);
  const [assets, setAssets] = useState<
    Array<{
      tokenType: string;
      amount: number;
      amountInUSD: number;
      chain?: string;
      symbol?: string;
      image?: string;
    }>
  >([]);
  const [activeTab, setActiveTab] = useState("buy");
  const [usdAmount, setUsdAmount] = useState("");
  const [tokenInfo, setTokenInfo] = useState({
    name: "Loading...",
    symbol: "...",
    price: 0,
    logo: "",
    mint: "",
  });
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [ua, setUa] = useState<UniversalAccount | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      const universalAccount = new UniversalAccount({
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "",
        projectClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY || "",
        projectAppUuid: process.env.NEXT_PUBLIC_APP_ID || "",
        ownerAddress: address,
        tradeConfig: {
          universalGas: true,
        },
      });
      setUa(universalAccount);
    } else {
      setUa(null);
    }
  }, [isConnected, address]);

  // Handle transaction completion
  const handleTransactionComplete = () => {
    // Refresh balance or any other post-transaction actions
    fetchBalance(true);
  };

  useEffect(() => {
    const fetchSmartAccountOptions = async () => {
      if (isConnected && address && ua) {
        setLoading(true);
        try {
          const smartAccountOptions = await ua.getSmartAccountOptions();
          setAccountInfo({
            evmUaAddress: smartAccountOptions.smartAccountAddress!,
            solanaUaAddress: smartAccountOptions.solanaSmartAccountAddress!,
          });
        } catch (error) {
          console.error("Error fetching smart account options:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSmartAccountOptions();
  }, [isConnected, address, ua]);

  const fetchBalance = useCallback(
    async (isManualRefresh = false) => {
      if (!ua) {
        setTotalBalanceUSD(null);
        setAssets([]);
        return;
      }

      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setBalanceLoading(true);
        }

        const primaryAssets = await ua.getPrimaryAssets();
        setTotalBalanceUSD(primaryAssets.totalAmountInUSD);

        // Store full assets breakdown
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedAssets = primaryAssets.assets.map((asset: any) => ({
          tokenType: asset.tokenType,
          amount: asset.amount,
          amountInUSD: asset.amountInUSD,
          chain: asset.chain,
          symbol: asset.symbol,
          image: asset.image,
        }));
        setAssets(formattedAssets);
      } catch (error) {
        console.error("Error fetching assets balance:", error);
        setTotalBalanceUSD(null);
        setAssets([]);
      } finally {
        setBalanceLoading(false);
        setIsRefreshing(false);
      }
    },
    [ua]
  );

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Fetch token metadata and price from our API
  const fetchTokenMetadata = useCallback(async () => {
    if (!tokenAddress) {
      console.error("No token address provided");
      return;
    }

    setIsTokenLoading(true);
    try {
      // Fetch metadata and price in parallel
      const [metadataResponse, priceResponse] = await Promise.all([
        fetch(`/api/token/metadata?address=${tokenAddress}`),
        fetch(`/api/token/price?address=${tokenAddress}`),
      ]);

      if (!metadataResponse.ok) {
        throw new Error(
          `Error fetching token metadata: ${metadataResponse.statusText}`
        );
      }

      const metadataData = await metadataResponse.json();
      let price = 0;

      // Handle price data if available
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        price = priceData.usdPrice || 0;

        // If price is 0, try to get it from price history as fallback
        if (price === 0) {
          console.log("Price is 0, fetching from price history...");
          try {
            const historyResponse = await fetch(
              `/api/token/price-history?address=${tokenAddress}`
            );
            if (historyResponse.ok) {
              const historyData = await historyResponse.json();
              // Get the latest close price
              if (historyData && historyData.length > 0) {
                const latestCandle = historyData[historyData.length - 1];
                price = parseFloat(latestCandle.close) || 0;
                console.log("Using price from history:", price);
              }
            }
          } catch (historyError) {
            console.warn("Failed to fetch price from history:", historyError);
          }
        }
      } else {
        console.warn(`Error fetching token price: ${priceResponse.statusText}`);
      }

      setTokenInfo({
        name: metadataData.name || "Unknown Token",
        symbol: metadataData.symbol || "???",
        price: price,
        logo: metadataData.logo || "",
        mint: tokenAddress, // Store the address for compatibility
      });
    } catch (error) {
      console.error("Failed to fetch token data:", error);
    } finally {
      setIsTokenLoading(false);
    }
  }, [tokenAddress]);

  // Use tokenData prop if available, otherwise fetch from API
  useEffect(() => {
    if (tokenData) {
      // Use pre-fetched data from trending list
      setTokenInfo({
        name: tokenData.name,
        symbol: tokenData.symbol,
        price: tokenData.price,
        logo: tokenData.logo || "",
        mint: tokenData.address,
      });
      setIsTokenLoading(false);
    } else if (tokenAddress) {
      // Fallback: fetch from API if no tokenData provided
      fetchTokenMetadata();
    }
  }, [tokenData, tokenAddress, fetchTokenMetadata]);

  // Copy address to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="universal-widget">
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-white shadow-2xl w-full backdrop-blur-sm">
        {/* Header and Balance */}
        <WidgetHeader
          title={title}
          isConnected={isConnected}
          balanceLoading={balanceLoading}
          isRefreshing={isRefreshing}
          totalBalanceUSD={totalBalanceUSD}
          fetchBalance={fetchBalance}
          onBalanceClick={() => setAssetsDialogOpen(true)}
        />

        {/* Assets Dialog */}
        <AssetsDialog
          open={assetsDialogOpen}
          onOpenChange={setAssetsDialogOpen}
          assets={assets}
          totalAmountInUSD={totalBalanceUSD || 0}
          isLoading={balanceLoading}
        />

        {/* Connect/Disconnect Section */}
        <ConnectSection
          isConnected={isConnected}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          accountInfo={accountInfo}
          address={address}
          loading={loading}
          copiedAddress={copiedAddress}
          copyToClipboard={copyToClipboard}
          truncateAddress={truncateAddress}
          disconnect={disconnect}
        />

        {/* Trading Interface - Grid Layout for Terminal Look */}
        {isConnected && !loading && (
          <div className="mt-6">
            <TradingInterface
              tokenInfo={tokenInfo}
              isTokenLoading={isTokenLoading}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              usdAmount={usdAmount}
              tokenAddress={tokenAddress}
              setUsdAmount={setUsdAmount}
              universalAccount={ua}
              walletClient={walletClient}
              address={address || null}
              accountInfo={accountInfo}
              onTransactionComplete={handleTransactionComplete}
            />
          </div>
        )}

        {/* Loading Indicator */}
        {loading && <LoadingIndicator />}
      </div>
    </div>
  );
}

export default UniversalAccountsWidget;
