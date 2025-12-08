import { NextRequest, NextResponse } from "next/server";

// Define the trending token interface based on Moralis API response
interface TrendingToken {
  chainId: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string | null;
  usdPrice: number;
  marketCap: number;
  liquidityUsd: number;
  pricePercentChange: {
    "1h": number;
    "4h": number;
    "12h": number;
    "24h": number;
  };
  totalVolume: {
    "24h": number;
  };
}

// Simple in-memory cache
const CACHE_EXPIRY = 60 * 1000; // 1 minute
interface CacheEntry {
  data: TrendingToken[];
  timestamp: number;
}
let cache: CacheEntry | null = null;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "25";

    // Check cache first
    const now = Date.now();
    if (cache && now - cache.timestamp < CACHE_EXPIRY) {
      return NextResponse.json({ tokens: cache.data });
    }

    // Get API key from environment
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Fetch trending tokens from Moralis
    const url = `https://deep-index.moralis.io/api/v2.2/tokens/trending?chain=monad&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error fetching trending tokens: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: TrendingToken[] = await response.json();

    // Cache the result
    cache = {
      data,
      timestamp: now,
    };

    return NextResponse.json({ tokens: data });
  } catch (error) {
    console.error("Trending tokens API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending tokens" },
      { status: 500 }
    );
  }
}
