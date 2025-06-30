#!/bin/bash

# deploy-wattwitness.sh
# ------------------------------------------------------------
# WattWitness Deployment Script
# 
# This script will:
# 1) Validate your environment setup
# 2) Deploy logger via WattWitnessLoggerFactory (if FACTORY_ADDRESS provided)
#    or deploy both factory and logger if not.
# 3) Verify newly deployed contracts on Snowtrace
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
# If FACTORY_ADDRESS is not provided we will deploy it.
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

# Check if Foundry is installed (forge & cast)
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry not found!"
    echo "💡 Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

# Ensure cast present
if ! command -v cast &> /dev/null; then
    echo "❌ 'cast' (Foundry) not found!"
    exit 1
fi

# ---------------------------------------------------------------------
# 1) Deploy factory if needed
# ---------------------------------------------------------------------

if [ -z "${FACTORY_ADDRESS:-}" ]; then
  echo "🏗  No FACTORY_ADDRESS provided – deploying WattWitnessLoggerFactory..."
  FACTORY_SCRIPT="script/DeployLoggerFactory.s.sol:DeployLoggerFactory"

  FACTORY_OUTPUT=$(forge script "$FACTORY_SCRIPT" \
      --rpc-url "$AVALANCHE_FUJI_RPC" \
      --private-key "$DEPLOYER_PRIVATE_KEY" \
      --broadcast)

  FACTORY_ADDRESS=$(echo "$FACTORY_OUTPUT" | grep -E "LoggerFactory deployed at:" | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)

  if [ -z "$FACTORY_ADDRESS" ]; then
      echo "❌ Unable to parse factory address from output" >&2
      exit 1
  fi

  echo "✅ Factory deployed at $FACTORY_ADDRESS"

  # Persist in .env
  if ! grep -q "FACTORY_ADDRESS" .env; then
      echo "FACTORY_ADDRESS=$FACTORY_ADDRESS" >> .env
  else
      sed -i.bak "s/FACTORY_ADDRESS=.*/FACTORY_ADDRESS=$FACTORY_ADDRESS/" .env
  fi
else
  if [[ ! $FACTORY_ADDRESS =~ ^0x[0-9a-fA-F]{40}$ ]]; then
    echo "❌ FACTORY_ADDRESS '$FACTORY_ADDRESS' is not a valid 42-char hex address" >&2
    exit 1
  fi
  echo "🏭 Using existing factory at $FACTORY_ADDRESS"
fi

# ---------------------------------------------------------------------
# 2) Deploy WattWitnessDataLogger via factory
# ---------------------------------------------------------------------

INSTALLATION_ID="${INSTALLATION_ID:-1}"
INSTALLATION_NAME="${INSTALLATION_NAME:-Demo Site}"
SHELLY_MAC="${SHELLY_MAC:-ABCDEF123456}"
PUBLIC_KEY="${PUBLIC_KEY:-deadbeef}"
CREATED_AT="${CREATED_AT:-$(date +%s)}"
IS_ACTIVE="${IS_ACTIVE:-true}"

echo "🚀 Deploying WattWitnessDataLogger via factory..."

TX_HASH=$(cast send "$FACTORY_ADDRESS" \
  "createLogger(uint32,string,string,string,uint256,bool)" \
  "$INSTALLATION_ID" "$INSTALLATION_NAME" "$SHELLY_MAC" "$PUBLIC_KEY" "$CREATED_AT" "$IS_ACTIVE" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --rpc-url "$AVALANCHE_FUJI_RPC")

echo "⏳ Waiting for transaction $TX_HASH to be mined..."
cast receipt "$TX_HASH" --rpc-url "$AVALANCHE_FUJI_RPC" -n 1 >/dev/null 2>&1 || true

LOGGER_ADDRESS=$(cast call "$FACTORY_ADDRESS" "loggers(uint32)(address)" "$INSTALLATION_ID" --rpc-url "$AVALANCHE_FUJI_RPC")

if [ -z "$LOGGER_ADDRESS" ] || [ "$LOGGER_ADDRESS" == "0x0000000000000000000000000000000000000000" ]; then
  echo "❌ Logger deployment failed or not found in factory mapping." >&2
  exit 1
fi

echo "🎉 Logger deployed!"
echo "==================="
echo "✅ DataLogger Address: $LOGGER_ADDRESS"
echo "🔗 Snowtrace: https://testnet.snowtrace.io/address/$LOGGER_ADDRESS#code"

# Save to .env
if ! grep -q "WATTWITNESS_CONTRACT_ADDRESS" .env; then
    echo "WATTWITNESS_CONTRACT_ADDRESS=$LOGGER_ADDRESS" >> .env
else
    sed -i.bak "s/WATTWITNESS_CONTRACT_ADDRESS=.*/WATTWITNESS_CONTRACT_ADDRESS=$LOGGER_ADDRESS/" .env
fi

echo ""
echo "📋 Remember to add the logger as a consumer to your Chainlink Functions subscription ($CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID)."
echo ""
# ---------------------------------------------------------------------
# 3) Chainlink Functions setup guidance (unchanged below)
# ---------------------------------------------------------------------

echo ""
echo "🔗 CHAINLINK FUNCTIONS SETUP REQUIRED"
echo "====================================="
echo "Your contract is deployed but needs to be added to your Chainlink Functions subscription."
echo ""
echo "📋 STEP 1: Add Consumer to Subscription"
echo "1. Go to: https://functions.chain.link/avalanche-fuji/$CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID"
echo "2. Click 'Add consumer'"
echo "3. Enter contract address: $LOGGER_ADDRESS"
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
echo "2. Create new upkeep with contract address: $LOGGER_ADDRESS"
echo "3. Set interval (recommended: 300 seconds / 5 minutes)"
echo "4. Fund with LINK tokens"
echo ""
echo "📚 For detailed instructions, see: README.md"
echo ""
echo "⚠️  IMPORTANT: Complete STEP 1 before testing!"