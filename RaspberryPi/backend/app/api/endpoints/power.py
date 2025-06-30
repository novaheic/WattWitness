from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json
import base64
import os

from app.db.database import get_db
from app.db.models import PowerReading, SolarInstallation
from pydantic import BaseModel

# Blockchain factory helper (lazy import to avoid circular deps during tests)
try:
    from app.blockchain.factory_client import deploy_logger_for_installation  # noqa: E402
except Exception:
    deploy_logger_for_installation = None  # type: ignore

router = APIRouter()

# Pydantic models for API requests/responses
class InstallationCreate(BaseModel):
    name: str = "Hackathon Test 1"
    public_key: str
    shelly_payload: str  # Full ShellyEM JSON payload to extract MAC
    boot_timestamp: int = None  # Unix timestamp when ESP32 booted/reset

class InstallationResponse(BaseModel):
    id: int
    name: str
    shelly_mac: str
    public_key: str
    last_boot_timestamp: int | None
    created_at: datetime
    is_active: bool
    logger_contract_address: str | None = None
    deployment_tx_hash: str | None = None

    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

def extract_shelly_mac(shelly_payload: str) -> str:
    """Extract MAC address from ShellyEM JSON payload (base64 encoded)"""
    try:
        # Add padding if needed
        padding = 4 - (len(shelly_payload) % 4)
        if padding != 4:
            shelly_payload += "=" * padding
        
        # Decode base64 payload
        decoded_bytes = base64.b64decode(shelly_payload)
        
        # Try to decode as UTF-8
        try:
            decoded_payload = decoded_bytes.decode('utf-8')
        except UnicodeDecodeError:
            return ""
        
        # Parse JSON
        data = json.loads(decoded_payload)
        mac = data.get("mac", "")
        return mac
        
    except Exception:
        return ""

@router.get("/installations/", response_model=List[InstallationResponse])
def get_installations(db: Session = Depends(get_db)):
    """Get all solar installations"""
    installations = db.query(SolarInstallation).filter(
        SolarInstallation.is_active == True
    ).order_by(SolarInstallation.created_at.desc()).all()
    
    # Convert SQLAlchemy objects to Pydantic models
    return [
        InstallationResponse(
            id=installation.id,
            name=installation.name,
            shelly_mac=installation.shelly_mac,
            public_key=installation.public_key,
            last_boot_timestamp=installation.last_boot_timestamp,
            created_at=installation.created_at,
            is_active=installation.is_active,
            logger_contract_address=installation.logger_contract_address,
            deployment_tx_hash=installation.deployment_tx_hash
        )
        for installation in installations
    ]

@router.get("/installations/{installation_id}", response_model=InstallationResponse)
def get_installation(installation_id: int, db: Session = Depends(get_db)):
    """Get a specific installation by ID"""
    installation = db.query(SolarInstallation).filter(SolarInstallation.id == installation_id).first()
    if not installation:
        raise HTTPException(status_code=404, detail="Installation not found")
    
    return InstallationResponse(
        id=installation.id,
        name=installation.name,
        shelly_mac=installation.shelly_mac,
        public_key=installation.public_key,
        last_boot_timestamp=installation.last_boot_timestamp,
        created_at=installation.created_at,
        is_active=installation.is_active,
        logger_contract_address=installation.logger_contract_address,
        deployment_tx_hash=installation.deployment_tx_hash
    )

class InstallationUpdate(BaseModel):
    logger_contract_address: str = None
    deployment_tx_hash: str = None
    is_active: bool = None

@router.patch("/installations/{installation_id}")
def update_installation(installation_id: int, update: InstallationUpdate, db: Session = Depends(get_db)):
    """Update specific fields of an installation"""
    installation = db.query(SolarInstallation).filter(SolarInstallation.id == installation_id).first()
    if not installation:
        raise HTTPException(status_code=404, detail="Installation not found")
    
    # Update only provided fields
    if update.logger_contract_address is not None:
        installation.logger_contract_address = update.logger_contract_address
    if update.deployment_tx_hash is not None:
        installation.deployment_tx_hash = update.deployment_tx_hash
    if update.is_active is not None:
        installation.is_active = update.is_active
    
    db.commit()
    db.refresh(installation)
    
    return InstallationResponse(
        id=installation.id,
        name=installation.name,
        shelly_mac=installation.shelly_mac,
        public_key=installation.public_key,
        last_boot_timestamp=installation.last_boot_timestamp,
        created_at=installation.created_at,
        is_active=installation.is_active,
        logger_contract_address=installation.logger_contract_address,
        deployment_tx_hash=installation.deployment_tx_hash
    )

