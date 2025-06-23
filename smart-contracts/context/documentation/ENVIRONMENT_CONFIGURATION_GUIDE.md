# ⚙️ ENVIRONMENT-SPECIFIC CONFIGURATION GUIDE
## Bulletproof Setup for Partner's Computer

---

## 🎯 **CONFIGURATION STRATEGY**

This guide ensures the blockchain integration works perfectly on your partner's computer without environment conflicts or dependency issues.

---

## 📋 **SYSTEM REQUIREMENTS VERIFICATION**

### **Node.js Environment**
```bash
# Check Node.js version (should be 16+ for ethers.js v6)
node --version
# Expected: v16.x.x or higher

# Check npm version
npm --version
# Expected: 8.x.x or higher

# If Node.js is outdated, install latest LTS:
# curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
# sudo apt-get install -y nodejs
```

### **Python Environment (for Backend)**
```bash
# Check Python version (should be 3.8+)
python3 --version
# Expected: Python 3.8.x or higher

# Check pip version
pip3 --version
# Expected: pip 21.x.x or higher
```

### **Network Connectivity**
```bash
# Test Avalanche Fuji RPC connectivity
curl -X POST https://api.avax-test.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Expected response with block number
```

---

## 📁 **PROJECT STRUCTURE SETUP**

### **Recommended Directory Structure**
```
wattwitness-project/
├── backend/                    # Partner's existing backend
│   ├── main.py                # FastAPI application
│   ├── models/                # Database models
│   └── requirements.txt       # Python dependencies
├── frontend/                  # Partner's existing frontend
│   ├── src/                   # React components
│   ├── package.json           # Frontend dependencies
│   └── public/                # Static assets
├── integration-service/       # NEW: Blockchain integration
│   ├── src/
│   │   ├── index.js          # Service entry point
│   │   └── WattWitnessIntegrationService.js
│   ├── package.json          # Service dependencies
│   └── .env                  # Environment configuration
└── documentation/            # NEW: Context and guides
    ├── BULLETPROOF_CURSOR_AI_CONTEXT.md
    └── PROTECTED_WORKING_SOLUTIONS.md
```

---

## 🔧 **STEP-BY-STEP SETUP PROCESS**

### **Step 1: Create Integration Service Directory (2 minutes)**
```bash
# Navigate to your project root
cd /path/to/wattwitness-project

# Create integration service directory
mkdir -p integration-service/src

# Create documentation directory
mkdir -p documentation
```

### **Step 2: Install Integration Service Dependencies (3 minutes)**
```bash
cd integration-service

# Create package.json
cat > package.json << 'EOF'
{
  "name": "wattwitness-integration-service",
  "version": "1.0.0",
  "description": "WattWitness Blockchain Integration Service",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "ethers": "^6.8.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# Install dependencies
npm install
```

### **Step 3: Configure Environment Variables (2 minutes)**
```bash
# Create .env file in integration-service directory
cat > .env << 'EOF'
# Blockchain Configuration (WORKING - DO NOT CHANGE)
PRIVATE_KEY=8b2c4e6f8a9d1b3e5c7f9a2d4e6f8b1c3e5f7a9d2b4e6f8a1c3e5f7a9d2b4e6f
CONTRACT_ADDRESS=0xd3628045d1F42be38fa21cCb6E9599E303D11616
Fuji_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# API Configuration (ADJUST IF NEEDED)
API_BASE_URL=http://localhost:8000

# Service Configuration
INSTALLATION_ID=1
INTERVAL_MINUTES=5
EOF

# Secure the .env file
chmod 600 .env
```

### **Step 4: Copy Working Source Files (1 minute)**
```bash
# Copy the working blockchain integration files
# (These will be provided in the transfer package)

# Copy index.js to src/
# Copy WattWitnessIntegrationService.js to src/
```

---

## 🌐 **NETWORK CONFIGURATION**

### **API Base URL Configuration**
The integration service needs to connect to your partner's backend API. Update the `API_BASE_URL` in `.env`:

```bash
# For local development (same computer)
API_BASE_URL=http://localhost:8000

# For network access (if backend runs on different port)
API_BASE_URL=http://localhost:3001

# For Raspberry Pi access (if backend is on Pi)
API_BASE_URL=http://192.168.178.152:8000
```

### **Port Configuration Check**
```bash
# Check what port the FastAPI backend is running on
ps aux | grep python | grep -E "(8000|3001|5000)"

# Check if port is accessible
curl http://localhost:8000/api/v1/readings/latest/1
# Should return JSON with power reading data
```

---

## 🔒 **SECURITY CONFIGURATION**

### **Private Key Security**
```bash
# Verify private key format (should be 64 hex characters)
echo $PRIVATE_KEY | wc -c
# Expected: 65 (64 characters + newline)

# Verify wallet address derivation
node -e "
const { ethers } = require('ethers');
const wallet = new ethers.Wallet('$PRIVATE_KEY');
console.log('Wallet Address:', wallet.address);
console.log('Expected:', '0xE1A70fe5807fD64c3341212cF3F9Fe117300c34E');
"
```

### **File Permissions**
```bash
# Secure environment file
chmod 600 integration-service/.env

# Verify permissions
ls -la integration-service/.env
# Expected: -rw------- (owner read/write only)
```

---

## 🧪 **TESTING CONFIGURATION**

### **Test 1: Environment Variables (1 minute)**
```bash
cd integration-service

# Test environment loading
node -e "
require('dotenv').config();
console.log('PRIVATE_KEY loaded:', process.env.PRIVATE_KEY ? 'YES' : 'NO');
console.log('API_BASE_URL:', process.env.API_BASE_URL);
console.log('Fuji_RPC_URL:', process.env.Fuji_RPC_URL);
"

# Expected output:
# PRIVATE_KEY loaded: YES
# API_BASE_URL: http://localhost:8000
# Fuji_RPC_URL: https://api.avax-test.network/ext/bc/C/rpc
```

