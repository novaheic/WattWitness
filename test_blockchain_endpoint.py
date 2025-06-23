import requests
import json

# Test the blockchain update endpoint
def test_blockchain_endpoint():
    url = "http://localhost:8000/api/v1/blockchain/update"
    
    # Test payload
    payload = {
        "tx_hash": "test123",
        "timestamp": 1750522800,
        "installation_id": 1,
        "block_number": 12345
    }
    
    try:
        print("🧪 Testing blockchain update endpoint...")
        print(f"URL: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Endpoint test successful!")
        else:
            print("❌ Endpoint test failed!")
            
    except Exception as e:
        print(f"❌ Error testing endpoint: {e}")

if __name__ == "__main__":
    test_blockchain_endpoint() 