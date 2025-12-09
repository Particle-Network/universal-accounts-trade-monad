"use client";

import {
  ConnectButton,
  useParticleAuth,
  useWallets,
} from "@particle-network/connectkit";
import { Button } from "../../../components/ui/button";
import { AccountsDialog } from "../AccountsDialog";
import { AccountInfo } from "../../../lib/types";
import { useEffect } from "react";

interface ConnectSectionProps {
  isConnected: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  accountInfo: AccountInfo | null;
  address: string | undefined;
  loading: boolean;
  copiedAddress: string | null;
  copyToClipboard: (text: string) => Promise<void>;
  truncateAddress: (address: string, chars?: number) => string;
  disconnect: () => void;
}

export function ConnectSection({
  isConnected,
  dialogOpen,
  setDialogOpen,
  accountInfo,
  address,
  loading,
  copiedAddress,
  copyToClipboard,
  truncateAddress,
  disconnect,
}: ConnectSectionProps) {
  const { getUserInfo } = useParticleAuth();

  // Retrieve the primary wallet from the Particle Wallets
  const [primaryWallet] = useWallets();

  useEffect(() => {
    const fetchUserInfo = async () => {
      // Use walletConnectorType as a condition to avoid account not initialized errors
      if (primaryWallet?.connector?.walletConnectorType === "particleAuth") {
        const userInfo = getUserInfo();
        console.log("userInfo", userInfo);
      }
    };

    fetchUserInfo();
  }, [isConnected, getUserInfo, primaryWallet]);

  return (
    <div className="mb-6">
      {!isConnected ? (
        <div className="w-full">
          <ConnectButton />
        </div>
      ) : (
        <div className="flex gap-2">
          <AccountsDialog
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            accountInfo={accountInfo}
            address={address!}
            loading={loading}
            copiedAddress={copiedAddress}
            copyToClipboard={copyToClipboard}
            truncateAddress={truncateAddress}
          />
          <Button
            onClick={() => disconnect()}
            variant="destructive"
            size="sm"
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold px-4 py-2 shadow-lg shadow-red-600/20"
          >
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
}
