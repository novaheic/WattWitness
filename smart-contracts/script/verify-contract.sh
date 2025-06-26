#!/bin/bash

# Contract Verification Script for Snowtrace
# Usage: ./script/verify-contract.sh <contract_address> <contract_name> [constructor_args]

set -e

# Check if required arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <contract_address> <contract_name> [constructor_args]"
    echo "Example: $0 0x1234... GettingStartedFunctionsConsumer"
    exit 1
fi

CONTRACT_ADDRESS=$1
CONTRACT_NAME=$2
CONSTRUCTOR_ARGS=${3:-""}

# Source environment variables
source .env

# Configuration
NETWORK="fuji"  # Change to "mainnet" for production
if [ "$NETWORK" = "fuji" ]; then
    API_URL="https://api-testnet.snowtrace.io/api"
else
    API_URL="https://api.snowtrace.io/api"
fi

# Get contract source file path
CONTRACT_FILE="src/${CONTRACT_NAME}.sol"

if [ ! -f "$CONTRACT_FILE" ]; then
    echo "Error: Contract file $CONTRACT_FILE not found"
    exit 1
fi

echo "🔍 Verifying contract: $CONTRACT_NAME"
echo "📍 Address: $CONTRACT_ADDRESS"
echo "🌐 Network: $NETWORK"

# Step 1: Flatten the contract
echo "📁 Flattening contract..."
FLATTENED_FILE="temp_${CONTRACT_NAME}_flattened.sol"
forge flatten "$CONTRACT_FILE" > "$FLATTENED_FILE"

# Step 2: Clean up flattened contract (remove duplicate SPDX licenses)
echo "🧹 Cleaning up flattened contract..."
# Keep only the first SPDX license identifier
sed -i.bak '2,${/^\/\/ SPDX-License-Identifier:/d;}' "$FLATTENED_FILE"

# Step 3: Get compiler version from foundry.toml
SOLC_VERSION=$(grep -A 5 '\[profile\.default\]' foundry.toml | grep 'solc_version' | cut -d'"' -f2)
if [ -z "$SOLC_VERSION" ]; then
    # Default to a common version if not specified
    SOLC_VERSION="0.8.19"
fi

# Format version for Snowtrace (needs v prefix)
COMPILER_VERSION="v${SOLC_VERSION}+commit.7dd6d404"

# Step 4: Check if optimization is enabled
OPTIMIZER_ENABLED=$(grep -A 5 '\[profile\.default\]' foundry.toml | grep 'optimizer' | grep 'true' || echo "")
if [ -n "$OPTIMIZER_ENABLED" ]; then
    OPTIMIZATION_USED="1"
    OPTIMIZER_RUNS=$(grep -A 5 '\[profile\.default\]' foundry.toml | grep 'optimizer_runs' | grep -o '[0-9]*' || echo "200")
else
    OPTIMIZATION_USED="0"
    OPTIMIZER_RUNS=""
fi

# Step 5: Prepare source code for API (escape quotes and newlines)
SOURCE_CODE=$(cat "$FLATTENED_FILE" | jq -Rs .)

# Step 6: Make API call to verify contract
echo "🚀 Submitting verification request..."

RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "module=contract" \
    -d "action=verifysourcecode" \
    -d "contractaddress=$CONTRACT_ADDRESS" \
    -d "sourceCode=$SOURCE_CODE" \
    -d "codeformat=solidity-single-file" \
    -d "contractname=$CONTRACT_NAME" \
    -d "compilerversion=$COMPILER_VERSION" \
    -d "optimizationUsed=$OPTIMIZATION_USED" \
    $([ -n "$OPTIMIZER_RUNS" ] && echo "-d runs=$OPTIMIZER_RUNS") \
    -d "licenseType=3" \
    -d "apikey=YourApiKeyToken" \
    $([ -n "$CONSTRUCTOR_ARGS" ] && echo "-d constructorArguments=$CONSTRUCTOR_ARGS"))

echo "📋 API Response:"
echo "$RESPONSE" | jq .

# Step 7: Parse response
STATUS=$(echo "$RESPONSE" | jq -r '.status')
MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
RESULT=$(echo "$RESPONSE" | jq -r '.result')

if [ "$STATUS" = "1" ]; then
    echo "✅ Verification submitted successfully!"
    echo "🔗 GUID: $RESULT"
    echo "⏳ Checking verification status..."
    
    # Wait and check status
    sleep 5
    STATUS_RESPONSE=$(curl -s "$API_URL?module=contract&action=checkverifystatus&guid=$RESULT")
    echo "📊 Status Response:"
    echo "$STATUS_RESPONSE" | jq .
    
    VERIFICATION_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.result')
    if [ "$VERIFICATION_STATUS" = "Pass - Verified" ]; then
        echo "🎉 Contract verified successfully!"
        if [ "$NETWORK" = "fuji" ]; then
            echo "🔗 View on Snowtrace: https://testnet.snowtrace.io/address/$CONTRACT_ADDRESS#code"
        else
            echo "🔗 View on Snowtrace: https://snowtrace.io/address/$CONTRACT_ADDRESS#code"
        fi
    else
        echo "⚠️ Verification status: $VERIFICATION_STATUS"
    fi
else
    echo "❌ Verification failed: $MESSAGE"
    echo "🔍 Result: $RESULT"
fi

# Clean up temporary files
rm -f "$FLATTENED_FILE" "${FLATTENED_FILE}.bak"

echo "🧹 Cleanup completed"
