import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache to avoid redundant API calls
const CACHE_EXPIRY = 2 * 60 * 1000; // 2 minutes
interface CacheEntry {
  price: number;
  timestamp: number;
}
const cache: Record<string, CacheEntry> = {};

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Token address is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `price_${address}`;
    const cachedData = cache[cacheKey];
    const now = Date.now();

    if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
      return NextResponse.json({ usdPrice: cachedData.price });
    }

    // Get API key from environment variables
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Fetch price data from Moralis EVM API for Monad
    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${address}/price?chain=0x8f`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    console.log("Price API response status:", response.status);

    if (!response.ok) {
      // If Moralis doesn't have price data, return 0 instead of error
      console.warn(`Price data not available: ${response.statusText}`);
      return NextResponse.json({ usdPrice: 0 });
    }

    const data = await response.json();
    console.log("Price API response:", data);

    // Extract just the USD price
    const usdPrice = data.usdPrice || data.usdPriceFormatted || 0;

    // Store in cache
    cache[cacheKey] = {
      price: usdPrice,
      timestamp: now,
    };

    return NextResponse.json({ usdPrice });
  } catch (error) {
    console.error("Token price API error:", error);
    // Return 0 price instead of error for better UX
    return NextResponse.json({ usdPrice: 0 });
  }
}
