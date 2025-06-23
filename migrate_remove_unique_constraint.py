#!/usr/bin/env python3
"""
Migration script to remove unique constraint from blockchain_tx_hash
This allows multiple readings to share the same transaction hash in batch processing
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def migrate_database():
    """Remove unique constraint from blockchain_tx_hash column"""
    
    # Database connection parameters (update these to match your setup)
    DB_HOST = "localhost"
    DB_NAME = "wattwitness"  # Update this to your database name
    DB_USER = "postgres"     # Update this to your database user
    DB_PASSWORD = ""         # Update this to your database password
    
    try:
        # Connect to database
        print("🔗 Connecting to database...")
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if constraint exists
        print("🔍 Checking for existing unique constraint...")
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'power_readings' 
            AND constraint_type = 'UNIQUE' 
            AND constraint_name LIKE '%blockchain_tx_hash%'
        """)
        
        constraints = cursor.fetchall()
        
        if constraints:
            constraint_name = constraints[0][0]
            print(f"✅ Found unique constraint: {constraint_name}")
            
            # Drop the unique constraint
            print("🗑️ Removing unique constraint...")
            cursor.execute(f"ALTER TABLE power_readings DROP CONSTRAINT {constraint_name}")
            print(f"✅ Successfully removed constraint: {constraint_name}")
        else:
            print("ℹ️ No unique constraint found on blockchain_tx_hash")
        
        # Verify the change
        print("🔍 Verifying the change...")
        cursor.execute("""
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'power_readings' 
            AND column_name = 'blockchain_tx_hash'
        """)
        
        column_info = cursor.fetchone()
        if column_info:
            print(f"✅ Column info: {column_info}")
        
        print("🎉 Migration completed successfully!")
        print("📝 Multiple readings can now share the same blockchain transaction hash")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        print("💡 Make sure to update the database connection parameters in this script")
        
    finally:
        if 'conn' in locals():
            conn.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    print("🚀 Starting database migration...")
    print("📝 This will remove the unique constraint from blockchain_tx_hash")
    print("⚠️ Make sure to update the database connection parameters below")
    print()
    
    migrate_database() 