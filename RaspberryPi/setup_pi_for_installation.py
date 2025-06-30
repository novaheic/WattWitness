#!/usr/bin/env python3
"""
Setup script for configuring a Raspberry Pi for a specific WattWitness installation.

This script:
1. Queries the backend API for installation details
2. Creates/updates the listener .env file with the correct logger contract address
3. Optionally sets up the systemd service

Usage:
    python setup_pi_for_installation.py --installation-id 1 --api-url https://wattwitness-api.loca.lt
    python setup_pi_for_installation.py --installation-id 1 --setup-service
"""

import argparse
import requests
import sys
from pathlib import Path
from typing import Dict, Any
import os


def fetch_installation_details(installation_id: int, api_url: str) -> Dict[str, Any]:
    """Fetch installation details from the backend API."""
    # Try individual endpoint first, fall back to list endpoint
    url = f"{api_url.rstrip('/')}/api/v1/installations/{installation_id}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.json()
    except requests.RequestException:
        pass
    
    # Fall back to list endpoint and find by ID
    try:
        url = f"{api_url.rstrip('/')}/api/v1/installations/"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        installations = response.json()
        
        for installation in installations:
            if installation['id'] == installation_id:
                return installation
        
        print(f"❌ Installation {installation_id} not found in list")
        sys.exit(1)
        
    except requests.RequestException as e:
        print(f"❌ Failed to fetch installation details: {e}")
        sys.exit(1)


def create_listener_env(installation: Dict[str, Any], api_url: str, rpc_url: str = None, logger_address_override: str = None) -> None:
    """Create/update the listener .env file with installation-specific configuration."""
    listener_dir = Path(__file__).parent / "listener"
    env_file = listener_dir / ".env"
    
    if logger_address_override:
        logger_address = logger_address_override
        print(f"🔧 Using manual logger address override: {logger_address}")
    else:
        logger_address = installation.get("logger_contract_address")
        if not logger_address:
            print("❌ Installation does not have a logger_contract_address!")
            print("💡 Make sure the installation was created with factory deployment enabled")
            print("💡 Or use --logger-address to manually specify the address")
            sys.exit(1)
    
    # Default RPC URL
    if not rpc_url:
        rpc_url = "https://avalanche-fuji.infura.io/v3/5988071a0489487a9507da0ba450cc23"
    
    env_content = f"""# WattWitness Listener Configuration
# Generated for Installation ID: {installation['id']} - {installation['name']}
# Generated at: {installation.get('created_at', 'unknown')}

# Avalanche Fuji RPC endpoint
RPC_URL={rpc_url}

# Logger contract address for this installation
CONTRACT_ADDRESS={logger_address}

# Backend API URL
API_BASE_URL={api_url}

# Request timeout in seconds
REQUEST_TIMEOUT=10
"""
    
    print(f"📝 Writing listener configuration to {env_file}")
    env_file.write_text(env_content)
    
    print("✅ Listener .env file created successfully!")
    print(f"🔗 Monitoring logger contract: {logger_address}")


def setup_systemd_service() -> None:
    """Setup the systemd service for the listener."""
    service_file = Path(__file__).parent / "listener" / "wattwitness-listener.service"
    
    if not service_file.exists():
        print("❌ Service file not found at {service_file}")
        return
    
    print("🔧 Setting up systemd service...")
    print("💡 Run these commands as root:")
    print(f"   sudo cp {service_file} /etc/systemd/system/")
    print("   sudo systemctl daemon-reload")
    print("   sudo systemctl enable wattwitness-listener")
    print("   sudo systemctl start wattwitness-listener")
    print("   sudo systemctl status wattwitness-listener")


def main():
    parser = argparse.ArgumentParser(description="Setup Pi for WattWitness installation")
    parser.add_argument("--installation-id", type=int, required=True, 
                       help="Installation ID from backend database")
    parser.add_argument("--api-url", default="https://wattwitness-api.loca.lt",
                       help="Backend API URL")
    parser.add_argument("--rpc-url", 
                       help="Custom RPC URL (defaults to Infura Fuji)")
    parser.add_argument("--logger-address",
                       help="Manual logger contract address override")
    parser.add_argument("--setup-service", action="store_true",
                       help="Show systemd service setup instructions")
    
    args = parser.parse_args()
    
    print(f"🔍 Fetching installation {args.installation_id} from {args.api_url}")
    installation = fetch_installation_details(args.installation_id, args.api_url)
    
    print(f"📋 Installation Details:")
    print(f"   ID: {installation['id']}")
    print(f"   Name: {installation['name']}")
    print(f"   Shelly MAC: {installation['shelly_mac']}")
    print(f"   Logger Address: {installation.get('logger_contract_address', 'NOT SET')}")
    print(f"   Active: {installation['is_active']}")
    
    if not installation['is_active']:
        print("⚠️  Warning: Installation is marked as inactive")
    
    create_listener_env(installation, args.api_url, args.rpc_url, args.logger_address)
    
    if args.setup_service:
        setup_systemd_service()
    
    print("\n🎉 Pi setup complete!")
    print("\n🧪 Test the listener with:")
    print("   cd RaspberryPi && python -m listener.main --once")
    print("\n🚀 Start monitoring with:")
    print("   cd RaspberryPi && python -m listener.main")


if __name__ == "__main__":
    main() 