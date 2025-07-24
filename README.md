# Instant Swap Widget

A modern, user-friendly instant swap widget powered by Particle Network's Universal Accounts. This application demonstrates how to build a cross-chain trading interface with a simplified user experience using chain abstraction.

This widget is meant to be used as a component in a larger application, and it provides a simple way to add instant swap functionality to your app. 

The main page in this app is a simple input bar where you manually add a contract address, the widget will fetch the token data and allow the user to instantly trade, the idea is to place it within a token's info page, so you can use the token address as a prop.

> 🎥 Find a quick video overview in this [Tweet](https://x.com/web3Dav3/status/1930376411816030307).

## Features

- **Universal Account Integration**: Wallet connection via Particle Connect and transaction handling through Universal Accounts
- **Token Trading Interface**: Clean, intuitive UI for trading tokens
- **Real-time Price Data**: Live token price fetching via Moralis API
- **Transaction Fee Estimation**: Preview gas costs before confirming trades
- **Responsive Design**: Works on desktop and mobile devices

## Current Limitations

- **Solana-Only Buy/Sell Support**: Currently only supports buy/sell Solana tokens due to:
  - Token data API integration specifically for Solana (via Moralis)
  - Universal Account configuration targeting Solana mainnet
  - The user can still trade using the fully universal balance from any supported chain.

## Prerequisites

- Node.js 18+ and npm/yarn
- Particle Network Project credentials for Particle Connect and UA SDK(get one at [dashboard.particle.network](https://dashboard.particle.network))
- Moralis API Key for token data (get one at [moralis.io](https://moralis.io))

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/soos3d/instant-trade-widget.git
   cd ua-dex
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file with your API keys

The Solana RPC is used to fetch the token balance.

   ```
    NEXT_PUBLIC_PROJECT_ID=""
    NEXT_PUBLIC_CLIENT_KEY=""
    NEXT_PUBLIC_APP_ID=""
    NEXT_PUBLIC_SERVER_KEY=""
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=""
    MORALIS_API_KEY=""
    SOLANA_RPC_URL=""
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use the Widget

The widget is designed to be easily integrated into any React application. In the demo app, it's used in the main page (`app/page.tsx`) as follows:

```tsx
// Import the widget component
import UniversalAccountsWidget from "./components/Widget";

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState(
    "2nM6WQAUf4Jdmyd4kcSr8AURFoSDe9zsmRXJkFoKpump" // Default token address
  );
  
  // Form handling for token address input
  const [inputValue, setInputValue] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setTokenAddress(inputValue.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="max-w-lg mx-auto pt-20">
        {/* Page header and token input form */}
        
        {/* The widget component */}
        <UniversalAccountsWidget
          projectId={process.env.NEXT_PUBLIC_UA_PROJECT_ID}
          title="Universal Swap"
          tokenAddress={tokenAddress}
        />
      </div>
    </div>
  );
}
```

The widget accepts the following props:
- `projectId`: Your Particle Network Universal Accounts project ID
- `title`: The title displayed at the top of the widget
- `tokenAddress`: The address of the token to be traded

You can integrate this widget into any page of your application where you want to offer token trading functionality.

## Adding Support for Other Chains

To extend this widget to support other blockchain networks, you'll need to implement chain detection logic in the BuyTabContent component. The transaction preview and execution are both handled in this component, making it the central place for adding multi-chain support.

### Chain Detection Implementation

The main change would be to include some logic to detect on witch chain the token is, so you can then adapt the `createBuyTransaction` function to use the correct chain id.

### Update Transaction Preview Logic

Modify the `estimateFees` function in BuyTabContent.tsx to use the detected chain:

```typescript
const estimateFees = useCallback(
  async (amount: string) => {
    // ...
    const chainId = detectTokenChain(tokenAddress);
    
    const transaction = await universalAccount.createBuyTransaction({
      token: { chainId: chainId, address: tokenAddress },
      amountInUSD: amount,
    });
    // ...
  },
  [universalAccount, tokenAddress]
);
```

### Update Transaction Execution Logic

Similarly, update the `handleBuyToken` function to use the detected chain:

```typescript
const handleBuyToken = async (amount: string) => {
  // ...
  const chainId = detectTokenChain(tokenAddress);
  
  const transaction = await universalAccount.createBuyTransaction({
    token: { chainId: chainId, address: tokenAddress },
    amountInUSD: amount,
  });
  // ...
};
```

### 3. Extend Token API Services

Create chain-specific API handlers for token data:

1. Create a new directory structure for multi-chain support:
   ```
   /app/api/token/[chain]/metadata/route.ts
   /app/api/token/[chain]/price/route.ts
   /app/api/token/[chain]/balance/route.ts
   ```

2. Implement chain-specific API routes:
   ```typescript
   // Example for Ethereum token metadata
   export async function GET(
     request: NextRequest,
     { params }: { params: { chain: string } }
   ) {
     const chain = params.chain;
     const searchParams = request.nextUrl.searchParams;
     const address = searchParams.get("address");
     
     if (chain === "ethereum") {
       // Use Ethereum-specific API (e.g., Etherscan, Alchemy)
       // ...
     } else if (chain === "solana") {
       // Existing Solana implementation
       // ...
     }
     // ...
   }
   ```
