# Deployment Guide

## Prerequisites

1. **Environment Variables**: Create a `.env` file in the smart-contracts directory with:
   ```bash
   # Your deployer private key (without 0x prefix)
   DEPLOYER_PRIVATE_KEY=your_private_key_here
   ```
   
   **Note**: The RPC URL is hardcoded in the script to use Alchemy: `https://avax-fuji.g.alchemy.com/v2/WXrKKhwNKQMoruWD5WqxrA4CG9gIj0ik`

2. **Testnet AVAX**: Make sure your deployer wallet has AVAX on Fuji testnet
   - Get testnet AVAX from: https://faucet.avax.network/

3. **LINK Tokens**: You'll need LINK tokens on Fuji for Chainlink Functions
   - Get testnet LINK from: https://faucets.chain.link/

## Deployment Commands

### Deploy to Avalanche Fuji

The deployment script uses hardcoded Alchemy RPC URL and reads the private key from `.env`:

```bash
# Simple deployment - RPC URL is hardcoded, private key from .env
forge script script/DeployGettingStarted.s.sol:DeployGettingStarted --broadcast

# With verification (requires setting up foundry.toml with etherscan config)
forge script script/DeployGettingStarted.s.sol:DeployGettingStarted --broadcast --verify
```

**That's it!** No need to specify RPC URL or private key in the command - they're handled automatically.

## After Deployment

1. **Fund with LINK**: Send LINK tokens to your deployed contract address
2. **Create Subscription**: Go to https://functions.chain.link/ and create a subscription
3. **Add Consumer**: Add your contract address as a consumer to the subscription
4. **Test Function**: Call `sendRequest()` with your subscription ID and test arguments

## Contract Configuration

The deployed contract is configured for Avalanche Fuji:
- **Router**: `0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0`
- **DON ID**: `fun-avalanche-fuji-1`
- **Gas Limit**: `300000`

## Testing the Deployment

After deployment, you can test the Star Wars API function:
```bash
# Example: Get character 1 (Luke Skywalker)
cast send YOUR_CONTRACT_ADDRESS \
    "sendRequest(uint64,string[])" \
    YOUR_SUBSCRIPTION_ID \
    '["1"]' \
    --rpc-url https://avax-fuji.g.alchemy.com/v2/WXrKKhwNKQMoruWD5WqxrA4CG9gIj0ik \
    --private-key $DEPLOYER_PRIVATE_KEY
``` 