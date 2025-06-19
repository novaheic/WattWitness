# WattWitness

A Trustless Tamperproof Electricity Production Meter system for solar park tokenization. Ensures verifiable and immutable power production data through secure hardware measurements and blockchain integration.

## 🚀 Current Status

**✅ WORKING SYSTEM - ESP32 to Backend Integration Complete**

The system is currently operational with:
- ESP32 collecting and signing power data from ShellyEM
- FastAPI backend storing verified readings in PostgreSQL
- Real-time data flow every 10 seconds

## 📡 API Access

**Backend URL:** `http://192.168.178.152:8000`  
**API Documentation:** `http://192.168.178.152:8000/docs`

### Available Endpoints

#### Installations (Setup)
- `POST /api/v1/installations/` - Creates/updates installation
- Payload: `{"name": "Hackathon Test 1", "public_key": "...", "shelly_payload": "base64_encoded_json"}`

#### Power Readings
- `POST /api/v1/readings/` - Stores power readings
- Payload: `{"power": 16.6, "total": 21700.0, "timestamp": 1750352712, "signature": "...", "shelly_payload": "base64_encoded_json"}`
- `GET /api/v1/readings/{installation_id}` - Get readings for installation
- `GET /api/v1/readings/latest/{installation_id}` - Get latest reading

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
curl http://192.168.178.152:8000/api/v1/readings/latest/1

# Get all readings
curl http://192.168.178.152:8000/api/v1/readings/1
```

### Current System Status
- ✅ ESP32 sending data every 10 seconds
- ✅ Backend storing readings in PostgreSQL
- ✅ Installation ID: 1, MAC: EC64C9C05E97
- 🔄 **Next:** Chainlink Functions integration

## 🏗️ System Architecture

### Hardware Components
- **Secure Measurement Hardware (ESP32)**
  - Measures power data (voltage, current, temperature)
  - Cryptographically signs measurements using ATECC608A
  - Sends verified data to Raspberry Pi

- **Raspberry Pi**
  - Receives verified data from secure hardware
  - Runs monitoring dashboard
  - Communicates with blockchain

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
│   └── frontend/          # Dashboard (React)
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   └── services/  # API integration
│       └── public/
├── smart-contracts/   # Blockchain integration
│   ├── contracts/     # Solidity contracts
│   └── scripts/       # Deployment scripts
├── docs/             # Documentation
```

## 🔐 Security Features

- Hardware-level cryptographic signing with ATECC608A
- API authentication and validation
- Blockchain immutability for data integrity
- Secure key storage and management
- Data verification at multiple levels

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL
- ESP32 with ATECC608A
- ShellyEM power meter

### Backend Setup
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Configure database in `app/core/config.py`
4. Run: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

### ESP32 Setup
1. Update WiFi credentials in `ESPfirmware/ESP32_Sig`
2. Update backend IP address
3. Flash to ESP32
4. Monitor serial output for connection status

## 📊 Data Flow

1. **Measurement:** Secure hardware measures power data and cryptographically signs it
2. **Verification:** Raspberry Pi receives signed data and verifies hardware signature
3. **Storage:** Data is stored in PostgreSQL with verification status
4. **Blockchain:** Verified data is submitted to blockchain via Chainlink Functions
5. **Dashboard:** Real-time power readings and historical data visualization

## 🤝 Contributing

This project is part of a hackathon. For integration work:
- Use the API endpoints documented above
- Test with the provided curl commands
- Coordinate with the team for blockchain integration

## 📄 License

[Add your license information here] 