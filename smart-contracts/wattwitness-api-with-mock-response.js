// WattWitness API Fetcher with Mock Response
// Fetches real data from API but returns compact response under 256 bytes

// Configuration from args
const API_BASE_URL = args[0] || "http://localhost:8000";

console.log(`Fetching real data from WattWitness API: ${API_BASE_URL}`);

try {
    // Step 1: Fetch real data from WattWitness API for validation
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
        throw new Error("No data received from WattWitness API");
    }

    const realData = response.data;
    console.log(`✅ Successfully fetched ${realData.count || 0} real readings from WattWitness`);
    
    // Log some real data for monitoring (this shows in Chainlink Functions logs)
    if (realData.readings && realData.readings.length > 0) {
        const latest = realData.readings[realData.readings.length - 1];
        console.log(`📊 Latest real reading: ${latest[1]}W, ${latest[2]}Wh at ${new Date(latest[3] * 1000).toISOString()}`);
    }

    // Step 2: Return compact success signal for contract (under 256 bytes)
    const compactResponse = {
        success: true,
        count: realData.count || 0,
        timestamp: Math.floor(Date.now() / 1000),
        api_status: "ok"
    };
    
    const result = JSON.stringify(compactResponse);
    console.log(`📤 Returning compact response (${result.length} bytes):`, result);
    
    // Return as string for Chainlink Functions
    return Functions.encodeString(result);
    
} catch (error) {
    console.error("❌ Error fetching from WattWitness API:", error.message);
    
    // Return error signal (still under 256 bytes)
    const errorResponse = {
        success: false,
        error: error.message.substring(0, 50), // Truncate error message
        timestamp: Math.floor(Date.now() / 1000),
        api_status: "error"
    };
    
    const result = JSON.stringify(errorResponse);
    console.log(`📤 Returning error response (${result.length} bytes):`, result);
    
    return Functions.encodeString(result);
} 