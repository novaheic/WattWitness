#!/usr/bin/env python3
"""
Database migration script to add last_boot_timestamp column to solar_installations table.
Run this script to update your existing database schema.
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment variable or use default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/wattwitness")

def run_migration():
    """Add last_boot_timestamp column to solar_installations table"""
    
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
        
        # Check if column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'solar_installations' 
            AND column_name = 'last_boot_timestamp'
        """)
        
        if cursor.fetchone():
            print("✅ Column 'last_boot_timestamp' already exists")
            return True
        
        # Add the column
        print("🔧 Adding last_boot_timestamp column...")
        cursor.execute("""
            ALTER TABLE solar_installations 
            ADD COLUMN last_boot_timestamp BIGINT
        """)
        
        # Commit the changes
        conn.commit()
        print("✅ Successfully added last_boot_timestamp column")
        
        # Verify the column was added
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'solar_installations' 
            AND column_name = 'last_boot_timestamp'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✅ Verified: Column '{result[0]}' of type '{result[1]}' exists")
        else:
            print("❌ Column was not added successfully")
            return False
            
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting database migration...")
    success = run_migration()
    if success:
        print("🎉 Migration completed successfully!")
        print("💡 You can now restart your backend and test the boot timestamp feature.")
    else:
        print("💥 Migration failed!")
        print("💡 Please check your database connection and try again.") 