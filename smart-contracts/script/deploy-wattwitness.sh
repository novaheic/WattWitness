#!/bin/bash

# deploy-wattwitness.sh
# ------------------------------------------------------------
# WattWitness Deployment Script
# 
# This script will:
# 1) Validate your environment setup
# 2) Deploy WattWitnessDataLogger contract
# 3) Verify the contract on Snowtrace
# 4) Guide you through Chainlink Functions setup
# 5) Provide next steps for automation setup
#
# Usage: ./deploy-wattwitness.sh [network]
# Default network: fuji (Avalanche Fuji testnet)
# ------------------------------------------------------------

set -euo pipefail
NETWORK="${1:-fuji}"

echo "🌟 WattWitness Deployment System"
echo "================================"
echo ""

# Check for .env file
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  echo ""
  echo "📋 Please create a .env file with the following variables:"
  echo "DEPLOYER_PRIVATE_KEY=0x..."
  echo "CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID=..."
  echo "AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc"
  echo ""
  echo "💡 See the README.md for detailed setup instructions"
  exit 1
fi

# Load environment variables
echo "🔧 Loading environment variables..."
set -a
source .env
set +a

# Validate required environment variables
echo "✅ Validating environment setup..."
REQUIRED_VARS=("DEPLOYER_PRIVATE_KEY" "CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "💡 Please add these to your .env file and try again"
    exit 1
fi

# Set RPC URL if not provided
if [ -z "${AVALANCHE_FUJI_RPC:-}" ]; then
    export AVALANCHE_FUJI_RPC="https://api.avax-test.network/ext/bc/C/rpc"
    echo "ℹ️  Using default Avalanche Fuji RPC: $AVALANCHE_FUJI_RPC"
fi

echo "✅ Environment validation complete!"
echo ""

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry not found!"
    echo "💡 Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

SCRIPT_NAME="DeployCompressedWattWitness"
SCRIPT_PATH="script/DeployWattWitnessDataLogger.s.sol:${SCRIPT_NAME}"

echo "🚀 Deploying WattWitnessDataLogger on $NETWORK..."
echo "📋 Contract will be configured with:"
echo "   - Subscription ID: $CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID"
echo "   - Network: $NETWORK"
echo "   - Gas Limit: 300,000"
echo ""

DEPLOY_OUTPUT=$(forge script "$SCRIPT_PATH" \
  --rpc-url "$NETWORK" \
  --broadcast \
  --verify)

echo "$DEPLOY_OUTPUT"

# Extract contract address from output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -E "Contract Address:" | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "❌ Unable to parse contract address from deployment output" >&2
  exit 1
fi

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "========================"
echo "✅ Contract Address: $CONTRACT_ADDRESS"
echo "🔗 Snowtrace: https://testnet.snowtrace.io/address/$CONTRACT_ADDRESS#code"
echo ""

# Save contract address to .env for future use
if ! grep -q "WATTWITNESS_CONTRACT_ADDRESS" .env; then
    echo "WATTWITNESS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> .env
    echo "💾 Contract address saved to .env file"
else
    sed -i.bak "s/WATTWITNESS_CONTRACT_ADDRESS=.*/WATTWITNESS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env
    echo "💾 Contract address updated in .env file"
fi

echo ""
echo "🔗 CHAINLINK FUNCTIONS SETUP REQUIRED"
echo "====================================="
echo "Your contract is deployed but needs to be added to your Chainlink Functions subscription."
echo ""
echo "📋 STEP 1: Add Consumer to Subscription"
echo "1. Go to: https://functions.chain.link/avalanche-fuji/$CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID"
echo "2. Click 'Add consumer'"
echo "3. Enter contract address: $CONTRACT_ADDRESS"
echo "4. Confirm the transaction"
echo ""
echo "💰 STEP 2: Fund Your Subscription"
echo "Ensure your subscription has sufficient LINK tokens (recommended: 2+ LINK)"
echo ""
echo "🧪 STEP 3: Test Manual Request"
echo "Once the consumer is added, test with:"
echo "   ./trigger-wattwitness-request.sh"
echo ""
echo "🤖 STEP 4: Setup Automation (Optional)"
echo "For automatic data fetching, set up Chainlink Automation:"
echo "1. Go to: https://automation.chain.link/avalanche-fuji"
echo "2. Create new upkeep with contract address: $CONTRACT_ADDRESS"
echo "3. Set interval (recommended: 300 seconds / 5 minutes)"
echo "4. Fund with LINK tokens"
echo ""
echo "📚 For detailed instructions, see: README.md"
echo ""
echo "⚠️  IMPORTANT: Complete STEP 1 before testing!"