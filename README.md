# WattWitness

A Trustless Tamperproof Electricity Production Meter system for solar park tokenization. Ensures verifiable and immutable power production data through secure hardware measurements and integration of blockchain technology with Chainlink.

When a new installation is set up, the WattWitnessDataLoggerFactory deploys a WattWitnessDataLogger contract, which stores all installation readings on-chain. During deployment, installation details are written to the contract’s state.

The WattWitness system uses Chainlink Automation to regularly trigger Chainlink Functions, which call our API to fetch 20 of the oldest pending readings not yet stored on-chain. The Chainlink Function then invokes the fulfillRequest fallback on the WattWitnessDataLogger, updating its Merkle Tree and emitting an event per reading.

Due to Chainlink Functions Server Limits (256-byte return size and 300,000 gas callback limit), we cannot store all reading data directly as state variables. Instead, readings are compacted into a Merkle Tree with key data, and events are emitted for easy access by applications and front ends.

A backend service listens for the BatchProcessed event from the WattWitnessDataLogger. When triggered, it marks the relevant readings as is_on_chain = true and records the transaction hash and block number.

## Key Features

### **Real-Time Dashboard**
- **Live Power Output:** Current power production with real-time updates
- **Energy Charts:** Interactive charts showing production over Hour, Day, Week, Month, Year
- **System Status:** Live monitoring of internet connectivity and ESP32 status
- **Latest Records:** Recent power readings with timestamps
- **General Info:** Device information and uptime tracking

### **Data Management**
- **Automatic Aggregation:** Smart data grouping for different time frames
- **Energy Calculations:** Accurate power-based energy production calculations
- **Lifetime Tracking:** Production tracking since system initialization
- **Local Time Support:** Proper timezone handling for global deployments

### **System Monitoring**
- **Internet Connectivity:** Real-time internet status with robust error handling
- **ESP32 Liveliness:** Automatic detection of ESP32 connection status
- **Overall System Health:** Combined status indicators for system health

### **Chainlink Integration**
- **Chainlink Automation:** Automatic and reoccuring calling of our function to process readings
- **Chainlink Functions:** Calls our API for readings and stores them on chain

## Deployed Contracts

### Avalanche Fuji Testnet
- Chainlink Functions Testnet Subscription: https://functions.chain.link/fuji/15652

- WattWitnessDataLoggerFactory: https://testnet.snowtrace.io/address/0xfF2dFA11605974C415992707BfD1D674f21C5edD
- WattWitnessDataLogger: https://testnet.snowtrace.io/address/0xB3ee80a2B09727545939a059b24611Ee0dA32938
- Chainlink Automation: https://automation.chain.link/fuji/0xed31c8b16e3707510451e312fc742491f0311f0faa5078f35923cb0c798e9e5c 

- Deployment from earlier pre-factory deployment commit (contains same core logic): 
- WattWitnessDataLogger: https://testnet.snowtrace.io/address/0x7189D2b09691a8867056a228fb3e227e12E5B105 
- Chainlink Automation: https://automation.chain.link/fuji/24931883708556152898690156269086035823652004846924398997064749746579524676622

## API Access

**Backend URL:** `http://localhost:8000` (development) / `https://wattwitness-api.loca.lt/` (production)  
**WattWitnessAPI Documentation:** `https://wattwitness-api.loca.lt/docs`

### Available Endpoints

#### Installations (Setup)
- `POST /api/v1/installations/` - Creates/updates installation
- `GET /api/v1/installations/` - Get all installations

#### Power Readings
- `POST /api/v1/readings/` - Stores power readings
- `POST /api/v1/readings/mark-on-chain/` - Updates a reading's info to be marked as stored on chain
- `GET /api/v1/readings/{installation_id}` - Get readings for installation
- `GET /api/v1/readings/latest/{installation_id}` - Get latest reading
- `GET /api/v1/readings/{installation_id}/chart` - Get chart data for time frames
- `GET /api/v1/readings/pending` - Get all pending readings that have not been stored on chain

#### System Status
- `GET /health` - System health check

### Data Structure

#### Installation
```json
{
  "id": 1,
  "name": "Hackathon Test 1",
  "shelly_mac": "EC64C9C05E97",
  "public_key": "fca0c973d117630908020a530be5d137bc9e11baccf9a3d4f666cf3b56a4edaf07056e97405e803418011c7e62f255a4fb053cdd75d4abbad41b013b37d8d8c4",
  "created_at": "2025-06-19T16:52:26.093539",
  "is_active": true
}
```

#### Power Reading
```json
{
  "id": 1,
  "installation_id": 1,
  "power_w": 16.6,
  "total_wh": 21700.0,
  "timestamp": 1750352712,
  "signature": "2F2B15C626527E957F49D2D7663A91ECCC7B8220C401598515282EA9EC6FA61000000000000000005C20FB04000000000000000000000000D020FB0000000000",
  "is_verified": true,
  "created_at": "2025-06-19T16:52:26.093539"
}
```

#### Chart Data
```json
{
  "data_points": [
    {
      "label": "14:00",
      "value": 250.5,
      "timestamp": 1750352400
    }
  ],
  "time_frame": "hour",
  "total_energy": 1250.25
}
```

## System Architecture

### Hardware Components
- **Secure Measurement Hardware (ESP32)**
  - Measures power data (voltage, current, temperature)
  - Cryptographically signs measurements using ATECC608A
  - Sends verified data to Raspberry Pi every 10 seconds

- **Raspberry Pi**
  - Receives verified data from secure hardware
  - Runs monitoring dashboard and API
  - Communicates with blockchain (future)

### Software Components

