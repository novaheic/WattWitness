# WattWitness Chainlink Functions Deployment Guide

## 🚀 Quick Auto-Deployment (Recommended)

The easiest way to deploy WattWitness Solarpark with automatic CBOR encoding:

### Prerequisites

1. **Environment Variables** - Create/update your `.env` file:
```bash
# Required
DEPLOYER_PRIVATE_KEY=your_private_key_here
CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID=15652

# WattWitness API URL (update with your ngrok URL)
WATTWITNESS_API_URL=https://your-ngrok-url.ngrok-free.app

# Optional (uses public endpoint by default)
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
```

2. **Dependencies** - Ensure you have:
```bash
npm install  # For Chainlink Functions toolkit
forge --version  # For contract deployment
```

### Auto-Deployment Command

```bash
# One-command deployment with automatic CBOR encoding
./script/deploy-and-verify.sh solarpark-auto
```

This will:
1. ✅ Read your `simple-fetch-readings.js` source code
2. ✅ Automatically encode CBOR request with your API URL
3. ✅ Generate deployment script with embedded request
4. ✅ Deploy and verify contract on Avalanche Fuji
5. ✅ Configure contract with your WattWitness API settings
6. ✅ Clean up temporary files

### Expected Output

```
🚀 Starting WattWitness Solarpark Deployment with Auto-Encoding...

📋 Deployment Configuration:
==========================
Network: Avalanche Fuji Testnet
Deployer: 0x...
Router: 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0
DON ID: fun-avalanche-fuji-1
Subscription ID: 15652
WattWitness API: https://your-ngrok-url.ngrok-free.app/api/v1/readings/pending

🔧 Building CBOR Request...
✓ Source code loaded from simple-fetch-readings.js
✓ CBOR request encoded successfully
Request length: 3188 characters

🏗️  Deploying Solarpark Contract...
✓ Generated deployment script with embedded CBOR
Executing: forge script ...
[forge deployment output]

🎉 Deployment Complete!
```

## 📋 Manual Deployment (Advanced)

If you prefer manual control:

### 1. Encode CBOR Request
```bash
node encode-ngrok-request.js
```

### 2. Deploy with Forge
```bash
forge script script/DeploySolarpark.s.sol:DeploySolarpark --rpc-url fuji --broadcast --verify
```

## 🔧 Configuration Details

### Network Settings
- **Network**: Avalanche Fuji Testnet
- **Router**: `0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0`
- **DON ID**: `fun-avalanche-fuji-1`
- **Gas Limit**: 300,000
- **Subscription ID**: 15652 (configurable)

### WattWitness Integration
- **API Endpoint**: `/api/v1/readings/pending`
- **Method**: GET request to fetch pending solar readings
- **Response**: JSON with readings array and metadata
- **Error Handling**: Returns "NO_PENDING_READINGS" if empty

## 🧪 Testing Your Deployment

### 1. Verify Contract
```bash
# Check readings count (should be 0 initially)
cast call <CONTRACT_ADDRESS> "getReadingsCount()" --rpc-url fuji

# Check installation ID
cast call <CONTRACT_ADDRESS> "getInstallationId()" --rpc-url fuji
```

### 2. Test Function Call
```bash
# Trigger Chainlink Functions request
cast send <CONTRACT_ADDRESS> "sendRequestCBOR()" --private-key $DEPLOYER_PRIVATE_KEY --rpc-url fuji
```

### 3. Monitor Events
```bash
# Watch for Response events
cast logs --address <CONTRACT_ADDRESS> --rpc-url fuji

# Check for successful readings processing
cast logs --address <CONTRACT_ADDRESS> --topics "ReadingsProcessed(uint256,uint256,uint256)" --rpc-url fuji
```

## 🔄 Setting Up Automation

Once deployed and tested, set up Chainlink Automation:

1. **Visit**: [Chainlink Automation](https://automation.chain.link/)
2. **Connect**: Your wallet on Avalanche Fuji
3. **Create Upkeep**: 
   - Target: Your Solarpark contract address
   - Function: `sendRequestCBOR()`
   - Schedule: Time-based (e.g., every hour)
4. **Fund**: Add LINK to the upkeep for ongoing execution

## 🐛 Troubleshooting

### Common Issues

1. **"DEPLOYER_PRIVATE_KEY not found"**
   - Ensure your `.env` file has the private key set
   - Check that you're in the `smart-contracts` directory

2. **"Source file not found: simple-fetch-readings.js"**
   - Verify `simple-fetch-readings.js` exists in the smart-contracts directory
   - Check that the file contains valid JavaScript code

3. **"Failed to fetch pending readings"**
   - Ensure your WattWitness API is running
   - Verify ngrok tunnel is active and URL is correct
   - Check that the API responds at `/api/v1/readings/pending`

4. **"Contract deployment failed"**
   - Verify you have testnet ETH for gas fees
   - Check that your private key has sufficient balance
   - Ensure forge is installed and configured

### Verification

After deployment, verify your contract is working:

```bash
# Quick verification checklist
echo "Contract deployed: <CONTRACT_ADDRESS>"
echo "Readings count: $(cast call <CONTRACT_ADDRESS> 'getReadingsCount()' --rpc-url fuji)"
echo "Installation ID: $(cast call <CONTRACT_ADDRESS> 'getInstallationId()' --rpc-url fuji)"
echo "Owner: $(cast call <CONTRACT_ADDRESS> 'owner()' --rpc-url fuji)"
```

## 🔗 Useful Links

- [Avalanche Fuji Explorer](https://testnet.snowtrace.io)
- [Chainlink Functions Subscription Manager](https://functions.chain.link/)
- [Chainlink Automation](https://automation.chain.link/)
- [Avalanche Fuji Faucet](https://faucet.avax.network/) 