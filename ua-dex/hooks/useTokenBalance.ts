import { useState, useCallback } from "react";

interface TokenBalance {
  associatedTokenAddress: string;
  mint: string;
  amountRaw: string;
  amount: string;
  decimals: number;
  name: string;
  symbol: string;
  logo: string;
}

interface UseTokenBalanceOptions {
  expectZero?: boolean;
  maxRetries?: number;
}

/**
 * Hook to fetch token balance with retry logic for RPC delays
 */
export function useTokenBalance() {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);

  // Helper function for delaying execution
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Fetch token balance with retry logic
   * @param accountAddress - EVM UA address (for Monad)
   * @param tokenAddress - Token contract address
   * @param options - Optional configuration (expectZero, maxRetries)
   * @returns The token balance or null
   */
  const fetchTokenBalance = useCallback(
    async (
      accountAddress: string | undefined | null,
      tokenAddress: string | undefined | null,
      options?: UseTokenBalanceOptions
    ): Promise<TokenBalance | null> => {
      const MAX_RETRIES = options?.maxRetries || 8;
      const RETRY_DELAY = 1000; // 1 second between retries
      const expectZero = options?.expectZero || false;

      if (!accountAddress || !tokenAddress) {
        return null;
      }

      setIsLoading(true);

      try {
        console.log("Fetching token balance...");

        // Helper function to fetch balance with retries
        const fetchBalanceWithRetries =
          async (): Promise<TokenBalance | null> => {
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
              try {
                console.log(
                  `Fetching balance... (attempt ${attempt}/${MAX_RETRIES})${
                    expectZero ? " (expecting zero)" : ""
                  }`
                );

                const response = await fetch(
                  `/api/token/balance?address=${accountAddress}&token=${tokenAddress}`
                );

                if (!response.ok) {
                  if (response.status === 404) {
                    console.log("Token not found in wallet");
                    // If we're expecting zero balance and get 404, this could be what we want
                    if (expectZero) {
                      console.log(
                        "Expected zero balance confirmed - token not found"
                      );
                      return null;
                    }

                    // For 404, try a few more times since the token might not be indexed yet
                    if (attempt === MAX_RETRIES) {
                      return null;
                    }
                  } else {
                    throw new Error(`HTTP error: ${response.status}`);
                  }
                } else {
                  const tokenData = await response.json();

                  if (tokenData.error) {
                    throw new Error(tokenData.error);
                  }

                  // The API now returns the specific token directly
                  const targetToken: TokenBalance = {
                    mint: tokenAddress,
                    amount: tokenData.amount,
                    amountRaw: tokenData.amountRaw,
                    decimals: tokenData.decimals,
                    symbol: tokenData.symbol,
                    name: tokenData.name,
                    logo: tokenData.logo,
                    associatedTokenAddress: "", // This field may not be needed at this point
                  };

                  console.log("Found token:", {
                    symbol: targetToken.symbol,
                    balance: targetToken.amount,
                    mint: targetToken.mint,
                    decimals: targetToken.decimals,
                  });

                  // Check if we're expecting zero and got zero or near-zero
                  const balanceNum = Number(targetToken.amount);
                  if (
                    expectZero &&
                    (balanceNum === 0 || balanceNum < 0.00001)
                  ) {
                    console.log("Expected zero balance confirmed!");
                    return targetToken;
                  }

                  // If expecting zero but balance is not zero yet, keep polling
                  if (expectZero && balanceNum > 0) {
                    console.log(
                      "Still waiting for balance to update to zero..."
                    );
                    if (attempt === MAX_RETRIES) {
                      console.log(
                        "Balance still not zero after max retries, using current value"
                      );
                      return targetToken;
                    }
                  } else {
                    // Not expecting zero or found appropriate balance
                    return targetToken;
                  }
                }

                // If we get here and haven't returned, we need to retry
                if (attempt < MAX_RETRIES) {
                  console.log(
                    `Waiting ${RETRY_DELAY}ms before next attempt...`
                  );
                  await delay(RETRY_DELAY);
                }
              } catch (error) {
                console.error(
                  `Error fetching balance (attempt ${attempt}/${MAX_RETRIES}):`,
                  error
                );

                if (attempt === MAX_RETRIES) {
                  console.error("Max retries reached, giving up");
                  return null;
                }

                // Wait before retry
                await delay(RETRY_DELAY);
              }
            }

            return null;
          };

        const result = await fetchBalanceWithRetries();
        setTokenBalance(result);
        return result;
      } catch (error) {
        console.error("Unexpected error in useTokenBalance:", error);
        setTokenBalance(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    fetchTokenBalance,
    isLoading,
    tokenBalance,
    setTokenBalance,
  };
}
