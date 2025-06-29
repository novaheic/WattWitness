#!/usr/bin/env python3
"""
Database migration script to add logger_contract_address and deployment_tx_hash columns
 to solar_installations table. Run once after pulling new code.
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/wattwitness")

NEW_COLUMNS = {
    "logger_contract_address": "VARCHAR(42)",
    "deployment_tx_hash": "VARCHAR(66)",
}

def run_migration() -> bool:
    """Perform migration if columns missing."""
    if not DATABASE_URL.startswith("postgresql://"):
        print("❌ DATABASE_URL must start with postgresql://")
        return False

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        for col, col_type in NEW_COLUMNS.items():
            cursor.execute(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'solar_installations' AND column_name = %s
                """,
                (col,),
            )
            if cursor.fetchone():
                print(f"✅ Column '{col}' already exists")
                continue

            print(f"🔧 Adding column {col} ...")
            cursor.execute(
                f"ALTER TABLE solar_installations ADD COLUMN {col} {col_type}"
            )
            conn.commit()
            print(f"✅ Added column {col}")

        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"💥 Migration failed: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Starting logger columns migration ...")
    success = run_migration()
    if success:
        print("🎉 Migration finished successfully!")
    else:
        print("💥 Migration did not complete. Check errors above.") 