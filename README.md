# WattWitness

A Trustless Tamperproof Electricity Production Meter system for solar park tokenization. Ensures verifiable and immutable power production data through secure hardware measurements and blockchain integration.

## 🚀 Current Status

**✅ FULLY FUNCTIONAL SYSTEM - Complete ESP32 to Dashboard Integration**

The system is currently operational with:
- ESP32 collecting and signing power data from ShellyEM every 10 seconds
- FastAPI backend storing verified readings in PostgreSQL
- Real-time React dashboard with live monitoring
- System status monitoring (internet connectivity, ESP32 liveliness)
- Energy production charts with multiple time frames
- Automatic data aggregation and visualization

## 🎯 Key Features

### ✅ **Real-Time Dashboard**
- **Live Power Output:** Current power production with real-time updates
- **Energy Charts:** Interactive charts showing production over Hour, Day, Week, Month, Year
- **System Status:** Live monitoring of internet connectivity and ESP32 status
- **Latest Records:** Recent power readings with timestamps
- **General Info:** Device information and uptime tracking

### ✅ **Data Management**
- **Automatic Aggregation:** Smart data grouping for different time frames
- **Energy Calculations:** Accurate power-based energy production calculations
- **Lifetime Tracking:** Production tracking since system initialization
- **Local Time Support:** Proper timezone handling for global deployments

### ✅ **System Monitoring**
- **Internet Connectivity:** Real-time internet status with robust error handling
- **ESP32 Liveliness:** Automatic detection of ESP32 connection status
- **Overall System Health:** Combined status indicators for system health

## 📡 API Access

**Backend URL:** `http://localhost:8000` (development) / `http://<pi-ip>:8000` (production)  
**API Documentation:** `http://localhost:8000/docs`

### Available Endpoints

#### Installations (Setup)
- `POST /api/v1/installations/` - Creates/updates installation
- `GET /api/v1/installations/` - Get all installations

#### Power Readings
- `POST /api/v1/readings/` - Stores power readings
- `GET /api/v1/readings/{installation_id}` - Get readings for installation
- `GET /api/v1/readings/latest/{installation_id}` - Get latest reading
- `GET /api/v1/readings/{installation_id}/chart` - Get chart data for time frames

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

## 🔗 Integration Guide for Teammates

### For Chainlink Integration

**What you need to do:**
1. **Read from API:** Fetch unprocessed readings (those without `blockchain_tx_hash`)
2. **Verify signatures:** Use the public key to verify the cryptographic signatures
3. **Submit to blockchain:** Use Chainlink Functions to write verified data
4. **Update database:** Mark readings as `is_on_chain: true` with transaction hash

**Key fields for blockchain:**
- `power_w` (watts)
- `total_wh` (watt-hours)
- `timestamp` (Unix timestamp)
- `signature` (for verification)

### Testing the API

```bash
# Get latest reading
curl http://localhost:8000/api/v1/readings/latest/1

# Get chart data for week view
curl http://localhost:8000/api/v1/readings/1/chart?time_frame=week

# Get all readings
curl http://localhost:8000/api/v1/readings/1
```

### Current System Status
- ✅ ESP32 sending data every 10 seconds
- ✅ Backend storing readings in PostgreSQL
- ✅ Real-time dashboard with live updates
- ✅ System monitoring and status indicators
- ✅ Energy charts with multiple time frames
- 🔄 **Next:** Chainlink Functions integration

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
│   └── frontend/          # Dashboard (React + TypeScript)
│       ├── src/
│       │   ├── components/ # Dashboard components
│       │   ├── hooks/      # React Query hooks
│       │   └── services/   # API integration
│       └── public/
├── smart-contracts/   # Blockchain integration (future)
│   ├── contracts/     # Solidity contracts
│   └── scripts/       # Deployment scripts
├── docs/             # Documentation
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

## 📊 Data Flow

1. **Measurement:** Secure hardware measures power data and cryptographically signs it
2. **Verification:** Raspberry Pi receives signed data and verifies hardware signature
3. **Storage:** Data is stored in PostgreSQL with verification status
4. **Dashboard:** Real-time power readings and historical data visualization
5. **Blockchain:** Verified data is submitted to blockchain via Chainlink Functions (future)

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

## 🤝 Contributing

This project is part of a hackathon. For integration work:
- Use the API endpoints documented above
- Test with the provided curl commands
- Coordinate with the team for blockchain integration

## 📄 License

[Add your license information here] 