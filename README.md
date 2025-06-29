# WattWitness

A Trustless Tamperproof Electricity Production Meter system for solar park tokenization. Ensures verifiable and immutable power production data through secure hardware measurements and integration of blockchain technology with Chainlink.

## 🎯 Key Features

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
WattWitnessDataLogger: 0x7189D2b09691a8867056a228fb3e227e12E5B105

## 📡 API Access

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

## 🏗️ System Architecture

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

## 🔐 Security Features

- Hardware-level cryptographic signing with ATECC608A
- API authentication and validation
- Blockchain immutability for data integrity (future)
- Secure key storage and management
- Data verification at multiple levels

## 🚀 Getting Started

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
1. Setup /smart-contracts/.env
2. Deploy and verify the contracts with `deploy-wattwitness.sh`
3. Add the deployed contract as a consumer of a Chainlink Functions subscription
4. Setup the contract to fire every 5 minutes with Chainlink Automation

## 📊 Data Flow

1. **Measurement:** Secure hardware measures power data and cryptographically signs it
2. **Verification:** Raspberry Pi receives signed data and verifies hardware signature
3. **Storage:** Data is stored in PostgreSQL with verification status
4. **Dashboard:** Real-time power readings and historical data visualization
5. **Blockchain:** Verified data is submitted to blockchain via Chainlink Functions

## 🎨 Dashboard Features

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