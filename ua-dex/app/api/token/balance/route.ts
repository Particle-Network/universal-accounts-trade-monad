import { NextResponse } from "next/server";

interface TokenBalance {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: string;
  balance: string;
  possible_spam: boolean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("address");
  const tokenAddress = searchParams.get("token");

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Wallet address parameter is required" },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Build the URL for Monad EVM token balances
    let url = `https://deep-index.moralis.io/api/v2.2/${walletAddress}/erc20?chain=0x8f`;

    // If a specific token is requested, add it to the query
    if (tokenAddress) {
      url += `&token_addresses=${tokenAddress}`;
    }

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Moralis API error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Balance API response:", data);

    // If a specific token was requested
    if (tokenAddress && data.length > 0) {
      const token = data[0] as TokenBalance;

      // Calculate the formatted amount
      const decimals = parseInt(token.decimals);
      const rawBalance = BigInt(token.balance);
      const divisor = BigInt(10 ** decimals);
      const formattedBalance = (
        Number(rawBalance) / Number(divisor)
      ).toString();

      return NextResponse.json({
        amount: formattedBalance,
        amountRaw: token.balance,
        decimals: decimals,
        symbol: token.symbol,
        name: token.name,
        logo: token.logo || token.thumbnail || "",
      });
    }

    // Otherwise return all tokens
    const formattedTokens = data.map((token: TokenBalance) => {
      const decimals = parseInt(token.decimals);
      const rawBalance = BigInt(token.balance);
      const divisor = BigInt(10 ** decimals);
      const formattedBalance = (
        Number(rawBalance) / Number(divisor)
      ).toString();

      return {
        tokenAddress: token.token_address,
        name: token.name,
        symbol: token.symbol,
        logo: token.logo || token.thumbnail || "",
        decimals: decimals,
        amount: formattedBalance,
        amountRaw: token.balance,
      };
    });

    return NextResponse.json(formattedTokens);
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch token balance" },
      { status: 500 }
    );
  }
}
