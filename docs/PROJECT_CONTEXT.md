# WattWitness Project Summary

## Project Overview
WattWitness is a Trustless Tamperproof Electricity Production Meter system for solar park tokenization. It ensures verifiable and immutable power production data through secure hardware measurements and blockchain integration.

## 🚀 Current Status

**✅ WORKING SYSTEM - ESP32 to Backend Integration Complete**

The system is currently operational with:
- ESP32 collecting and signing power data from ShellyEM
- FastAPI backend storing verified readings in PostgreSQL
- Real-time data flow every 10 seconds
- Installation ID: 1, MAC: EC64C9C05E97

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

## System Architecture

### 1. Hardware Components
- **Secure Measurement Hardware (ESP32)**
  - Measures power data (voltage, current, temperature)
  - Cryptographically signs measurements
  - Sends verified data to Raspberry Pi

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
  - Runs monitoring dashboard
  - Communicates with blockchain

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

### 3. Data Flow
1. **Measurement**
   - Secure hardware measures power data
   - Data is cryptographically signed
   - Timestamped at hardware level

2. **Verification**
   - Raspberry Pi receives signed data
   - Backend verifies hardware signature
   - Data is stored in PostgreSQL

3. **Blockchain Integration**
   - Verified data is submitted to blockchain
   - Smart contracts handle tokenization
   - Transaction hashes are stored

4. **Dashboard Display**
   - Real-time power readings
   - Historical data visualization
   - Blockchain verification status

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
POST /api/v1/readings/               # Submit power readings
GET  /api/v1/readings/{id}           # Get specific reading
GET  /api/v1/readings/latest/{id}    # Get latest reading
GET  /api/v1/status/                 # System status
```

### 6. Security Considerations
- Hardware-level cryptographic signing
- API authentication
- Blockchain immutability
- Secure key storage
- Data verification at multiple levels

### 7. Development Guidelines
1. **Backend (FastAPI)**
   - Use dependency injection
   - Implement proper error handling
   - Follow REST API best practices
   - Document all endpoints

2. **Frontend (React)**
   - Component-based architecture
   - State management with React Query
   - Real-time updates with WebSocket
   - Responsive design

3. **Smart Contracts**
   - Gas optimization
   - Security best practices
   - Comprehensive testing
   - Upgradeability considerations

### 8. Testing Strategy
Remove or update this section to reflect that the tests directory no longer exists.

### 9. Deployment Considerations
- Docker containerization
- Environment configuration
- Database migrations
- Backup strategies
- Monitoring and logging 