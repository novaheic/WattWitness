#!/bin/bash

# Deploy and Verify Script for WattWitness Chainlink Functions Contracts
# Usage: ./deploy-and-verify.sh <script_name> <contract_name>
# Example: ./deploy-and-verify.sh DeployGettingStarted GettingStartedFunctionsConsumer

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <script_name> <contract_name>"
    echo "Available scripts:"
    echo "  - DeployGettingStarted GettingStartedFunctionsConsumer"
    echo "  - DeployFunctionsConsumerExample FunctionsConsumerExample"
    echo "  - DeployAutomatedFunctionsConsumerExample AutomatedFunctionsConsumerExample"
    exit 1
fi

SCRIPT_NAME=$1
CONTRACT_NAME=$2

# Source environment variables
source .env

echo "🚀 Deploying $CONTRACT_NAME using $SCRIPT_NAME..."

# Deploy the contract
DEPLOY_OUTPUT=$(forge script script/${SCRIPT_NAME}.s.sol:${SCRIPT_NAME} --rpc-url fuji --broadcast --verify)

echo "$DEPLOY_OUTPUT"

# Extract contract address from deployment output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -E "Deployed contract address:|Contract Address:" | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)

if [ -n "$CONTRACT_ADDRESS" ]; then
    echo ""
    echo "✅ Deployment and Verification Complete!"
    echo "📍 Contract Address: $CONTRACT_ADDRESS"
    echo "🔗 View on Snowtrace: https://testnet.snowtrace.io/address/$CONTRACT_ADDRESS#code"
else
    echo "⚠️ Could not extract contract address from deployment output"
fi