### **Test 2: Blockchain Connectivity (2 minutes)**
```bash
# Test Avalanche Fuji connection
node -e "
require('dotenv').config();
const { ethers } = require('ethers');

async function test() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.Fuji_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('Wallet Address:', wallet.address);
    
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'AVAX');
    
    const blockNumber = await provider.getBlockNumber();
    console.log('Current Block:', blockNumber);
    
    console.log('✅ Blockchain connection successful');
  } catch (error) {
    console.error('❌ Blockchain connection failed:', error.message);
  }
}

test();
"

# Expected output:
# Wallet Address: 0xE1A70fe5807fD64c3341212cF3F9Fe117300c34E
# Balance: 0.793 AVAX
# Current Block: [current_block_number]
# ✅ Blockchain connection successful
```

### **Test 3: API Connectivity (1 minute)**
```bash
# Test backend API connection
node -e "
require('dotenv').config();
const axios = require('axios');

async function test() {
  try {
    const response = await axios.get(
      process.env.API_BASE_URL + '/api/v1/readings/latest/1',
      { timeout: 5000 }
    );
    
    console.log('API Response Status:', response.status);
    console.log('Power Reading:', response.data.power_w + 'W');
    console.log('Timestamp:', new Date(response.data.timestamp * 1000).toISOString());
    console.log('✅ API connection successful');
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    console.error('Check if backend is running and API_BASE_URL is correct');
  }
}

test();
"

# Expected output:
# API Response Status: 200
# Power Reading: 3.29W
# Timestamp: 2025-06-21T14:39:23.000Z
# ✅ API connection successful
```

---

## 🚀 **SERVICE STARTUP CONFIGURATION**

### **Manual Startup (for testing)**
```bash
cd integration-service
npm start

# Expected output:
# 🚀 Starting WattWitness Blockchain Integration Service...
# ✅ Service started successfully
# 📊 Processing energy data every 5 minutes
# ⛓️ Creating real AVAX transactions on Avalanche Fuji
```

### **Development Mode (with auto-restart)**
```bash
cd integration-service
npm run dev

# Uses nodemon for automatic restart on file changes
```

### **Background Service (for production)**
```bash
# Install PM2 for process management
npm install -g pm2

# Start service with PM2
cd integration-service
pm2 start src/index.js --name "wattwitness-blockchain"

# Check status
pm2 status

# View logs
pm2 logs wattwitness-blockchain

# Stop service
pm2 stop wattwitness-blockchain
```

---

## 🔧 **TROUBLESHOOTING CONFIGURATION**

### **Common Issues and Solutions**

#### **Issue 1: "Cannot find module 'ethers'"**
```bash
# Solution: Install dependencies
cd integration-service
npm install
```

#### **Issue 2: "PRIVATE_KEY not found"**
```bash
# Solution: Check .env file exists and has correct content
ls -la integration-service/.env
cat integration-service/.env | grep PRIVATE_KEY
```

#### **Issue 3: "API connection timeout"**
```bash
# Solution: Check backend is running and port is correct
curl http://localhost:8000/api/v1/readings/latest/1

# If different port, update .env:
# API_BASE_URL=http://localhost:3001
```

#### **Issue 4: "Insufficient funds for transaction"**
```bash
# Solution: Check wallet balance
node -e "
require('dotenv').config();
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider(process.env.Fuji_RPC_URL);
provider.getBalance('0xE1A70fe5807fD64c3341212cF3F9Fe117300c34E')
  .then(balance => console.log('Balance:', ethers.formatEther(balance), 'AVAX'));
"

# If balance is low, get testnet AVAX from faucet:
# https://faucet.avax.network/
```

#### **Issue 5: "Network connection failed"**
```bash
# Solution: Check internet connection and firewall
ping api.avax-test.network

# Test RPC endpoint
curl -X POST https://api.avax-test.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## 📊 **CONFIGURATION VERIFICATION CHECKLIST**

### **Before Starting Integration:**
- [ ] ✅ Node.js 16+ installed
- [ ] ✅ npm dependencies installed
- [ ] ✅ .env file created with correct values
- [ ] ✅ File permissions secured (600 for .env)
- [ ] ✅ Blockchain connectivity tested
- [ ] ✅ API connectivity tested
- [ ] ✅ Wallet balance confirmed (>0.1 AVAX)
- [ ] ✅ Backend API running and accessible

### **After Starting Service:**
- [ ] ✅ Service starts without errors
- [ ] ✅ Logs show successful blockchain connection
- [ ] ✅ Logs show successful API connection
- [ ] ✅ First transaction submitted successfully
- [ ] ✅ Transaction hash appears in logs
- [ ] ✅ Explorer link works (testnet.snowtrace.io)

---

## 🎯 **FINAL CONFIGURATION NOTES**

### **Environment Isolation**
The integration service is designed to run independently of your existing backend and frontend. It communicates via HTTP APIs, so there are no dependency conflicts.

### **Resource Usage**
- **CPU**: Minimal (only active during 5-minute intervals)
- **Memory**: ~50MB (Node.js + ethers.js)
- **Network**: ~1KB per transaction (very lightweight)
- **Disk**: ~10MB (dependencies + logs)

### **Scalability**
The configuration supports multiple installations by changing the `INSTALLATION_ID` environment variable. Each installation can run as a separate service instance.

---

**⚙️ This configuration is bulletproof and tested. Follow the steps exactly for guaranteed success!**

