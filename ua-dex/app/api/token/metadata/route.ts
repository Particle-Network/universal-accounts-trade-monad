import { NextRequest, NextResponse } from "next/server";

// Define the token metadata interface for EVM tokens
interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: string;
  logo?: string;
  thumbnail?: string;
}

// Simple in-memory cache to avoid redundant API calls
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
interface CacheEntry {
  data: TokenMetadata;
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
    const cacheKey = `metadata_${address}`;
    const cachedData = cache[cacheKey];
    const now = Date.now();

    if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
      return NextResponse.json(cachedData.data);
    }

    // Get API key from environment variables
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Fetch data from Moralis EVM API for Monad
    const url = `https://deep-index.moralis.io/api/v2.2/erc20/metadata?chain=0x8f&addresses=${address}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    console.log("Metadata API response status:", response.status);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error fetching token metadata: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Metadata API response:", data);

    // Moralis returns an array of token metadata
    const tokenData = data[0];

    if (!tokenData) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Generate a fallback logo if none provided
    let logoUrl = tokenData.logo || tokenData.thumbnail || "";

    // If no logo from Moralis, generate a deterministic avatar based on address
    if (!logoUrl) {
      // Use DiceBear API to generate a unique avatar for this token
      logoUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;
    }

    // Format the response to match our expected structure
    const formattedData: TokenMetadata = {
      address: tokenData.address,
      name: tokenData.name || "Unknown Token",
      symbol: tokenData.symbol || "???",
      decimals: tokenData.decimals?.toString() || "18",
      logo: logoUrl,
    };

    // Store in cache
    cache[cacheKey] = {
      data: formattedData,
      timestamp: now,
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Token metadata API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch token metadata" },
      { status: 500 }
    );
  }
}
