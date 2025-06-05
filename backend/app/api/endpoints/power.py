from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.db.database import get_db
from app.db.models import PowerReading, SolarInstallation
from pydantic import BaseModel

router = APIRouter()

class PowerReadingCreate(BaseModel):
    installation_id: int
    power_kw: float
    voltage_v: float
    current_a: float
    temperature_c: float
    hardware_signature: str  # Signature from secure hardware
    timestamp: datetime  # Timestamp from secure hardware

class PowerReadingResponse(PowerReadingCreate):
    id: int
    is_verified: bool
    verification_timestamp: datetime | None
    is_on_chain: bool
    blockchain_tx_hash: str | None
    blockchain_block_number: int | None

    class Config:
        from_attributes = True

@router.post("/readings/", response_model=PowerReadingResponse)
def create_power_reading(reading: PowerReadingCreate, db: Session = Depends(get_db)):
    # Verify installation exists
    installation = db.query(SolarInstallation).filter(SolarInstallation.id == reading.installation_id).first()
    if not installation:
        raise HTTPException(status_code=404, detail="Solar installation not found")
    
    # TODO: Verify hardware signature
    # This would involve:
    # 1. Getting the public key of the secure hardware
    # 2. Verifying the signature against the reading data
    # 3. Only storing if verification passes
    
    # Create new reading
    db_reading = PowerReading(
        installation_id=reading.installation_id,
        power_kw=reading.power_kw,
        voltage_v=reading.voltage_v,
        current_a=reading.current_a,
        temperature_c=reading.temperature_c,
        hardware_signature=reading.hardware_signature,
        timestamp=reading.timestamp,
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
    
    return db_reading

@router.get("/readings/{installation_id}", response_model=List[PowerReadingResponse])
def get_power_readings(
    installation_id: int,
    start_time: datetime = None,
    end_time: datetime = None,
    verified_only: bool = True,
    db: Session = Depends(get_db)
):
    # Set default time range if not provided
    if not end_time:
        end_time = datetime.utcnow()
    if not start_time:
        start_time = end_time - timedelta(hours=24)
    
    # Build query
    query = db.query(PowerReading).filter(
        PowerReading.installation_id == installation_id,
        PowerReading.timestamp >= start_time,
        PowerReading.timestamp <= end_time
    )
    
    # Filter for verified readings if requested
    if verified_only:
        query = query.filter(PowerReading.is_verified == True)
    
    # Get readings
    readings = query.order_by(PowerReading.timestamp.desc()).all()
    return readings

@router.get("/readings/latest/{installation_id}", response_model=PowerReadingResponse)
def get_latest_reading(
    installation_id: int,
    verified_only: bool = True,
    db: Session = Depends(get_db)
):
    # Build query
    query = db.query(PowerReading).filter(
        PowerReading.installation_id == installation_id
    )
    
    # Filter for verified readings if requested
    if verified_only:
        query = query.filter(PowerReading.is_verified == True)
    
    # Get latest reading
    reading = query.order_by(PowerReading.timestamp.desc()).first()
    
    if not reading:
        raise HTTPException(status_code=404, detail="No readings found for this installation")
    
    return reading 