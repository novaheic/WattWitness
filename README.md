# WattWitness

A Trustless Tamperproof Electricity Production Meter for solar park tokenization.

## Project Overview

WattWitness is a system that measures solar power generation, signs the data using secure hardware, and pushes that signed data on-chain via an oracle. This project is being developed for a three-week hackathon.

## Hardware Components

- Shelly EM with 50A Clamp
- Adafruit ATECC608 Breakout Board
- ESP32 WLAN Dev Kit Board
- Raspberry Pi 4

## System Architecture

The system consists of several key components:

1. **Power Measurement System**
   - Shelly EM for accurate power measurement
   - ESP32 for data processing
   - ATECC608 for secure data signing

2. **Monitoring System (Raspberry Pi)**
   - Real-time data visualization
   - Data storage and backup
   - System status monitoring
   - Alert management

3. **Blockchain Integration**
   - Chainlink Functions for data verification
   - Avalanche blockchain integration
   - Smart contract implementation

## Project Structure

```
wattwitness/
├── firmware/           # ESP32 code
├── backend/           # Raspberry Pi monitoring
├── smart-contracts/   # Blockchain integration
├── docs/             # Documentation
└── tests/            # Test suites
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- ESP-IDF
- PostgreSQL
- Docker (optional)

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
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Development

- Backend: `cd backend && python main.py`
- Frontend: `cd frontend && npm start`
- Smart Contracts: `cd smart-contracts && npx hardhat node`

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