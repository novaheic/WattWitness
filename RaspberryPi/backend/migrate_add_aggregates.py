#!/usr/bin/env python3
"""
Database migration script to add power_reading_aggregates table.
Run this script to update your existing database schema.
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment variable or use default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/wattwitness")

def run_migration():
    """Add power_reading_aggregates table"""
    
    # Parse connection details from DATABASE_URL
    if DATABASE_URL.startswith('postgresql://'):
        # Extract connection details
        url_parts = DATABASE_URL.replace('postgresql://', '').split('@')
        if len(url_parts) == 2:
            auth_parts = url_parts[0].split(':')
            host_port_parts = url_parts[1].split('/')
            
            if len(auth_parts) >= 2 and len(host_port_parts) >= 2:
                username = auth_parts[0]
                password = auth_parts[1]
                host_port = host_port_parts[0].split(':')
                host = host_port[0]
                port = host_port[1] if len(host_port) > 1 else '5432'
                database = host_port_parts[1]
            else:
                print("❌ Invalid DATABASE_URL format")
                return False
        else:
            print("❌ Invalid DATABASE_URL format")
            return False
    else:
        print("❌ DATABASE_URL must start with postgresql://")
        return False
    
    try:
        # Connect to database
        print(f"🔌 Connecting to database: {host}:{port}/{database}")
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password
        )
        
        cursor = conn.cursor()
        
        # Check if table already exists
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'power_reading_aggregates'
        """)
        
        if cursor.fetchone():
            print("✅ Table 'power_reading_aggregates' already exists")
            return True
        
        # Create the aggregates table
        print("🔧 Creating power_reading_aggregates table...")
        cursor.execute("""
            CREATE TABLE power_reading_aggregates (
                id SERIAL PRIMARY KEY,
                installation_id INTEGER NOT NULL REFERENCES solar_installations(id),
                time_bucket BIGINT NOT NULL,
                start_timestamp BIGINT NOT NULL,
                end_timestamp BIGINT NOT NULL,
                avg_power_w REAL,
                min_power_w REAL,
                max_power_w REAL,
                total_energy_wh REAL,
                reading_count INTEGER,
                blockchain_tx_hash VARCHAR,
                blockchain_block_number INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                aggregated_at TIMESTAMP
            )
        """)
        
        # Create indexes for better performance
        print("📊 Creating indexes...")
        cursor.execute("""
            CREATE INDEX idx_aggregates_installation_time 
            ON power_reading_aggregates(installation_id, time_bucket)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_aggregates_time_bucket 
            ON power_reading_aggregates(time_bucket)
        """)
        
        cursor.execute("""
            CREATE UNIQUE INDEX idx_aggregates_unique_bucket 
            ON power_reading_aggregates(installation_id, time_bucket)
        """)
        
        # Commit the changes
        conn.commit()
        print("✅ Successfully created power_reading_aggregates table")
        
        # Verify the table was created
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'power_reading_aggregates'
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        if columns:
            print(f"✅ Verified: Table created with {len(columns)} columns:")
            for column_name, data_type in columns:
                print(f"   - {column_name}: {data_type}")
        else:
            print("❌ Table was not created successfully")
            return False
            
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

def show_tables():
    """Show current database tables"""
    if DATABASE_URL.startswith('postgresql://'):
        url_parts = DATABASE_URL.replace('postgresql://', '').split('@')
        auth_parts = url_parts[0].split(':')
        host_port_parts = url_parts[1].split('/')
        username = auth_parts[0]
        password = auth_parts[1]
        host_port = host_port_parts[0].split(':')
        host = host_port[0]
        port = host_port[1] if len(host_port) > 1 else '5432'
        database = host_port_parts[1]
        
        try:
            conn = psycopg2.connect(
                host=host, port=port, database=database, 
                user=username, password=password
            )
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            
            tables = cursor.fetchall()
            print("📋 Current database tables:")
            for table in tables:
                print(f"   - {table[0]}")
                
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error showing tables: {e}")

if __name__ == "__main__":
    print("🚀 WattWitness Database Migration - Add Aggregates Table")
    print("=" * 60)
    
    print("\n📋 Current database state:")
    show_tables()
    
    print(f"\n🔧 Starting migration...")
    success = run_migration()
    
    if success:
        print(f"\n🎉 Migration completed successfully!")
        print("💡 Next steps:")
        print("   1. Restart your backend")
        print("   2. Test the new /optimized endpoint")
        print("   3. Run aggregation script: python aggregate_readings.py")
        
        print(f"\n📋 Updated database state:")
        show_tables()
    else:
        print(f"\n💥 Migration failed!")
        print("💡 Please check your database connection and try again.") 