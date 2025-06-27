// Compact Mock Solar Data Function for WattWitness - Chainlink Functions Compatible
// Returns encoded data within 256-byte limit

console.log("Starting compact mock solar data function...");

try {
    // Simple success indicator - just return a single latest reading
    // Format: [reading_id, power_w, total_wh, timestamp]
    const latestReading = [
        Math.floor(Math.random() * 100) + 1, // reading_id
        Math.floor(Math.random() * 500) + 1200, // power_w (1200-1700W)
        Math.floor(Math.random() * 10000) + 20000, // total_wh (20-30kWh)
        Math.floor(Date.now() / 1000) // current timestamp
    ];
    
    console.log("Latest reading:", latestReading);
    
    // Return as compact JSON string (much smaller than full API response)
    const compactResponse = {
        id: latestReading[0],
        power: latestReading[1],
        energy: latestReading[2],
        time: latestReading[3],
        status: "ok"
    };
    
    const result = JSON.stringify(compactResponse);
    console.log("Compact result length:", result.length, "bytes");
    
    // Return as string for Chainlink Functions
    return Functions.encodeString(result);
    
} catch (error) {
    console.error("Error in compact mock solar data function:", error.message);
    throw new Error(`Compact mock function failed: ${error.message}`);
} 