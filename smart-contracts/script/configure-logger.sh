#!/bin/bash

# configure-logger.sh
# Configure a deployed WattWitnessDataLogger with Chainlink Functions parameters

set -euo pipefail

LOGGER_ADDRESS="${1:-}"
if [ -z "$LOGGER_ADDRESS" ]; then
  echo "Usage: $0 <LOGGER_ADDRESS>"
  echo "Example: $0 0x9301A8a9e2Ff87A6713068DcC64955b62Bee7612"
  exit 1
fi

# Load environment
source .env 2>/dev/null || { echo "❌ .env file not found"; exit 1; }

# Required vars
: ${DEPLOYER_PRIVATE_KEY:?}
: ${CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID:?}
: ${AVALANCHE_FUJI_RPC:=https://api.avax-test.network/ext/bc/C/rpc}

echo "🔧 Configuring logger at $LOGGER_ADDRESS"
echo "📋 Configuration:"
echo "   - Subscription ID: $CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID"
echo "   - Gas Limit: 2000000"
echo "   - DON ID: fun-avalanche-fuji-1"

# Read the compressed source code
SOURCE_CODE=$(cat chainlink-functions/source-wattwit-compressed.js)

# Configure the logger
cast send "$LOGGER_ADDRESS" \
  "configure(uint64,uint32,bytes32,string)" \
  "$CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID" \
  "300000" \
  "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000" \
  "$SOURCE_CODE" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --rpc-url "$AVALANCHE_FUJI_RPC"

echo "✅ Logger configured successfully!"
echo "🧪 You can now test with:"
echo "   cast send $LOGGER_ADDRESS 'requestWattWitnessData()' --private-key \$DEPLOYER_PRIVATE_KEY --rpc-url \$AVALANCHE_FUJI_RPC" 