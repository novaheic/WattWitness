#!/usr/bin/env python3
"""
Database aggregation script for WattWitness
Processes confirmed on-chain readings and creates 10-minute aggregates
"""

import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.models import PowerReading, PowerReadingAggregate, SolarInstallation

load_dotenv()

# Get database URL from environment variable or use default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/wattwitness")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def round_to_10_minutes(timestamp):
    """Round Unix timestamp to 10-minute intervals"""
    return (timestamp // 600) * 600

def aggregate_readings():
    """Main aggregation function"""
    db = SessionLocal()
    
    try:
        print("🔍 Starting aggregation process...")
        
        # Find readings that are confirmed on-chain and older than 24 hours
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        confirmed_readings = db.query(PowerReading).filter(
            PowerReading.is_on_chain == True,
            PowerReading.created_at < cutoff_time
        ).all()
        
        print(f"📊 Found {len(confirmed_readings)} confirmed readings to process")
        
        if not confirmed_readings:
            print("✅ No readings to aggregate")
            return
        
        # Group readings by installation and 10-minute time buckets
        buckets = {}
        
        for reading in confirmed_readings:
            installation_id = reading.installation_id
            time_bucket = round_to_10_minutes(reading.timestamp)
            
            key = (installation_id, time_bucket)
            
            if key not in buckets:
                buckets[key] = []
            
            buckets[key].append(reading)
        
        print(f"📦 Created {len(buckets)} time buckets for aggregation")
        
        # Process each bucket
        aggregates_created = 0
        readings_processed = 0
        
        for (installation_id, time_bucket), readings in buckets.items():
            # Check if aggregate already exists
            existing = db.query(PowerReadingAggregate).filter(
                PowerReadingAggregate.installation_id == installation_id,
                PowerReadingAggregate.time_bucket == time_bucket
            ).first()
            
            if existing:
                print(f"⏭️  Aggregate already exists for bucket {time_bucket}")
                continue
            
            # Calculate aggregated values
            power_values = [r.power_w for r in readings]
            timestamps = [r.timestamp for r in readings]
            
            # Calculate energy production for this bucket
            total_energy = 0.0
            if len(readings) >= 2:
                for i in range(1, len(readings)):
                    curr = readings[i]
                    prev = readings[i-1]
                    time_diff_hours = (curr.timestamp - prev.timestamp) / 3600
                    avg_power = (curr.power_w + prev.power_w) / 2
                    energy = avg_power * time_diff_hours
                    total_energy += abs(energy)
            
            # Create aggregate record
            aggregate = PowerReadingAggregate(
                installation_id=installation_id,
                time_bucket=time_bucket,
                start_timestamp=min(timestamps),
                end_timestamp=max(timestamps),
                avg_power_w=sum(power_values) / len(power_values),
                min_power_w=min(power_values),
                max_power_w=max(power_values),
                total_energy_wh=total_energy,
                reading_count=len(readings),
                aggregated_at=datetime.utcnow()
            )
            
            db.add(aggregate)
            aggregates_created += 1
            readings_processed += len(readings)
            
            print(f"✅ Created aggregate for bucket {time_bucket}: {len(readings)} readings, {sum(power_values)/len(power_values):.1f}W avg")
        
        # Commit all aggregates
        db.commit()
        print(f"💾 Committed {aggregates_created} aggregates")
        
        # Now delete the processed readings
        if aggregates_created > 0:
            reading_ids = [r.id for r in confirmed_readings]
            deleted_count = db.query(PowerReading).filter(
                PowerReading.id.in_(reading_ids),
                PowerReading.is_on_chain == True,
                PowerReading.created_at < cutoff_time
            ).delete(synchronize_session=False)
            
            db.commit()
            print(f"🗑️  Deleted {deleted_count} processed readings")
        
        print(f"🎉 Aggregation complete!")
        print(f"   - Created: {aggregates_created} aggregates")  
        print(f"   - Processed: {readings_processed} readings")
        print(f"   - Deleted: {deleted_count} raw readings")
        
    except Exception as e:
        print(f"❌ Error during aggregation: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def show_stats():
    """Show database statistics"""
    db = SessionLocal()
    
    try:
        # Count raw readings
        total_readings = db.query(PowerReading).count()
        on_chain_readings = db.query(PowerReading).filter(PowerReading.is_on_chain == True).count()
        pending_readings = db.query(PowerReading).filter(PowerReading.is_on_chain == False).count()
        
        # Count aggregates
        total_aggregates = db.query(PowerReadingAggregate).count()
        
        print(f"📊 Database Statistics:")
        print(f"   Raw Readings: {total_readings}")
        print(f"   - On-chain: {on_chain_readings}")
        print(f"   - Pending: {pending_readings}")
        print(f"   Aggregates: {total_aggregates}")
        
        # Calculate potential savings
        if total_aggregates > 0:
            savings_ratio = (on_chain_readings / total_aggregates) if total_aggregates > 0 else 0
            print(f"   Compression ratio: {savings_ratio:.1f}:1")
        
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 WattWitness Data Aggregation Tool")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "stats":
        show_stats()
    else:
        show_stats()
        print()
        aggregate_readings() 