@router.post("/installations/")
def create_installation(installation: InstallationCreate, db: Session = Depends(get_db)):
    """Create a new solar installation (called once at ESP32 startup)"""
    
    # Extract ShellyEM MAC address
    shelly_mac = extract_shelly_mac(installation.shelly_payload)
    
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
        
        # Update all fields
        existing.public_key = installation.public_key
        existing.name = installation.name
        existing.shelly_mac = shelly_mac
        if installation.boot_timestamp:
            existing.last_boot_timestamp = installation.boot_timestamp
        
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "name": existing.name,
            "shelly_mac": existing.shelly_mac,
            "public_key": existing.public_key,
            "last_boot_timestamp": existing.last_boot_timestamp,
            "created_at": existing.created_at,
            "is_active": existing.is_active,
            "logger_contract_address": existing.logger_contract_address,
            "deployment_tx_hash": existing.deployment_tx_hash
        }
    
    # Create new installation
    db_installation = SolarInstallation(
        name=installation.name,
        shelly_mac=shelly_mac,
        public_key=installation.public_key,
        last_boot_timestamp=installation.boot_timestamp
    )
    
    try:
        # Persist preliminarily to obtain ID (but keep in transaction)
        db.add(db_installation)
        db.flush()  # Get auto-generated ID without committing

        # ===== Deploy on-chain logger via factory if helper available =====
        logger_addr: Optional[str] = None
        deploy_tx: Optional[str] = None
        if deploy_logger_for_installation:
            try:
                if os.getenv("DISABLE_FACTORY", "0") == "1":
                    raise RuntimeError("Factory disabled via env")
                logger_addr, deploy_tx = deploy_logger_for_installation(
                    installation_id=db_installation.id,
                    name=db_installation.name,
                    shelly_mac=db_installation.shelly_mac,
                    public_key=db_installation.public_key,
                    created_at=int(db_installation.created_at.timestamp()),
                    is_active=db_installation.is_active,
                )
                db_installation.logger_contract_address = logger_addr
                db_installation.deployment_tx_hash = deploy_tx
            except Exception as e:
                print(f"Factory deployment failed: {e}")
                # Decide whether to abort or continue; for now, continue without rollback

        db.commit()
        db.refresh(db_installation)
        print(f"Successfully created installation: {db_installation.id}")
        return {
            "id": db_installation.id,
            "name": db_installation.name,
            "shelly_mac": db_installation.shelly_mac,
            "public_key": db_installation.public_key,
            "last_boot_timestamp": db_installation.last_boot_timestamp,
            "created_at": db_installation.created_at,
            "is_active": db_installation.is_active,
            "logger_contract_address": db_installation.logger_contract_address,
            "deployment_tx_hash": db_installation.deployment_tx_hash
        }
    except Exception as e:
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

# New Pydantic models for blockchain integration
class BlockchainUpdateRequest(BaseModel):
    first_reading_id: int  # First reading ID in the range to mark as on-chain
    last_reading_id: int   # Last reading ID in the range to mark as on-chain
    blockchain_tx_hash: str  # Transaction hash from the blockchain
    blockchain_block_number: int = None  # Optional block number

class PendingReadingsResponse(BaseModel):
    readings: List[List]  # Array of arrays: [id, power_w, total_wh, timestamp, signature]
    first_reading_id: int = None  # First reading ID in the batch
    last_reading_id: int = None   # Last reading ID in the batch
    count: int  # Total number of pending readings

@router.get("/readings/pending", response_model=PendingReadingsResponse)
def get_pending_readings(db: Session = Depends(get_db)):
    """
    Get all power readings that haven't been saved on-chain yet.
    Returns readings data plus metadata about the range for batch processing.
    """
    # Query for readings that are verified but not yet on-chain
    readings = db.query(PowerReading).filter(
        PowerReading.is_verified == True,
        PowerReading.is_on_chain == False
    ).order_by(PowerReading.id.asc()).all()  # Order by ID for consistent range
    
    if not readings:
        return PendingReadingsResponse(
            readings=[],
            first_reading_id=None,
            last_reading_id=None,
            count=0
        )
    
    # Convert to array of arrays format
    result = []
    for reading in readings:
        result.append([
            reading.id,
            reading.power_w,
            reading.total_wh,
            reading.timestamp,
            reading.signature
        ])
    
    return PendingReadingsResponse(
        readings=result,
        first_reading_id=readings[0].id,
        last_reading_id=readings[-1].id,
        count=len(readings)
    )

