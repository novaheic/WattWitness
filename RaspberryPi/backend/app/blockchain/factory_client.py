"""Utility to interact with WattWitnessLoggerFactory contract"""

import os
from typing import Tuple
from web3 import Web3, HTTPProvider
from eth_account import Account
from eth_account.signers.local import LocalAccount
import json
from pathlib import Path

# Load env variables
FACTORY_ADDRESS = os.getenv("FACTORY_ADDRESS")
CHAIN_RPC_URL = os.getenv("CHAIN_RPC_URL")
PRIVATE_KEY = os.getenv("DEPLOYER_PRIVATE_KEY")

if not all([FACTORY_ADDRESS, CHAIN_RPC_URL, PRIVATE_KEY]):
    # Helper may be imported in contexts where env isn't set (e.g., unit tests)
    FACTORY_ADDRESS = CHAIN_RPC_URL = PRIVATE_KEY = None  # type: ignore


def _load_abi() -> list:  # type: ignore[override]
    """Load ABI JSON for the factory contract (assumes artifact exists in repo)."""
    abi_path = Path(__file__).resolve().parent.parent.parent / "smart-contracts" / "out" / "WattWitnessLoggerFactory.sol" / "WattWitnessLoggerFactory.json"
    if abi_path.exists():
        with open(abi_path) as f:
            data = json.load(f)
            return data["abi"]
    # Fallback minimal ABI just for createLogger
    return [
        {
            "inputs": [
                {"internalType": "uint32", "name": "installationId", "type": "uint32"},
                {"internalType": "string", "name": "name", "type": "string"},
                {"internalType": "string", "name": "shellyMac", "type": "string"},
                {"internalType": "string", "name": "publicKey", "type": "string"},
                {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
                {"internalType": "bool", "name": "isActive", "type": "bool"},
            ],
            "name": "createLogger",
            "outputs": [{"internalType": "address", "name": "logger", "type": "address"}],
            "stateMutability": "nonpayable",
            "type": "function",
        }
    ]


def deploy_logger_for_installation(
    *,
    installation_id: int,
    name: str,
    shelly_mac: str,
    public_key: str,
    created_at: int,
    is_active: bool,
) -> Tuple[str, str]:
    """Deploy logger via factory and return (logger_address, tx_hash)."""
    if not all([FACTORY_ADDRESS, CHAIN_RPC_URL, PRIVATE_KEY]):
        raise RuntimeError("Blockchain env variables not configured")

    w3 = Web3(HTTPProvider(CHAIN_RPC_URL))
    acct: LocalAccount = Account.from_key(PRIVATE_KEY)
    factory = w3.eth.contract(address=Web3.to_checksum_address(FACTORY_ADDRESS), abi=_load_abi())

    # Build tx
    txn = factory.functions.createLogger(
        installation_id,
        name,
        shelly_mac,
        public_key,
        created_at,
        is_active,
    ).build_transaction({
        "from": acct.address,
        "nonce": w3.eth.get_transaction_count(acct.address),
        "gas": 600000,  # conservative upper bound; factory deployment ~300k
        "gasPrice": w3.eth.gas_price,
    })

    signed = acct.sign_transaction(txn)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    if receipt.status != 1:
        raise RuntimeError("Logger deployment tx reverted")

    # Decode returned logger address from logs or output
    logger_addr = receipt.contractAddress if receipt.contractAddress else factory.functions.loggers(installation_id).call()
    return logger_addr, tx_hash.hex() 