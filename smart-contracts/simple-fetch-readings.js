// Simple WattWitness Reading Fetcher
// Fetches pending readings from WattWitness API for on-chain storage

// Configuration from args
// Change this based on the public URL of the WattWitness API
const API_BASE_URL = args[0] || "https://f434-37-168-28-41.ngrok-free.app";

console.log(`Fetching pending readings from ${API_BASE_URL}`);

try {
    // Fetch pending readings from WattWitness API
    const apiUrl = `${API_BASE_URL}/api/v1/readings/pending`;
    
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await Functions.makeHttpRequest({
        url: apiUrl,
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    console.log(`HTTP Response status: ${response.status}`);
    
    if (!response.data) {
        throw new Error("No data received from pending readings API");
    }

    const pendingData = response.data;
    console.log(`Received ${pendingData.count} pending readings`);

    // Check if there are any pending readings
    if (pendingData.count === 0) {
        console.log("No pending readings found");
        // Return consistent JSON structure even when empty
        return new TextEncoder().encode(JSON.stringify({
            readings: [],
            count: 0,
            first_reading_id: null,
            last_reading_id: null
        }));
    }

    // Return the readings data as JSON string for the contract to parse
    console.log(`Returning ${pendingData.count} readings for on-chain storage`);
    
    return new TextEncoder().encode(JSON.stringify(pendingData));

} catch (error) {
    console.error("Error fetching pending readings:", error.message);
    throw new Error(`Failed to fetch pending readings: ${error.message}`);
} 