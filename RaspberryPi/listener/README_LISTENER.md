# WattWitness Event Listener

This service watches for `BatchProcessed` events emitted by the on-chain **WattWitnessDataLogger** contract and notifies the Raspberry Pi backend so rows are marked **on-chain**.

## Folder structure
```
RaspberryPi/
  listener/
    ├─ __init__.py
    ├─ abi.py
    ├─ config.py
    ├─ main.py
    ├─ requirements.txt
    └─ wattwitness-listener.service   # systemd template
```

## Quick start (manual)
```bash
# 1. create venv
python3 -m venv ~/.virtualenvs/wattwitness
source ~/.virtualenvs/wattwitness/bin/activate

# 2. install deps
pip install -r RaspberryPi/listener/requirements.txt

# 3. run once to verify connectivity
python -m RaspberryPi.listener.main --once

# 4. start continuous loop
python -m RaspberryPi.listener.main
```

## Production setup with systemd
1. Copy the unit file:
   ```bash
   sudo cp RaspberryPi/listener/wattwitness-listener.service /etc/systemd/system/
   ```
2. Edit paths/users in the unit file if they differ (e.g., `User=ubuntu`).
3. Reload and enable:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable wattwitness-listener
   sudo systemctl start  wattwitness-listener
   sudo systemctl status wattwitness-listener -n 50
   ```
Logs are sent to `journalctl -u wattwitness-listener`.

## Environment variables
Optionally set via `/etc/default/wattwitness-listener` or systemd `Environment=` lines:
- `RPC_URL` – Avalanche Fuji RPC endpoint (default: Infura key)
- `CONTRACT_ADDRESS` – Deployed WattWitnessDataLogger address
- `API_BASE_URL` – Base URL of the FastAPI backend

If you need to customise settings copy `env.example` to `.env` and edit:
```bash
cp RaspberryPi/listener/env.example RaspberryPi/listener/.env
nano RaspberryPi/listener/.env   # or your favourite editor
```

## Development
To run tests or iterate locally:
```bash
pip install pytest
pytest tests/
``` 