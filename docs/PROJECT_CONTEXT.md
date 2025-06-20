# WattWitness Project Summary

## Project Overview
WattWitness is a Trustless Tamperproof Electricity Production Meter system for solar park tokenization. It ensures verifiable and immutable power production data through secure hardware measurements and blockchain integration.

## 🚀 Current Status

**✅ FULLY FUNCTIONAL SYSTEM - Complete ESP32 to Dashboard Integration**

The system is currently operational with:
- ESP32 collecting and signing power data from ShellyEM every 10 seconds
- FastAPI backend storing verified readings in PostgreSQL
- Real-time React dashboard with live monitoring
- System status monitoring (internet connectivity, ESP32 liveliness)
- Energy production charts with multiple time frames
- Automatic data aggregation and visualization

## 🎯 Key Features Implemented

### ✅ **Real-Time Dashboard**
- **Live Power Output:** Current power production with real-time updates every 10 seconds
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

## System Architecture

### 1. Hardware Components
- **Secure Measurement Hardware (ESP32)**
  - Measures power data (voltage, current, temperature)
  - Cryptographically signs measurements using ATECC608A
  - Sends verified data to Raspberry Pi every 10 seconds

#### ESP32 Data Output Example
The ESP32 outputs data in the following format for each measurement:

```
17:19:43.606 -> 📦 Shelly payload:
17:19:43.606 -> {"wifi_sta":{"connected":true,"ssid":"Ondemand","ip":"192.168.178.156","rssi":-67},"cloud":{"enabled":true,"connected":true},"mqtt":{"connected":false},"time":"17:19","unixtime":1750346382,"serial":3,"has_update":true,"mac":"EC64C9C05E97","cfg_changed_cnt":0,"actions_stats":{"skipped":0},"relays":[{"ison":false,"has_timer":false,"timer_started":0,"timer_duration":0,"timer_remaining":0,"overpower":false,"is_valid":true,"source":"input"}],"emeters":[{"power":16.35,"reactive":24.38,"voltage":237.13,"is_valid":true,"total":8.9,"total_returned":0.0},{"power":0.00,"reactive":0.00,"voltage":237.13,"is_valid":true,"total":0.0,"total_returned":0.0}],"update":{"status":"pending","has_update":true,"new_version":"20230913-114150/v1.14.0-gcb84623","old_version":"20210429-104036/v1.10.4-2-g9a159c1fb-release-1.10","beta_version":"20231107-164916/v1.14.1-rc1-g0617c15"},"ram_total":49600,"ram_free":34428,"fs_size":233681,"fs_free":157879,"ping_check":true,"uptime":325}
17:19:43.680 -> 📊 Data: ShellyEM power=16.4W total=8900.0Wh timestamp=1750346382
17:19:43.726 -> ✍️ Signature: E8E9BAF0FA7C8231F222C3FBC0B1EA31A11F3E1774F4B95840ED815B6201A503C10B0980F021FB3F01000000000000007D5B0000040000002850FC3F2C50FC3F
```

This includes:
- The raw JSON payload from the device
- Parsed data (e.g., power, total energy, timestamp)
- The cryptographic signature for verification

- **Raspberry Pi**
  - Receives verified data from secure hardware
  - Runs monitoring dashboard and API
  - Communicates with blockchain (future)

### 2. Software Components

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

### 3. Data Flow
1. **Measurement**
   - Secure hardware measures power data
   - Data is cryptographically signed
   - Timestamped at hardware level

2. **Verification**
   - Raspberry Pi receives signed data
   - Backend verifies hardware signature
   - Data is stored in PostgreSQL

3. **Dashboard Display**
   - Real-time power readings
   - Historical data visualization
   - System status monitoring

4. **Blockchain Integration** (future)
   - Verified data is submitted to blockchain
   - Smart contracts handle tokenization
   - Transaction hashes are stored

### 4. Database Schema

The database schema is designed to store signed electricity readings received from the ESP32, matching the format of the device output. The public key is sent once (on initial setup or registration) and should be stored for each installation. The usual data saved for each reading is the measurement (e.g., power, total, timestamp) and its cryptographic signature, as shown below:

Example signed reading:
```
📊 Data: ShellyEM power=16.4W total=8900.0Wh timestamp=1750346382
✍️ Signature: E8E9BAF0FA7C8231F222C3FBC0B1EA31A11F3E1774F4B95840ED815B6201A503C10B0980F021FB3F01000000000000007D5B0000040000002850FC3F2C50FC3F
```

```sql
-- Core Tables
solar_installations
  - id
  - name
  - shelly_mac
  - public_key  -- stored on initial registration

power_readings
  - id
  - installation_id
  - timestamp
  - power_w
  - total_wh
  - signature  -- cryptographic signature from ESP32
  - is_verified
  - blockchain_tx_hash

-- Optional: tokens table for blockchain integration
-- Only if tokenization is implemented
--
tokens
  - id
  - installation_id
  - token_id
  - amount
  - transaction_hash
```

*Note: The schema is intended to closely match the structure of the signed data output from the ESP32, ensuring data integrity and verifiability. The public key is stored for signature verification purposes.*

### 5. API Endpoints
```
POST /api/v1/installations/          # Create/update installation
GET  /api/v1/installations/          # Get all installations
POST /api/v1/readings/               # Submit power readings
GET  /api/v1/readings/{id}           # Get specific reading
GET  /api/v1/readings/latest/{id}    # Get latest reading
GET  /api/v1/readings/{id}/chart     # Get chart data for time frames
GET  /api/v1/status/                 # System status
```

### 6. Security Considerations
- Hardware-level cryptographic signing
- API authentication
- Blockchain immutability (future)
- Secure key storage
- Data verification at multiple levels

### 7. Development Guidelines
1. **Backend (FastAPI)**
   - Use dependency injection
   - Implement proper error handling
   - Follow REST API best practices
   - Document all endpoints

2. **Frontend (React + TypeScript)**
   - Component-based architecture
   - State management with React Query
   - Real-time updates with polling
   - Responsive design

3. **Smart Contracts** (future)
   - Gas optimization
   - Security best practices
   - Comprehensive testing
   - Upgradeability considerations

### 8. Deployment Considerations
- Docker containerization
- Environment configuration
- Database migrations
- Backup strategies
- Monitoring and logging

### 9. Production Setup

#### Raspberry Pi Setup
1. **Install Raspberry Pi OS**
   - Download Raspberry Pi OS Lite
   - Flash to SD card
   - Enable SSH before first boot
   - Configure Wi-Fi (optional)

2. **System Setup**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install git python3 python3-pip python3-venv postgresql postgresql-contrib nodejs npm -y
   ```

3. **Database Setup**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE wattwitness;
   CREATE USER wattuser WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE wattwitness TO wattuser;
   \q
   ```

4. **Backend Setup**
   ```bash
   git clone https://github.com/<username>/WattWitness.git
   cd WattWitness/RaspberryPi/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   # Configure database URL in config.py
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

5. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm run build
   serve -s dist -l 3000
   ```

6. **ESP32 Setup**
   - Update Wi-Fi credentials and backend IP in Arduino IDE
   - Flash to ESP32
   - Power independently with USB adapter

#### Storage Requirements
- **1 year of readings:** ~800 MB (including overhead and indexes)
- **Readings per year:** ~3.15 million (every 10 seconds)
- **Database:** PostgreSQL recommended for production

#### Data Retention
- **Current:** All data kept indefinitely
- **Future:** Implement 2-year retention with baseline tracking for lifetime production accuracy 