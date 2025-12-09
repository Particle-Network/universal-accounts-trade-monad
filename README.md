# Monad Trading Terminal - Universal Accounts Demo

A developer demo showcasing how to integrate **Particle Network's Universal Accounts SDK** to build cross-chain trading functionality. This app demonstrates chain abstraction, where users can trade tokens on Monad using a unified balance from any supported chain.

## What You'll Learn

This demo teaches you how to:

1. **Initialize the Universal Account SDK** - Connect to Particle Network's infrastructure
2. **Fetch unified balances** - Get aggregated balance across all supported chains
3. **Execute buy/sell transactions** - Trade tokens with chain abstraction
4. **Preview transaction fees** - Estimate costs before executing trades

## Project Structure

```
ua-dex/
├── app/
│   ├── components/
│   │   ├── Widget.tsx              # Main UA widget - SDK initialization & balance fetching
│   │   ├── TrendingTokens.tsx      # Token list component
│   │   └── widget/
│   │       ├── BuyTabContent.tsx   # Buy transaction logic
│   │       ├── SellTabContent.tsx  # Sell transaction logic
│   │       └── AssetsDialog.tsx    # Assets breakdown display
│   ├── api/token/                  # Backend API routes (Moralis integration)
│   │   ├── trending/route.ts       # Fetch trending tokens
│   │   ├── metadata/route.ts       # Token metadata
│   │   └── price/route.ts          # Token prices
│   └── page.tsx                    # Main page layout
├── lib/
│   ├── types.ts                    # TypeScript interfaces
│   └── utils.ts                    # Helper functions
└── components/ui/                  # Shadcn UI components
```

## Key SDK Concepts

### 1. Initialize Universal Account

```typescript
// app/components/Widget.tsx
import { UniversalAccount } from "@particle-network/universal-account-sdk";

const universalAccount = new UniversalAccount({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  projectClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY,
  projectAppUuid: process.env.NEXT_PUBLIC_APP_ID,
  ownerAddress: address, // Connected wallet address
});
```

### 2. Fetch Unified Balance

```typescript
// Get total balance across all chains
const { totalAmountInUSD, assets } = await universalAccount.getPrimaryAssets();

// assets contains breakdown by chain/token
for (const asset of assets) {
  console.log(`${asset.tokenType}: $${asset.amountInUSD}`);
}
```

### 3. Execute Buy Transaction

```typescript
// app/components/widget/BuyTabContent.tsx
const transaction = await universalAccount.createBuyTransaction({
  token: { chainId: 143, address: tokenAddress }, // Monad chainId
  amountInUSD: "10", // Buy $10 worth using unified balance
});

// Sign with connected wallet
const signature = await walletClient.signMessage({
  account: address,
  message: { raw: transaction.rootHash },
});

// Send transaction
const result = await universalAccount.sendTransaction(transaction, signature);
console.log(
  `TX: https://universalx.app/activity/details?id=${result.transactionId}`
);
```

### 4. Execute Sell Transaction

```typescript
// app/components/widget/SellTabContent.tsx
const transaction = await universalAccount.createSellTransaction({
  token: { chainId: 143, address: tokenAddress },
  amount: "100", // Sell 100 tokens
});

const signature = await walletClient.signMessage({
  account: address,
  message: { raw: transaction.rootHash },
});

const result = await universalAccount.sendTransaction(transaction, signature);
```

## Quick Start

### Prerequisites

- Node.js 18+
- [Particle Network credentials](https://dashboard.particle.network) (Project ID, Client Key, App ID)
- [Moralis API Key](https://moralis.io) (for token data)

### Setup

1. Clone and install:

   ```bash
   git clone https://github.com/soos3d/instant-trade-widget.git
   cd ua-dex
   yarn install
   ```

2. Create `.env.local`:

   ```env
   NEXT_PUBLIC_PROJECT_ID=""
   NEXT_PUBLIC_CLIENT_KEY=""
   NEXT_PUBLIC_APP_ID=""
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=""
   MORALIS_API_KEY=""
   ```

3. Run:

   ```bash
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## APIs Used

| API                                                                                                                | Purpose                                             |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [Particle Universal Accounts SDK](https://developers.particle.network/universal-accounts/ua-reference/desktop/web) | Chain abstraction, unified balance, transactions    |
| [Particle Connect](https://developers.particle.network/connect/connect)                                            | Wallet connection (MetaMask, WalletConnect, social) |
| [Moralis EVM API](https://docs.moralis.io/web3-data-api/evm/reference)                                             | Token metadata, prices, trending tokens             |

## Learn More

- [Universal Accounts Overview](https://developers.particle.network/universal-accounts/cha/overview)
- [UA SDK Reference](https://developers.particle.network/universal-accounts/ua-reference/desktop/web)
- [Supported Chains](https://developers.particle.network/universal-accounts/cha/chains)

## License

MIT
