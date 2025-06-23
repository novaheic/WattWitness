# CURSOR AI QUICK SETUP GUIDE

## 🚀 **IMMEDIATE SETUP INSTRUCTIONS**

### **1. ENVIRONMENT SETUP (5 minutes)**
```bash
# Install blockchain integration dependencies
cd integration-service
npm install ethers winston axios dotenv

# Verify environment variables
cat .env
# Should contain:
# PRIVATE_KEY=3f96bed71058b6a4bf28085e1531cf1f19aa78adc0acefc204fbe7810c697d3c
# CONTRACT_ADDRESS=0xd3628045d1F42be38fa21cCb6E9599E303D11616
# RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

### **2. TEST BLOCKCHAIN CLIENT (2 minutes)**
```bash
# Test the working blockchain integration
cd integration-service
node src/index.js

# Expected output:
# ✅ Latest reading: 3.29W at 2025-06-21T...
# ⚡ DIRECT BYPASS: Creating real blockchain transaction...
# ✅ SUCCESS! Transaction confirmed: 0x[hash]
```

### **3. ADD BACKEND ENDPOINT (10 minutes)**
Add this to your FastAPI main file:

```python
@app.post("/api/blockchain/update")
async def receive_blockchain_data(blockchain_data: dict, db: Session = Depends(get_db)):
    try:
        tx_hash = blockchain_data.get('tx_hash')
        timestamp = blockchain_data.get('timestamp')
        installation_id = blockchain_data.get('installation_id', 1)
        
        reading = db.query(PowerReading).filter(
            PowerReading.timestamp == timestamp,
            PowerReading.installation_id == installation_id,
            PowerReading.is_on_chain == False
        ).first()
        
        if reading:
            reading.is_on_chain = True
            reading.blockchain_tx_hash = tx_hash
            db.commit()
            return {"success": True, "tx_hash": tx_hash}
        
        return {"success": False, "error": "Reading not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

### **4. UPDATE DATABASE SCHEMA (5 minutes)**
```sql
-- Add these columns to your PowerReading table
ALTER TABLE power_readings ADD COLUMN is_on_chain BOOLEAN DEFAULT FALSE;
ALTER TABLE power_readings ADD COLUMN blockchain_tx_hash VARCHAR(66);
ALTER TABLE power_readings ADD COLUMN blockchain_block_number INTEGER;
```

### **5. TEST INTEGRATION (5 minutes)**
```bash
# Test the new endpoint
curl -X POST http://localhost:8000/api/blockchain/update \
  -H "Content-Type: application/json" \
  -d '{"tx_hash": "test123", "timestamp": 1750522800, "installation_id": 1}'

# Should return: {"success": true, "tx_hash": "test123"}
```

### **6. CONNECT BLOCKCHAIN TO BACKEND (10 minutes)**
Modify `integration-service/src/smart-contract-client-fixed.js`:

Add this method:
```javascript
async updateBackendDatabase(txHash, timestamp, blockNumber) {
    try {
        const response = await axios.post(
            'http://localhost:8000/api/blockchain/update',
            {
                tx_hash: txHash,
                timestamp: timestamp,
                installation_id: this.installationId,
                block_number: blockNumber
            }
        );
        
        if (response.data.success) {
            this.logger.info(`✅ Backend updated with TX: ${txHash}`);
        }
    } catch (error) {
        this.logger.error(`❌ Failed to update backend: ${error.message}`);
    }
}
```

Call it after successful transactions:
```javascript
// After: const txHash = await this.submitEnergyDataDirect(...)
await this.updateBackendDatabase(txHash, timestamp, receipt.blockNumber);
```

### **7. UPDATE FRONTEND (15 minutes)**
Add blockchain status to your React dashboard:

```jsx
// Add state
const [blockchainStatus, setBlockchainStatus] = useState({});

// Add effect
useEffect(() => {
    const fetchBlockchainStatus = async () => {
        const response = await fetch('/api/v1/readings/latest/1');
        const data = await response.json();
        setBlockchainStatus({
            isOnChain: data.is_on_chain,
            txHash: data.blockchain_tx_hash
        });
    };
    
    fetchBlockchainStatus();
    const interval = setInterval(fetchBlockchainStatus, 30000);
    return () => clearInterval(interval);
}, []);

// Add to JSX
<div className="blockchain-status">
    <h3>Blockchain Status</h3>
    {blockchainStatus.isOnChain ? (
        <div className="on-chain">
            ✅ On Blockchain
            <a href={`https://testnet.snowtrace.io/tx/${blockchainStatus.txHash}`} 
               target="_blank" rel="noopener noreferrer">
                View Transaction
            </a>
        </div>
    ) : (
        <div className="pending">⏳ Pending Blockchain Sync</div>
    )}
</div>
```

### **8. FINAL TEST (5 minutes)**
```bash
# Start all services
python3 backend/main.py &
npm run start:frontend &
node integration-service/src/index.js &

# Check dashboard at http://localhost:3000
# Should show blockchain status and transaction links
```

## ✅ **SUCCESS CRITERIA**

After completing these steps:
- ✅ Blockchain client creates real AVAX transactions every 5 minutes
- ✅ Backend database gets updated with transaction hashes
- ✅ Frontend dashboard shows "✅ On Blockchain" status
- ✅ Transaction links work and show real transactions on Avalanche explorer
- ✅ Complete end-to-end IoT-to-blockchain integration working

## 🎯 **TOTAL TIME: 60 MINUTES**

**Result: Production-ready WattWitness system with real blockchain integration!**