@router.post("/readings/mark-on-chain")
def mark_readings_on_chain(request: BlockchainUpdateRequest, db: Session = Depends(get_db)):
    """
    Mark readings as saved on-chain and store the transaction hash.
    Updates is_on_chain to true and saves blockchain_tx_hash for readings in the specified range.
    """
    if not request.blockchain_tx_hash:
        raise HTTPException(status_code=400, detail="Transaction hash is required")
    
    if request.first_reading_id > request.last_reading_id:
        raise HTTPException(status_code=400, detail="First reading ID must be less than or equal to last reading ID")
    
    # Find all readings in the specified range that are verified but not on-chain
    readings = db.query(PowerReading).filter(
        PowerReading.id >= request.first_reading_id,
        PowerReading.id <= request.last_reading_id,
        PowerReading.is_verified == True,
        PowerReading.is_on_chain == False
    ).all()
    
    if not readings:
        raise HTTPException(
            status_code=404, 
            detail=f"No verified, non-blockchain readings found in range {request.first_reading_id}-{request.last_reading_id}"
        )
    
    # Update all readings in the range
    updated_count = 0
    updated_ids = []
    for reading in readings:
        reading.is_on_chain = True
        reading.blockchain_tx_hash = request.blockchain_tx_hash
        if request.blockchain_block_number:
            reading.blockchain_block_number = request.blockchain_block_number
        updated_count += 1
        updated_ids.append(reading.id)
    
    try:
        db.commit()
        return {
            "message": f"Successfully marked {updated_count} readings as on-chain",
            "range": f"{request.first_reading_id}-{request.last_reading_id}",
            "updated_reading_ids": updated_ids,
            "blockchain_tx_hash": request.blockchain_tx_hash,
            "blockchain_block_number": request.blockchain_block_number
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

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
    
    # Convert datetime to Unix timestamps for comparison with ESP32 timestamps
    start_timestamp = int(start_time.timestamp())
    end_timestamp = int(end_time.timestamp())
    
    # Build query - use timestamp field (ESP32 timestamp) instead of created_at
    query = db.query(PowerReading).filter(
        PowerReading.installation_id == installation_id,
        PowerReading.timestamp >= start_timestamp,
        PowerReading.timestamp <= end_timestamp
    )
    
    # Filter for verified readings if requested
    if verified_only:
        query = query.filter(PowerReading.is_verified == True)
    
    # Get readings
    readings = query.order_by(PowerReading.timestamp.desc()).all()
    
    # Convert SQLAlchemy objects to Pydantic models
    return [PowerReadingResponse.from_orm(reading) for reading in readings]

@router.get("/readings/{installation_id}/all", response_model=List[PowerReadingResponse])
def get_all_power_readings(
    installation_id: int,
    verified_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get ALL power readings for a specific installation (for lifetime calculations)"""
    
    # Build query - no time limits
    query = db.query(PowerReading).filter(
        PowerReading.installation_id == installation_id
    )
    
    # Filter for verified readings if requested
    if verified_only:
        query = query.filter(PowerReading.is_verified == True)
    
    # Get all readings
    readings = query.order_by(PowerReading.timestamp.desc()).all()
    
    # Convert SQLAlchemy objects to Pydantic models
    return [PowerReadingResponse.from_orm(reading) for reading in readings]

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
    
    return PowerReadingResponse.from_orm(reading)

# Chart data response model
class ChartDataPoint(BaseModel):
    label: str  # Time label (e.g., "14:00", "Mon", "Jan")
    value: float  # Energy production in Wh
    timestamp: int  # Unix timestamp for sorting

class ChartDataResponse(BaseModel):
    data_points: List[ChartDataPoint]
    time_frame: str
    total_energy: float

@router.get("/readings/{installation_id}/chart", response_model=ChartDataResponse)
def get_chart_data(
    installation_id: int,
    time_frame: str = "week",  # hour, day, week, month, year
    verified_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get aggregated chart data for a specific installation and time frame"""
    
    # First, get the latest reading to use as the reference point
    latest_reading_query = db.query(PowerReading).filter(
        PowerReading.installation_id == installation_id
    )
    if verified_only:
        latest_reading_query = latest_reading_query.filter(PowerReading.is_verified == True)
    
    latest_reading = latest_reading_query.order_by(PowerReading.timestamp.desc()).first()
    
    if not latest_reading:
        # No readings found, return empty data
        return ChartDataResponse(
            data_points=[],
            time_frame=time_frame,
            total_energy=0.0
        )
    
    # Use the latest reading's timestamp as the reference point
    reference_timestamp = latest_reading.timestamp
    reference_time = datetime.utcfromtimestamp(reference_timestamp)
    
    # Calculate time range based on time frame using the reference timestamp
    if time_frame == "hour":
        start_timestamp = reference_timestamp - 3600  # 1 hour ago
        interval_seconds = 600  # 10 minutes
        label_format = "%H:%M"
    elif time_frame == "day":
        start_timestamp = reference_timestamp - 86400  # 1 day ago
        interval_seconds = 3600  # 1 hour
        label_format = "%H:%M"
    elif time_frame == "week":
        start_timestamp = reference_timestamp - 604800  # 7 days ago
        interval_seconds = 86400  # 1 day
        label_format = "%a"  # Mon, Tue, etc.
    elif time_frame == "month":
        start_timestamp = reference_timestamp - 2592000  # 30 days ago
        interval_seconds = 86400  # 1 day
        label_format = "%b %d"  # Jan 15, etc.
    elif time_frame == "year":
        # For year view, we need proper month boundaries, not fixed 30-day intervals
        # Start from the beginning of the month 12 months ago
        reference_dt = datetime.utcfromtimestamp(reference_timestamp)
        
        # Go back 12 months to get the start month
        if reference_dt.month <= 12:
            start_year = reference_dt.year - 1
            start_month = reference_dt.month
        else:
            start_year = reference_dt.year
            start_month = reference_dt.month - 12
        
        # Create start of the start month
        start_dt = datetime(start_year, start_month, 1)
        start_timestamp = int(start_dt.timestamp())
        
        # We'll handle month buckets differently - not using fixed intervals
        interval_seconds = None  # Will be calculated per month
        label_format = "%b"  # Jan, Feb, etc.
    else:
        raise HTTPException(status_code=400, detail="Invalid time frame. Use: hour, day, week, month, year")
    
    end_timestamp = reference_timestamp
    
    # Get readings in the time range
    query = db.query(PowerReading).filter(
        PowerReading.installation_id == installation_id,
        PowerReading.timestamp >= start_timestamp,
        PowerReading.timestamp <= end_timestamp
    )
    
    if verified_only:
        query = query.filter(PowerReading.is_verified == True)
    
    readings = query.order_by(PowerReading.timestamp.asc()).all()
    
    # Group readings by time intervals and calculate energy production
    data_points = []
    total_energy = 0.0
    
    # Only create buckets if we have readings data to avoid phantom historical data
    if not readings:
        return ChartDataResponse(
            data_points=[],
            time_frame=time_frame,
            total_energy=0.0
        )
    
    # Find the earliest reading to determine when the system actually started
    first_reading_time = min(r.timestamp for r in readings)
    
    # Handle year view with proper month boundaries
    if time_frame == "year":
        # Create month buckets with proper boundaries
        reference_dt = datetime.utcfromtimestamp(reference_timestamp)
        start_dt = datetime.utcfromtimestamp(start_timestamp)
        
        current_dt = start_dt
        while current_dt <= reference_dt:
            # Calculate month boundaries
            current_time = int(current_dt.timestamp())
            
            # Next month
            if current_dt.month == 12:
                next_dt = datetime(current_dt.year + 1, 1, 1)
            else:
                next_dt = datetime(current_dt.year, current_dt.month + 1, 1)
            
            bucket_end = min(int(next_dt.timestamp()), end_timestamp)
            
            # Find readings in this month bucket
            bucket_readings = [
                r for r in readings 
                if current_time <= r.timestamp < bucket_end
            ]
            
            bucket_energy = 0.0
            if len(bucket_readings) >= 2:
                for i in range(1, len(bucket_readings)):
                    current_reading = bucket_readings[i]
                    previous_reading = bucket_readings[i-1]
                    time_diff_hours = (current_reading.timestamp - previous_reading.timestamp) / 3600
                    average_power = (current_reading.power_w + previous_reading.power_w) / 2
                    energy = average_power * time_diff_hours
                    bucket_energy += abs(energy)
                
                total_energy += bucket_energy
            
            # Create label for this bucket
            label = current_dt.strftime(label_format)
            
            data_points.append(ChartDataPoint(
                label=label,
                value=bucket_energy,
                timestamp=current_time
            ))
            
            # Move to next month
            current_dt = next_dt
    else:
        # Handle other time frames with fixed intervals
        current_time = start_timestamp
        while current_time < end_timestamp:
            bucket_end = min(current_time + interval_seconds, end_timestamp)
            
            # Find readings in this time bucket
            bucket_readings = [
                r for r in readings 
                if current_time <= r.timestamp < bucket_end
            ]
            
            bucket_energy = 0.0
            if len(bucket_readings) >= 2:
                for i in range(1, len(bucket_readings)):
                    current_reading = bucket_readings[i]
                    previous_reading = bucket_readings[i-1]
                    time_diff_hours = (current_reading.timestamp - previous_reading.timestamp) / 3600
                    average_power = (current_reading.power_w + previous_reading.power_w) / 2
                    energy = average_power * time_diff_hours
                    bucket_energy += abs(energy)
                
                total_energy += bucket_energy
            
            # Create label for this bucket
            bucket_time = datetime.fromtimestamp(current_time)
            label = bucket_time.strftime(label_format)
            
            data_points.append(ChartDataPoint(
                label=label,
                value=bucket_energy,
                timestamp=current_time
            ))
            current_time = bucket_end
    
    return ChartDataResponse(
        data_points=data_points,
        time_frame=time_frame,
        total_energy=total_energy
    )

@router.get("/readings/{installation_id}/optimized", response_model=List[PowerReadingResponse])
def get_optimized_readings(
    installation_id: int,
    start_time: datetime = None,
    end_time: datetime = None,
    max_points: int = 1000,
    verified_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get optimized readings using aggregates when available, raw readings when recent"""
    # Set default time range if not provided
    if not end_time:
        end_time = datetime.utcnow()
    if not start_time:
        start_time = end_time - timedelta(hours=24)
    
    # Convert datetime to Unix timestamps
    start_timestamp = int(start_time.timestamp())
    end_timestamp = int(end_time.timestamp())
    
    # Strategy: Use aggregates for data older than 24 hours, raw readings for recent data
    cutoff_time = datetime.utcnow() - timedelta(hours=24)
    cutoff_timestamp = int(cutoff_time.timestamp())
    
    results = []
    
    # Get aggregated data for older periods
    if start_timestamp < cutoff_timestamp:
        aggregate_end = min(cutoff_timestamp, end_timestamp)
        
        aggregates = db.query(PowerReadingAggregate).filter(
            PowerReadingAggregate.installation_id == installation_id,
            PowerReadingAggregate.time_bucket >= start_timestamp,
            PowerReadingAggregate.time_bucket <= aggregate_end
        ).order_by(PowerReadingAggregate.time_bucket.desc()).all()
        
        # Convert aggregates to reading-like format
        for agg in aggregates:
            # Use average values from aggregate
            reading_dict = {
                "id": f"agg_{agg.id}",  # Mark as aggregate
                "installation_id": agg.installation_id,
                "power_w": agg.avg_power_w,
                "total_wh": agg.total_energy_wh,  # Use bucket energy
                "timestamp": agg.time_bucket,
                "signature": "aggregate",  # Mark as aggregate
                "is_verified": True,
                "verification_timestamp": agg.aggregated_at,
                "is_on_chain": True,  # Aggregates are from on-chain data
                "blockchain_tx_hash": agg.blockchain_tx_hash,
                "blockchain_block_number": agg.blockchain_block_number,
                "created_at": agg.created_at
            }
            results.append(PowerReadingResponse(**reading_dict))
    
    # Get raw readings for recent period (last 24 hours)
    if end_timestamp > cutoff_timestamp:
        raw_start = max(start_timestamp, cutoff_timestamp)
        
        raw_query = db.query(PowerReading).filter(
            PowerReading.installation_id == installation_id,
            PowerReading.timestamp >= raw_start,
            PowerReading.timestamp <= end_timestamp
        )
        
        if verified_only:
            raw_query = raw_query.filter(PowerReading.is_verified == True)
        
        raw_readings = raw_query.order_by(PowerReading.timestamp.desc()).all()
        
        # Sample raw readings if too many
        if len(raw_readings) > max_points:
            sample_interval = len(raw_readings) // max_points
            raw_readings = raw_readings[::sample_interval]
        
        # Convert to response format
        for reading in raw_readings:
            results.append(PowerReadingResponse.from_orm(reading))
    
    return results 