#### Directory Structure
```
wattwitness/
├── ESPfirmware/           # ESP32 code
│   └── ESP32_Sig          # ESP32 signature code
├── RaspberryPi/           # Dashboard and API
│   ├── backend/           # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/       # API endpoints
│   │   │   ├── db/        # Database models
│   │   │   └── core/      # Core functionality
│   │   └── main.py        # Application entry
│   ├── frontend/          # Dashboard (React + TypeScript)
│   │   ├── src/
│   │   │   ├── components/ # Dashboard components
│   │   │   ├── hooks/      # React Query hooks
│   │   │   └── services/   # API integration
│   │   └── public/
│   └─── listener/          # Program that listens for onchain processing
└── smart-contracts/          # Blockchain integration
    ├── chainlink-functions / # Chainlink Functions
    ├── src/                  # Solidity contracts
    └── script/               # Deployment & Testing scripts
```

## Security Features

- Hardware-level cryptographic signing with ATECC608A
- API authentication and validation
- Blockchain immutability for data integrity (future)
- Secure key storage and management
- Data verification at multiple levels

## Environment Files

This repository uses several separate `.env` files – make sure you are editing the right one for each component.

| Path | Purpose | Key variables |
| ---- | ------- | ------------- |
| `smart-contracts/.env` | Deploying & configuring on-chain contracts | `DEPLOYER_PRIVATE_KEY`, `CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID`, `AVALANCHE_FUJI_RPC`, … |
| `RaspberryPi/backend/.env` | FastAPI backend configuration | `DATABASE_URL`, `CHAIN_RPC_URL`, any email / auth secrets… |
| `RaspberryPi/listener/.env` | Raspberry Pi listener that watches `BatchProcessed` events | `RPC_URL`, `CONTRACT_ADDRESS`, `API_BASE_URL`, `REQUEST_TIMEOUT` |

Whenever the docs mention "the `.env` file", refer to this table and update the correct one.

## Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL
- Node.js 16+
- ESP32 with ATECC608A
- ShellyEM power meter

### Backend Setup
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Configure database in `app/core/config.py`
4. Run: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

### Frontend Setup
1. Navigate to `RaspberryPi/frontend/`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Access dashboard at `http://localhost:5173`

### ESP32 Setup
1. Update WiFi credentials in `ESPfirmware/ESP32_Sig`
2. Update backend IP address
3. Flash to ESP32 using Arduino IDE
4. Monitor serial output for connection status

### Production Deployment
1. Set up Raspberry Pi with Raspberry Pi OS
2. Install PostgreSQL and Python dependencies
3. Configure database and backend
4. Build frontend: `npm run build`
5. Serve with nginx or static server
6. Flash ESP32 and power independently

### Smart Contract Deployment
See SMART_CONTRACTS_README.md for further info.

## Prerequisites

Before you begin, ensure you have:

1. **Foundry** installed: https://book.getfoundry.sh/getting-started/installation
2. **Node.js** (v16+) and **npm** for some utilities
3. **Avalanche Fuji testnet AVAX** for gas fees
4. **Chainlink Functions subscription** with LINK tokens
5. **Private key** for deployment (never share this!)

## Quick Start

### Step 1: Environment Setup

1. Clone the repository and navigate to smart contracts:
```bash
cd smart-contracts
```

2. Create a `.env` file with your configuration at /smart-contracts/.env. Use `.env.example` as a template.
```bash
# Required variables
DEPLOYER_PRIVATE_KEY=0x1234567890abcdef...  # Your private key (never share!)
CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID=123     # Your Chainlink Functions subscription ID

# Optional (defaults provided)
AVALANCHE_FUJI_RPC=https://avalanche-fuji-c-chain-rpc.publicnode.com
```

### Step 2: Deploy the Contract

Run the deployment script:
```bash
./script/deploy-wattwitness.sh
```

This script will:
- ✅ Validate your environment setup
- ✅ Deploy WattWitnessDataLogger contract
- ✅ Verify the contract on Snowtrace
- ✅ Save the contract address to your `.env` file
- ✅ Provide next steps for Chainlink setup

### Step 3: Chainlink Functions Setup

After deployment, you need to add your contract as a consumer to your Chainlink Functions subscription:

1. **Add Consumer**: Go to https://functions.chain.link/avalanche-fuji/[YOUR_SUBSCRIPTION_ID]
2. Click "Add consumer"
3. Enter your deployed contract address
4. Confirm the transaction

### Step 4: Chainlink Automation

For automatic data fetching, set up Chainlink Automation:

1. Go to https://automation.chain.link/avalanche-fuji
2. Click "Register new upkeep"
3. Choose "Custom logic" upkeep
4. Enter your contract address
5. Set upkeep name: "WattWitness Data Fetcher"
6. Set gas limit: 2,000,000
7. Set starting balance: 5 LINK
8. Set interval: 300 seconds (5 minutes)
9. Complete registration and fund the upkeep

## Data Flow

1. **Measurement:** Secure hardware measures power data and cryptographically signs it
2. **Verification:** Raspberry Pi receives signed data and verifies hardware signature
3. **Storage:** Data is stored in PostgreSQL with verification status
4. **Dashboard:** Real-time power readings and historical data visualization
5. **Blockchain:** Verified data is submitted to blockchain via Chainlink Functions

## Dashboard Features

### Real-Time Monitoring
- **Power Output:** Live current power production
- **Energy Charts:** Interactive charts with Hour/Day/Week/Month/Year views
- **System Status:** Internet connectivity and ESP32 liveliness
- **Latest Records:** Recent readings with timestamps
- **General Info:** Device information and uptime

### Data Visualization
- **Time Frame Selection:** Switch between different time periods
- **Energy Calculations:** Accurate production calculations
- **Local Time Support:** Proper timezone handling
- **Responsive Design:** Works on desktop and mobile