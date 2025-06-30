"""Configuration for WattWitness listener (RaspberryPi package).
"""
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=False)

RPC_URL = os.getenv(
    "RPC_URL",
    "https://avalanche-fuji.infura.io/v3/5988071a0489487a9507da0ba450cc23",
)
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")  # Must be set in .env
API_BASE_URL = os.getenv("API_BASE_URL", "https://wattwitness-api.loca.lt")
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "10")) 