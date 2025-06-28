// Mock Solar Data Function for WattWitness
// Simulates the API response format without HTTP requests

console.log("Starting mock solar data function...");

try {
    // Simulate realistic solar readings data
    const mockReadings = [
        [1, 1520.5, 25000.0, Math.floor(Date.now() / 1000) - 300, "mock_esp32_signature_1"],
        [2, 1680.2, 26680.2, Math.floor(Date.now() / 1000) - 290, "mock_esp32_signature_2"],
        [3, 1450.8, 28131.0, Math.floor(Date.now() / 1000) - 280, "mock_esp32_signature_3"],
        [4, 1590.3, 29721.3, Math.floor(Date.now() / 1000) - 270, "mock_esp32_signature_4"],
        [5, 1720.1, 31441.4, Math.floor(Date.now() / 1000) - 260, "mock_esp32_signature_5"]
    ];
    
    // Simulate the WattWitness API response format
    const mockApiResponse = {
        readings: mockReadings,
        first_reading_id: 1,
        last_reading_id: 5,
        count: mockReadings.length
    };
    
    console.log(`Mock data: ${mockApiResponse.count} solar readings generated`);
    console.log("Power readings range:", mockReadings[0][1], "W to", mockReadings[mockReadings.length-1][1], "W");
    
    // Return as bytes using TextEncoder (same as working test function)
    const result = new TextEncoder().encode(JSON.stringify(mockApiResponse));
    
    console.log("Encoded mock solar data, length:", result.length);
    
    return result;
    
} catch (error) {
    console.error("Error in mock solar data function:", error.message);
    throw new Error(`Mock solar data function failed: ${error.message}`);
} 