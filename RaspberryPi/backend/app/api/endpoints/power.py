from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import json
import base64

from app.db.database import get_db
from app.db.models import PowerReading, SolarInstallation
from pydantic import BaseModel

router = APIRouter()

# Pydantic models for API requests/responses
class InstallationCreate(BaseModel):
    name: str = "Hackathon Test 1"
    public_key: str
    shelly_payload: str  # Full ShellyEM JSON payload to extract MAC

class InstallationResponse(BaseModel):
    id: int
    name: str
    shelly_mac: str
    public_key: str
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}

class PowerReadingCreate(BaseModel):
    power: float  # Power in watts
    total: float  # Total energy in watt-hours
    timestamp: int  # Unix timestamp
    signature: str  # Cryptographic signature
    shelly_payload: str  # Full ShellyEM JSON payload to extract MAC

class PowerReadingResponse(BaseModel):
    id: int
    installation_id: int
    power_w: float
    total_wh: float
    timestamp: int
    signature: str
    is_verified: bool
    verification_timestamp: datetime | None
    is_on_chain: bool
    blockchain_tx_hash: str | None
    blockchain_block_number: int | None
    created_at: datetime

    model_config = {"from_attributes": True}

def extract_shelly_mac(shelly_payload: str) -> str:
    """Extract MAC address from ShellyEM JSON payload (base64 encoded)"""
    try:
        # Decode base64 payload
        decoded_payload = base64.b64decode(shelly_payload).decode('utf-8')
        data = json.loads(decoded_payload)
        return data.get("mac", "")
    except Exception as e:
        print(f"Error extracting MAC: {e}")
        return ""

@router.post("/installations/")
def create_installation(installation: InstallationCreate, db: Session = Depends(get_db)):
    """Create a new solar installation (called once at ESP32 startup)"""
    
    print(f"Received installation request: {installation.name}")
    
    # Extract ShellyEM MAC address
    shelly_mac = extract_shelly_mac(installation.shelly_payload)
    print(f"Extracted MAC: {shelly_mac}")
    
    # Check if installation already exists (by MAC address OR public key)
    existing_by_mac = db.query(SolarInstallation).filter(
        SolarInstallation.shelly_mac == shelly_mac
    ).first()
    
    existing_by_key = db.query(SolarInstallation).filter(
        SolarInstallation.public_key == installation.public_key
    ).first()
    
    if existing_by_mac or existing_by_key:
        # Update existing installation (use whichever one exists)
        existing = existing_by_mac if existing_by_mac else existing_by_key
        print(f"Updating existing installation: {existing.id}")
        
        # Update all fields
        existing.public_key = installation.public_key
        existing.name = installation.name
        existing.shelly_mac = shelly_mac
        
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "name": existing.name,
            "shelly_mac": existing.shelly_mac,
            "public_key": existing.public_key,
            "created_at": existing.created_at,
            "is_active": existing.is_active
        }
    
    print(f"Creating new installation with MAC: {shelly_mac}")
    # Create new installation
    db_installation = SolarInstallation(
        name=installation.name,
        shelly_mac=shelly_mac,
        public_key=installation.public_key
    )
    
    try:
        db.add(db_installation)
        db.commit()
        db.refresh(db_installation)
        print(f"Successfully created installation: {db_installation.id}")
        return {
            "id": db_installation.id,
            "name": db_installation.name,
            "shelly_mac": db_installation.shelly_mac,
            "public_key": db_installation.public_key,
            "created_at": db_installation.created_at,
            "is_active": db_installation.is_active
        }
    except Exception as e:
        print(f"Error creating installation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/readings/")
def create_power_reading(reading: PowerReadingCreate, db: Session = Depends(get_db)):
    """Create a new power reading (called every 10 seconds by ESP32)"""
    
    # Extract ShellyEM MAC address to find the installation
    shelly_mac = extract_shelly_mac(reading.shelly_payload)
    
    # Find installation by MAC address
    installation = db.query(SolarInstallation).filter(
        SolarInstallation.shelly_mac == shelly_mac
    ).first()
    
    if not installation:
        raise HTTPException(
            status_code=404, 
            detail=f"Installation not found for ShellyEM MAC: {shelly_mac}. Please run initial setup first."
        )
    
    # TODO: Verify hardware signature
    # This would involve:
    # 1. Getting the public key from the installation
    # 2. Verifying the signature against the reading data
    # 3. Only storing if verification passes
    
    # Create new reading
    db_reading = PowerReading(
        installation_id=installation.id,
        power_w=reading.power,
        total_wh=reading.total,
        timestamp=reading.timestamp,
        signature=reading.signature,
        is_verified=True,  # This should be set based on actual verification
        verification_timestamp=datetime.utcnow()
    )
    
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    
    # TODO: Submit to blockchain
    # This would involve:
    # 1. Creating a transaction with the reading data
    # 2. Waiting for confirmation
    # 3. Updating the reading with blockchain details
    
    return {
        "id": db_reading.id,
        "installation_id": db_reading.installation_id,
        "power_w": db_reading.power_w,
        "total_wh": db_reading.total_wh,
        "timestamp": db_reading.timestamp,
        "signature": db_reading.signature,
        "is_verified": db_reading.is_verified,
        "verification_timestamp": db_reading.verification_timestamp,
        "is_on_chain": db_reading.is_on_chain,
        "blockchain_tx_hash": db_reading.blockchain_tx_hash,
        "blockchain_block_number": db_reading.blockchain_block_number,
        "created_at": db_reading.created_at
    }

@router.get("/readings/{installation_id}", response_model=List[PowerReadingResponse])
def get_power_readings(
    installation_id: int,
    start_time: datetime = None,
    end_time: datetime = None,
    verified_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get power readings for a specific installation"""
    # Set default time range if not provided
    if not end_time:
        end_time = datetime.utcnow()
    if not start_time:
        start_time = end_time - timedelta(hours=24)
    
    # Build query
    query = db.query(PowerReading).filter(
        PowerReading.installation_id == installation_id,
        PowerReading.created_at >= start_time,
        PowerReading.created_at <= end_time
    )
    
    # Filter for verified readings if requested
    if verified_only:
        query = query.filter(PowerReading.is_verified == True)
    
    # Get readings
    readings = query.order_by(PowerReading.created_at.desc()).all()
    return readings

@router.get("/readings/latest/{installation_id}", response_model=PowerReadingResponse)
def get_latest_reading(
    installation_id: int,
    verified_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get the latest power reading for a specific installation"""
    # Build query
    query = db.query(PowerReading).filter(
        PowerReading.installation_id == installation_id
    )
    
    # Filter for verified readings if requested
    if verified_only:
        query = query.filter(PowerReading.is_verified == True)
    
    # Get latest reading
    reading = query.order_by(PowerReading.created_at.desc()).first()
    
    if not reading:
        raise HTTPException(status_code=404, detail="No readings found for this installation")
    
    return reading 