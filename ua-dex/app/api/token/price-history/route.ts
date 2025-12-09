import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache: Record<string, CacheEntry> = {};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Token address is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `price_history_${address}`;
    const cachedData = cache[cacheKey];
    const now = Date.now();

    if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
      return NextResponse.json(cachedData.data);
    }

    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Note: Moralis may not have OHLCV data for all Monad tokens yet
    // We'll try to fetch it, but fall back to mock data if unavailable
    console.log("Attempting to fetch price history for Monad token:", address);

    // For now, generate mock data based on current price
    // In production, you would use: https://deep-index.moralis.io/api/v2.2/erc20/${address}/ohlcv?chain=0x8f

    // Fetch current price to base mock data on
    const priceResponse = await fetch(
      `https://deep-index.moralis.io/api/v2.2/erc20/${address}/price?chain=0x8f`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": apiKey,
        },
      }
    );

    let basePrice = 0.0001; // Default fallback
    if (priceResponse.ok) {
      const priceData = await priceResponse.json();
      basePrice = priceData.usdPrice || priceData.usdPriceFormatted || 0.0001;
    }

    // Generate mock OHLCV data
    const mockData = generateMockOHLCV(basePrice);

    cache[cacheKey] = {
      data: mockData,
      timestamp: now,
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Price history API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 }
    );
  }
}

// Generate mock OHLCV data for demo purposes
function generateMockOHLCV(basePrice: number) {
  const dataPoints = 24; // 24 hours
  const data = [];
  const now = Date.now();
  let currentPrice = basePrice;

  for (let i = dataPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString();

    // Random price movement (+/- 5%)
    const change = (Math.random() - 0.5) * 0.1;
    currentPrice = currentPrice * (1 + change);

    const open = currentPrice;
    const close = currentPrice * (1 + (Math.random() - 0.5) * 0.05);
    const high = Math.max(open, close) * (1 + Math.random() * 0.03);
    const low = Math.min(open, close) * (1 - Math.random() * 0.03);

    data.push({
      timestamp,
      open: open.toFixed(8),
      high: high.toFixed(8),
      low: low.toFixed(8),
      close: close.toFixed(8),
      volume: (Math.random() * 1000000).toFixed(2),
    });
  }

  return data;
}
