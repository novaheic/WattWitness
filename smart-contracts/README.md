# WattWitness Smart Contracts

WattWitness is a decentralized solar energy monitoring system that uses Chainlink Functions to fetch real-time solar power data and store it on-chain with merkle tree batch processing for unlimited scalability.

## 🌟 Features

- **Chainlink Functions Integration**: Fetches solar data from WattWitness API
- **Merkle Tree Batch Processing**: Unlimited scalability with 256-byte response limit
- **Event-Driven Storage**: Gas-efficient individual reading events
- **160-Byte Optimized Responses**: 62.5% of Chainlink's 256-byte limit
- **Automatic Verification**: Smart contract verification on Snowtrace
- **Mock Data Fallback**: Reliable operation even when API is unavailable

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Foundry** installed: https://book.getfoundry.sh/getting-started/installation
2. **Node.js** (v16+) and **npm** for some utilities
3. **Avalanche Fuji testnet AVAX** for gas fees
4. **Chainlink Functions subscription** with LINK tokens
5. **Private key** for deployment (never share this!)

## 🚀 Quick Start

### Step 1: Environment Setup

1. Clone the repository and navigate to smart contracts:
```bash
cd smart-contracts
```

2. Create a `.env` file with your configuration:
```bash
# Required variables
DEPLOYER_PRIVATE_KEY=0x1234567890abcdef...  # Your private key (never share!)
CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID=123     # Your Chainlink Functions subscription ID

# Optional (defaults provided)
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
```

### Step 2: Deploy the Contract

Run the deployment script:
```bash
./script/deploy-wattwitness.sh
```

This script will:
- ✅ Validate your environment setup
- ✅ Deploy WattWitnessDataLogger contract
- ✅ Verify the contract on Snowtrace
- ✅ Save the contract address to your `.env` file
- ✅ Provide next steps for Chainlink setup

### Step 3: Chainlink Functions Setup

After deployment, you need to add your contract as a consumer to your Chainlink Functions subscription:

1. **Add Consumer**: Go to https://functions.chain.link/avalanche-fuji/[YOUR_SUBSCRIPTION_ID]
2. Click "Add consumer"
3. Enter your deployed contract address
4. Confirm the transaction

### Step 4: Test Manual Request

Once the consumer is added, test the system:
```bash
./trigger-wattwitness-request.sh
```

This will send a manual request and show you how to monitor the results.

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DEPLOYER_PRIVATE_KEY` | Yes | Your wallet private key | - |
| `CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID` | Yes | Your Chainlink Functions subscription ID | - |
| `AVALANCHE_FUJI_RPC` | No | Avalanche Fuji RPC URL | `https://api.avax-test.network/ext/bc/C/rpc` |
| `WATTWITNESS_CONTRACT_ADDRESS` | Auto | Deployed contract address (auto-saved) | - |

### Contract Configuration

The deployed contract is automatically configured with:
- **Gas Limit**: 300,000 (maximum for Chainlink Functions)
- **DON ID**: `fun-avalanche-fuji-1`
- **Batch Size**: 20 readings per batch (adjustable)
- **Response Format**: 160 bytes (merkle root + latest reading)

## 📊 Monitoring and Testing

### Manual Testing

Use the trigger script to send manual requests:
```bash
./trigger-wattwitness-request.sh
```

### Monitoring Events

Watch for these events on Snowtrace:

1. **RequestSent** (immediate): Request submitted to Chainlink
2. **ResponseReceived** (1-3 min): Response received from API
3. **PowerReading** (1-3 min): Individual reading events
4. **BatchProcessed** (1-3 min): Batch processing summary

### Using Cast for Monitoring

```bash
# Watch all contract events
cast logs --address $WATTWITNESS_CONTRACT_ADDRESS --rpc-url $AVALANCHE_FUJI_RPC

# Check latest response
cast call $WATTWITNESS_CONTRACT_ADDRESS "getLatestResponse()" --rpc-url $AVALANCHE_FUJI_RPC

# Get batch information
cast call $WATTWITNESS_CONTRACT_ADDRESS "getLatestBatchInfo()" --rpc-url $AVALANCHE_FUJI_RPC
```

