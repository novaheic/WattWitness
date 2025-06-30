# WattWitness Smart Contracts

WattWitness is a decentralized solar energy monitoring system that uses Chainlink Functions to fetch real-time solar power data and store it on-chain with merkle tree batch processing for unlimited scalability.

### Contract Configuration

The deployed contract is automatically configured with:
- **Gas Limit**: 300,000 (maximum for Chainlink Functions callback)
- **DON ID**: `fun-avalanche-fuji-1`
- **Batch Size**: 20 readings per batch (adjustable)
- **Response Format**: 160 bytes (merkle root + latest reading)

## Monitoring and Testing

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

## Architecture

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

## Development

### Building

```bash
forge build
```

### Testing

```bash
forge test
```

## Troubleshooting

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