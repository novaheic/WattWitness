import os
import sys
from pathlib import Path

# Disable on-chain factory for test environment
os.environ["DISABLE_FACTORY"] = "1"

# Ensure backend package is importable before other imports
root = Path(__file__).resolve().parents[3]
sys.path.append(str(root / "RaspberryPi" / "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.api.endpoints import power

client = TestClient(app)

def test_create_installation_stub_factory(monkeypatch):
    # Monkeypatch deploy_logger_for_installation to avoid blockchain
    def _fake_deploy(**kwargs):
        return ("0x000000000000000000000000000000000000dEaD", "0xhash")

    monkeypatch.setattr(power, "deploy_logger_for_installation", _fake_deploy)

    payload = {
        "name": "Test Site",
        "public_key": "deadbeef",
        "shelly_payload": "{}".encode().hex(),  # minimal base64 placeholder ignored by stub
        "boot_timestamp": 0
    }
    response = client.post("/api/v1/installations/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["logger_contract_address"] == "0x000000000000000000000000000000000000dEaD"
    assert data["deployment_tx_hash"] == "0xhash" 