# WattWitness Project Summary

## Project Overview
WattWitness is a Trustless Tamperproof Electricity Production Meter system for solar park tokenization. It ensures verifiable and immutable power production data through secure hardware measurements and blockchain integration.

## System Architecture

### 1. Hardware Components
- **Secure Measurement Hardware (ESP32)**
  - Measures power data (voltage, current, temperature)
  - Cryptographically signs measurements
  - Sends verified data to Raspberry Pi

- **Raspberry Pi**
  - Receives verified data from secure hardware
  - Runs monitoring dashboard
  - Communicates with backend server

### 2. Software Components

#### Directory Structure
```
wattwitness/
├── firmware/           # ESP32 code
│   ├── src/           # Source code
│   └── lib/           # Libraries
│
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── db/        # Database models
│   │   └── core/      # Core functionality
│   └── main.py        # Application entry
│
├── frontend/          # Dashboard (React)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/  # API integration
│   └── public/
│
├── smart-contracts/   # Blockchain integration
│   ├── contracts/     # Solidity contracts
│   └── scripts/       # Deployment scripts
│
├── docs/             # Documentation
└── tests/            # Test suites
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
```sql
-- Core Tables
solar_installations
  - id
  - name
  - location
  - capacity_kw
  - hardware_id
  - public_key

power_readings
  - id
  - installation_id
  - timestamp
  - power_kw
  - voltage_v
  - current_a
  - temperature_c
  - hardware_signature
  - is_verified
  - blockchain_tx_hash

tokens
  - id
  - installation_id
  - token_id
  - amount
  - transaction_hash
```

### 5. API Endpoints
```
POST /api/v1/readings/          # Submit power readings
GET  /api/v1/readings/{id}      # Get specific reading
GET  /api/v1/readings/latest/   # Get latest reading
GET  /api/v1/status/           # System status
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
- Unit tests for all components
- Integration tests for API
- End-to-end tests for critical flows
- Hardware simulation tests
- Blockchain integration tests

### 9. Deployment Considerations
- Docker containerization
- Environment configuration
- Database migrations
- Backup strategies
- Monitoring and logging 