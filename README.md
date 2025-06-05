# WattWitness

A Trustless Tamperproof Electricity Production Meter for solar park tokenization.

## Project Overview

WattWitness is a system that measures solar power generation, signs the data using secure hardware, and pushes that signed data on-chain via an oracle. This project is being developed for a three-week hackathon.

## Hardware Components

- Shelly EM with 50A Clamp (Electricity Meter)
- Adafruit ATECC608 Breakout Board (signs reading)
- ESP32 WLAN Dev Kit Board (Recieves reading from Shelly)
- Raspberry Pi 4 (runs the backend and serves the dashboard)

## System Architecture

The system consists of several key components:

1. **Power Measurement System**
   - Shelly EM for accurate power measurement
   - ESP32 for data processing
   - ATECC608 for secure data signing

2. **Raspberry Pi System**
   - FastAPI backend server
   - PostgreSQL database
   - React dashboard server
   - Data storage and backup
   - System status monitoring
   - Alert management
   - Blockchain transaction management
   - Offline data storage and synchronization

3. **Blockchain Integration**
   - Chainlink Functions for data verification
   - Avalanche blockchain integration
   - Smart contract implementation

## Data Flow and Storage Strategy

### Local Storage
1. **Real-time Data**
   - Power readings are stored in PostgreSQL database
   - Each reading includes hardware signature and timestamp
   - Data is immediately available for dashboard display

2. **Offline Operation**
   - System continues to collect and store data when offline
   - PostgreSQL ensures data integrity during power outages
   - Automatic synchronization when internet connection is restored

### Blockchain Integration
1. **Data Aggregation**
   - Power readings are aggregated into daily totals
   - Aggregated data is signed by the Raspberry Pi
   - Batch processing reduces blockchain transaction costs

2. **Smart Contract Integration**
   - Chainlink Functions pull aggregated data from Raspberry Pi API
   - Data is verified before being written to the blockchain
   - Smart contract stores:
     - Daily power production totals
     - Hardware signatures
     - Timestamps
     - Verification status

### API Endpoints for Blockchain Integration
```bash
# Get aggregated power data for blockchain
GET /api/v1/readings/aggregated
  - start_date: ISO date
  - end_date: ISO date
  - installation_id: string

# Get verification status
GET /api/v1/readings/verification
  - blockchain_tx_hash: string
```

## Project Structure

```
wattwitness/
├── firmware/           # ESP32 code
├── backend/           # FastAPI backend (runs on Raspberry Pi)
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── db/       # Database models
│   │   └── core/     # Core functionality
│   └── tests/        # Backend tests
├── frontend/         # React dashboard (served by Raspberry Pi)
│   ├── src/
│   │   ├── components/  # React components
│   │   └── App.tsx     # Main application
│   └── public/         # Static assets
├── smart-contracts/   # Blockchain integration
├── docs/             # Documentation
└── tests/            # Test suites
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL
- Docker (optional)
- Raspberry Pi 4 (for production deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/wattwitness.git
   cd wattwitness
   ```

2. Set up the development environment:
   ```bash
   # Backend setup
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt

   # Frontend setup
   cd frontend
   npm install
   ```

3. Configure the environment:
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your configuration

   # Frontend
   cd frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Development

### Backend (Raspberry Pi)
```bash
cd backend
python -m uvicorn main:app --reload
```

### Frontend (Development)
```bash
cd frontend
npm run dev
```

### Production Deployment (Raspberry Pi)
```bash
# Build frontend
cd frontend
npm run build

# Start backend (with frontend served)
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Smart Contracts
```bash
cd smart-contracts
npx hardhat node
```

## Features

### Backend (Raspberry Pi)
- FastAPI-based REST API
- PostgreSQL database integration
- Real-time power data ingestion
- Hardware signature verification
- Blockchain transaction management
- Serves the React dashboard

### Frontend
- Real-time power monitoring dashboard
- System status visualization
- Historical data charts
- Blockchain verification status
- Dark mode UI with Material-UI

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Smart contract tests
cd smart-contracts
npx hardhat test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Chainlink for oracle services
- Avalanche for blockchain infrastructure
- All hardware manufacturers for their components 