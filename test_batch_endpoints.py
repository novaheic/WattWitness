import requests
import json

# Test the new batch endpoints
def test_batch_endpoints():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing new batch processing endpoints...")
    
    # Test 1: Get unprocessed readings batch
    print("\n1️⃣ Testing unprocessed batch endpoint...")
    try:
        response = requests.get(f"{base_url}/api/v1/readings/unprocessed-batch/1?minutes=5")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data)} unprocessed readings")
            if len(data) > 0:
                print(f"   First reading: {data[0]}")
                print(f"   Last reading: {data[-1]}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error testing batch endpoint: {e}")
    
    # Test 2: Test batch update endpoint (with dummy data)
    print("\n2️⃣ Testing batch update endpoint...")
    try:
        # Get some real reading IDs first
        response = requests.get(f"{base_url}/api/v1/readings/unprocessed-batch/1?minutes=5")
        if response.status_code == 200:
            readings = response.json()
            if len(readings) > 0:
                # Use first few reading IDs for testing
                test_reading_ids = [readings[0]['id']] if len(readings) > 0 else [1, 2, 3]
                
                update_payload = {
                    "reading_ids": test_reading_ids,
                    "block_number": 12345
                }
                
                response = requests.put(
                    f"{base_url}/api/v1/readings/batch-update/test-batch-tx-123",
                    json=update_payload
                )
                
                print(f"Status Code: {response.status_code}")
                print(f"Response: {json.dumps(response.json(), indent=2)}")
                
                if response.status_code == 200:
                    print("✅ Batch update endpoint working!")
                else:
                    print(f"❌ Error: {response.text}")
            else:
                print("⚠️ No readings available for batch update test")
        else:
            print("❌ Could not fetch readings for batch update test")
    except Exception as e:
        print(f"❌ Error testing batch update: {e}")

if __name__ == "__main__":
    test_batch_endpoints() 