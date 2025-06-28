#!/bin/bash

# Deploy and Verify Script for WattWitness Chainlink Functions Contracts
# Usage: ./deploy-and-verify.sh <script_name> <contract_name>
# Special: ./deploy-and-verify.sh solarpark-auto (for auto-encoding deployment)
# Example: ./deploy-and-verify.sh DeployGettingStarted GettingStartedFunctionsConsumer

set -e

# Special case for auto-encoding deployment
if [ "$1" == "solarpark-auto" ]; then
    echo "🚀 Starting WattWitness Solarpark Auto-Deployment..."
    echo "📋 This will automatically encode CBOR and deploy with current configuration"
    echo ""
    
    # Check if Node.js deployment script exists
    if [ ! -f "deploySolarpark.js" ]; then
        echo "❌ Error: deploySolarpark.js not found"
        echo "Please ensure the Node.js deployment script is present"
        exit 1
    fi
    
    # Execute Node.js auto-deployment
    node deploySolarpark.js
    exit $?
fi

# Special case for automated solarpark auto-encoding deployment
if [ "$1" == "automated-solarpark-auto" ]; then
    echo "🤖 Starting WattWitness AutomatedSolarpark Auto-Deployment..."
    echo "📋 This will automatically encode CBOR and deploy with Chainlink Automation support"
    echo ""
    
    # Check if Node.js deployment script exists
    if [ ! -f "deployAutomatedSolarpark.js" ]; then
        echo "❌ Error: deployAutomatedSolarpark.js not found"
        echo "Please ensure the Node.js automated deployment script is present"
        exit 1
    fi
    
    # Execute Node.js auto-deployment for automation
    node deployAutomatedSolarpark.js
    exit $?
fi

if [ $# -lt 2 ]; then
    echo "Usage: $0 <script_name> <contract_name>"
    echo "Available scripts:"
    echo "  - DeployGettingStarted GettingStartedFunctionsConsumer"
    echo "  - DeployFunctionsConsumerExample FunctionsConsumerExample"
    echo "  - DeployAutomatedFunctionsConsumerExample AutomatedFunctionsConsumerExample"
    echo "  - DeployAutomatedSolarpark AutomatedSolarpark"
    echo "  - solarpark-auto (WattWitness auto-encoding deployment)"
    echo "  - automated-solarpark-auto (WattWitness automated auto-encoding deployment)"
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
