"""WattWitness BatchProcessed listener (inside RaspberryPi folder).
Run with:
   python -m RaspberryPi.listener.main [--once] [--address CONTRACT_ADDRESS]
"""
from __future__ import annotations

import argparse
import sys
from typing import Any

import requests
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from web3 import Web3
from web3.contract import Contract
from web3.types import LogReceipt

from . import config
from .abi import ABI


def _init_web3() -> Web3:
    w3 = Web3(Web3.HTTPProvider(config.RPC_URL, request_kwargs={"timeout": 30}))
    if not w3.is_connected():
        print(f"[ERR] Unable to connect to RPC at {config.RPC_URL}", file=sys.stderr)
        sys.exit(1)
    print(f"Connected to chain id {w3.eth.chain_id} – client {w3.client_version}")
    return w3


def _load_contract(w3: Web3, contract_address: str) -> Contract:
    return w3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=ABI)


@retry(wait=wait_exponential(multiplier=1, min=2, max=30), stop=stop_after_attempt(5), retry=retry_if_exception_type((requests.RequestException,)))
def _post_mark_on_chain(payload: dict[str, Any]) -> None:
    url = f"{config.API_BASE_URL.rstrip('/')}/api/v1/readings/mark-on-chain"
    resp = requests.post(url, json=payload, timeout=config.REQUEST_TIMEOUT)
    if resp.status_code >= 400:
        raise requests.HTTPError(f"Backend responded with {resp.status_code}: {resp.text}", response=resp)
    print(f"[API] Marked readings {payload['first_reading_id']}-{payload['last_reading_id']} on-chain.")


def _process_event(event: LogReceipt) -> None:
    args = event["args"]
    first_id = args["firstReadingId"]
    reading_count = args["readingCount"]
    tx_hash = event["transactionHash"].hex()
    block_number = event["blockNumber"]
    last_id = first_id + reading_count - 1
    payload = {
        "first_reading_id": first_id,
        "last_reading_id": last_id,
        "blockchain_tx_hash": tx_hash,
        "blockchain_block_number": block_number,
    }
    print(f"[EVENT] BatchProcessed first={first_id} count={reading_count} block={block_number}")
    try:
        _post_mark_on_chain(payload)
    except Exception as e:
        print(f"[ERR] Backend update failed: {e}")


def _event_loop(contract: Contract) -> None:
    poll_interval = 30
    w3 = contract.w3
    start_block = max(0, w3.eth.block_number - 50)
    last_processed = start_block - 1
    print(f"Starting polling from block {start_block} (current {w3.eth.block_number})")
    import time
    while True:
        try:
            latest = w3.eth.block_number
            if latest > last_processed:
                logs = contract.events.BatchProcessed.get_logs(from_block=last_processed + 1, to_block=latest)
                for log in logs:
                    _process_event(log)
                last_processed = latest
        except KeyboardInterrupt:
            print("Interrupted, exiting.")
            break
        except Exception as e:
            print(f"[ERR] Polling error: {e}")
        time.sleep(poll_interval)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Listener for WattWitness BatchProcessed events")
    parser.add_argument("--once", action="store_true", help="connectivity test")
    parser.add_argument("--address", help="Override contract address")
    args = parser.parse_args(argv)

    # Determine contract address
    if args.address:
        contract_address = args.address
        print(f"[CONFIG] Using provided contract address: {contract_address}")
    elif config.CONTRACT_ADDRESS:
        contract_address = config.CONTRACT_ADDRESS
        print(f"[CONFIG] Using configured contract address: {contract_address}")
    else:
        print("[ERR] No contract address configured!")
        print("[ERR] Please set CONTRACT_ADDRESS in .env file or use --address flag")
        print("[ERR] Example .env entry: CONTRACT_ADDRESS=0x6A4E5cD0C47c006D95d6e360Ff5d7Af8a09538D8")
        sys.exit(1)

    w3 = _init_web3()
    contract = _load_contract(w3, contract_address)
    print(f"[CONFIG] Monitoring contract: {contract_address}")
    
    if args.once:
        print("Connectivity OK. Exiting.")
        return
    _event_loop(contract)


if __name__ == "__main__":
    main() 