## 🤖 Chainlink Automation (Optional)

For automatic data fetching, set up Chainlink Automation:

1. Go to https://automation.chain.link/avalanche-fuji
2. Click "Register new upkeep"
3. Choose "Custom logic" upkeep
4. Enter your contract address
5. Set upkeep name: "WattWitness Data Fetcher"
6. Set gas limit: 500,000
7. Set starting balance: 5 LINK
8. Set interval: 300 seconds (5 minutes)
9. Complete registration and fund the upkeep

## 🏗️ Architecture

### Smart Contract Structure

```
WattWitnessDataLogger.sol
├── FunctionsClient (Chainlink base)
├── ConfirmedOwner (access control)
├── Batch processing (merkle trees)
├── Event emission (PowerReading events)
└── Verification functions (merkle proofs)
```

### Data Flow

1. **Request**: Contract calls Chainlink Functions
2. **API Fetch**: JavaScript source fetches from WattWitness API
3. **Processing**: Builds merkle tree and compresses response
4. **Callback**: 160-byte response processed on-chain
5. **Events**: Individual PowerReading events emitted
6. **Storage**: Merkle root and metadata stored

### Response Format (160 bytes)

```
Bytes 0-31:   Merkle Root (32 bytes)
Bytes 32-63:  Reading ID (32 bytes)  
Bytes 64-95:  Power in Watts (32 bytes)
Bytes 96-127: Total Energy in Wh (32 bytes)
Bytes 128-159: Timestamp (32 bytes)
```

## 🛠️ Development

### Building

```bash
forge build
```

### Testing

```bash
forge test
```

### Local Development

For local testing with Anvil:
```bash
# Start local blockchain
anvil

# Deploy to local (in another terminal)
forge script script/DeployWattWitnessDataLogger.s.sol:DeployCompressedWattWitness --rpc-url http://localhost:8545 --broadcast
```

## 🔍 Troubleshooting

### Common Issues

**"Transaction Failed"**
- Ensure contract is added as consumer to Chainlink subscription
- Check AVAX balance for gas fees
- Verify private key and contract address

**"No ResponseReceived Event"**
- Check Chainlink Functions subscription balance (need 1+ LINK)
- Verify consumer is properly added
- Wait up to 5 minutes for response

**"API Request Failed"**
- System automatically falls back to mock data
- Check WattWitness API status
- Verify internet connectivity

### Getting Help

1. Check contract events on Snowtrace
2. Review Chainlink Functions documentation
3. Verify subscription and consumer setup
4. Check environment variables

### Useful Commands

```bash
# Check AVAX balance
cast balance $DEPLOYER_ADDRESS --rpc-url $AVALANCHE_FUJI_RPC

# Check LINK balance (subscription)
# Visit: https://functions.chain.link/avalanche-fuji/[SUBSCRIPTION_ID]

# View contract on Snowtrace
# https://testnet.snowtrace.io/address/[CONTRACT_ADDRESS]

# Manual contract call
cast send $WATTWITNESS_CONTRACT_ADDRESS "requestWattWitnessData()" --private-key $DEPLOYER_PRIVATE_KEY --rpc-url $AVALANCHE_FUJI_RPC
```

## 📚 Additional Resources

- [Chainlink Functions Documentation](https://docs.chain.link/chainlink-functions)
- [Avalanche Fuji Testnet](https://docs.avax.network/quickstart/fuji-workflow)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [WattWitness API Documentation](https://wattwitness-api.loca.lt/docs)

## 🔐 Security Notes

- Never commit private keys to version control
- Use environment variables for sensitive data
- Test on testnets before mainnet deployment
- Regularly update dependencies
- Monitor contract events for unexpected behavior

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
