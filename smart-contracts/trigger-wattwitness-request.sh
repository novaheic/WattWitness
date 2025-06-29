#!/bin/bash

# trigger-wattwitness-request.sh
# ------------------------------------------------------------
# Manual trigger script for WattWitness data requests
# 
# This script will:
# 1) Load your environment variables
# 2) Send a manual requestWattWitnessData() transaction
# 3) Show you how to monitor the results
#
# Usage: ./trigger-wattwitness-request.sh [network]
# Default network: fuji (Avalanche Fuji testnet)
# ------------------------------------------------------------

set -euo pipefail
NETWORK="${1:-fuji}"

echo "🔥 WattWitness Manual Request Trigger"
echo "===================================="
echo ""

# Check for .env file
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  echo "💡 Please run ./deploy-wattwitness.sh first"
  exit 1
fi

# Load environment variables
echo "🔧 Loading environment variables..."
set -a
source .env
set +a

# Validate required environment variables
REQUIRED_VARS=("DEPLOYER_PRIVATE_KEY" "WATTWITNESS_CONTRACT_ADDRESS")
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
    if [ -z "${WATTWITNESS_CONTRACT_ADDRESS:-}" ]; then
        echo "💡 Run ./deploy-wattwitness.sh first to deploy the contract"
    else
        echo "💡 Please add these to your .env file and try again"
    fi
    exit 1
fi

# Set RPC URL if not provided
if [ -z "${AVALANCHE_FUJI_RPC:-}" ]; then
    export AVALANCHE_FUJI_RPC="https://api.avax-test.network/ext/bc/C/rpc"
fi

# Check if cast is installed
if ! command -v cast &> /dev/null; then
    echo "❌ Foundry cast not found!"
    echo "💡 Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

echo "✅ Environment validation complete!"
echo ""
echo "📋 Triggering request with:"
echo "   - Contract: $WATTWITNESS_CONTRACT_ADDRESS"
echo "   - Network: $NETWORK"
echo "   - RPC: $AVALANCHE_FUJI_RPC"
echo ""

# Send the transaction
echo "🚀 Sending requestWattWitnessData() transaction..."
TX_HASH=$(cast send "$WATTWITNESS_CONTRACT_ADDRESS" \
    "requestWattWitnessData()" \
    --private-key "$DEPLOYER_PRIVATE_KEY" \
    --rpc-url "$AVALANCHE_FUJI_RPC" \
    --json | jq -r '.transactionHash')

if [ "$TX_HASH" != "null" ] && [ -n "$TX_HASH" ]; then
    echo ""
    echo "🎉 REQUEST SENT SUCCESSFULLY!"
    echo "=========================="
    echo "✅ Transaction Hash: $TX_HASH"
    echo "🔗 Snowtrace: https://testnet.snowtrace.io/tx/$TX_HASH"
    echo ""
    echo "⏳ MONITORING RESULTS"
    echo "==================="
    echo "Your request is being processed by Chainlink Functions."
    echo "This typically takes 1-3 minutes."
    echo ""
    echo "📊 Ways to monitor:"
    echo "1. Check Snowtrace transaction: https://testnet.snowtrace.io/tx/$TX_HASH"
    echo "2. View contract events: https://testnet.snowtrace.io/address/$WATTWITNESS_CONTRACT_ADDRESS#events"
    echo "3. Use cast to watch for events:"
    echo "   cast logs --address $WATTWITNESS_CONTRACT_ADDRESS --rpc-url $AVALANCHE_FUJI_RPC"
    echo ""
    echo "🔍 Expected Events:"
    echo "   - RequestSent: Immediate (request submitted)"
    echo "   - ResponseReceived: 1-3 minutes (response from API)"
    echo "   - PowerReading: 1-3 minutes (individual reading events)"
    echo "   - BatchProcessed: 1-3 minutes (batch summary)"
    echo ""
    echo "💡 TIP: If no ResponseReceived event appears after 5 minutes,"
    echo "   check your Chainlink Functions subscription balance and consumer status."
else
    echo ""
    echo "❌ TRANSACTION FAILED"
    echo "=================="
    echo "The transaction could not be sent. Common causes:"
    echo "1. Contract not added to Chainlink Functions subscription"
    echo "2. Insufficient AVAX for gas fees"
    echo "3. Network connectivity issues"
    echo ""
    echo "💡 Troubleshooting:"
    echo "1. Ensure contract is added as consumer: https://functions.chain.link/avalanche-fuji"
    echo "2. Check AVAX balance: cast balance $DEPLOYER_ADDRESS --rpc-url $AVALANCHE_FUJI_RPC"
    echo "3. Verify contract address: $WATTWITNESS_CONTRACT_ADDRESS"
    exit 1
fi 