"""CLI utility to deploy a WattWitnessDataLogger via an existing factory.

Usage:
    python -m app.blockchain.create_logger_cli \
        --factory 0xAC8A0a99B946C026F259318791f8D3A63357D1cA \
        --rpc https://api.avax-test.network/ext/bc/C/rpc \
        --pk <PRIVATE_KEY> \
        --installation-id 1 \
        --name "My Roof" \
        --shelly-mac ABCDEF123456 \
        --public-key deadbeef \
        --created-at 1719950000

Environment variables `FACTORY_ADDRESS`, `CHAIN_RPC_URL`, `DEPLOYER_PRIVATE_KEY` may also be set instead of flags.
"""
from __future__ import annotations

import argparse
import os
import sys
from typing import Tuple
from .factory_client import deploy_logger_for_installation  # noqa: E402


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Deploy logger via factory")
    parser.add_argument("--factory", help="Factory contract address")
    parser.add_argument("--rpc", help="RPC URL (Avalanche Fuji)")
    parser.add_argument("--pk", help="Deployer private key (0xHex)")
    parser.add_argument("--installation-id", type=int, required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--shelly-mac", required=True)
    parser.add_argument("--public-key", required=True)
    parser.add_argument("--created-at", type=int, required=True)
    parser.add_argument("--inactive", action="store_true", help="Mark installation inactive")

    args = parser.parse_args(argv)

    os.environ["FACTORY_ADDRESS"] = args.factory or os.getenv("FACTORY_ADDRESS", "")
    os.environ["CHAIN_RPC_URL"] = args.rpc or os.getenv("CHAIN_RPC_URL", "")
    os.environ["DEPLOYER_PRIVATE_KEY"] = args.pk or os.getenv("DEPLOYER_PRIVATE_KEY", "")

    try:
        addr, tx = deploy_logger_for_installation(
            installation_id=args.installation_id,
            name=args.name,
            shelly_mac=args.shelly_mac,
            public_key=args.public_key,
            created_at=args.created_at,
            is_active=not args.inactive,
        )
        print(f"Logger deployed at {addr} in tx {tx}")
    except Exception as e:
        print(f"Deployment failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 